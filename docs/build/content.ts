import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES, SOURCE_LANGUAGE, type Language } from '../src/shared/ui-text';
import type { SiteConfig } from './config';
import { EDITION_DIRECTORY, EDITIONS, type Edition } from './editions';
import { navPages, parseNav, type Nav } from './nav';
import { displayPath, type Problems } from './problems';

/** The home page of each language of an edition, outside the navigation. */
export const HOME_FILE = 'index.md';

/** A Markdown file of the documentation. */
export interface SourceFile {
  readonly edition: Edition;
  readonly language: Language;
  /** Path in the language's directory of the edition, such as `data.md`. */
  readonly file: string;
  /** Absolute path. */
  readonly path: string;
  readonly text: string;
}

/** A page of the site in one language. */
export interface PageEntry {
  readonly edition: Edition;
  readonly language: Language;
  readonly file: string;
  readonly url: string;
  /** What the page shows: its own file, or the source language's while it is not translated. */
  readonly source: SourceFile;
  readonly translated: boolean;
  /** The title in the navigation; `null` for the home page. */
  readonly navTitle: string | null;
}

/** An edition of the documentation: its navigation, and the pages of it not written yet. */
export interface EditionContent {
  readonly edition: Edition;
  readonly nav: Nav;
  readonly planned: ReadonlySet<string>;
}

export interface Content {
  /** The editions the documentation has: the library's, and the commercial one when it has a navigation. */
  readonly editions: readonly EditionContent[];
  /**
   * Every page of every edition and language: by edition, then by language, the home page, then
   * the navigation's pages in order.
   */
  readonly pages: readonly PageEntry[];
}

/**
 * The address of a page of an edition: `/zh-CN/` for the library's home page, `/zh-CN/data/` for
 * its `data.md`, `/zh-CN/commercial/data/` for the commercial edition's.
 */
export function pageUrl(language: Language, file: string, edition: Edition): string {
  const directory = EDITION_DIRECTORY[edition];
  const path = file.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '/');
  return `/${language}/${directory === '' ? '' : `${directory}/`}${path}`;
}

/** The directory of an edition's navigation and languages. */
export function editionDirectory(config: SiteConfig, edition: Edition): string {
  return join(config.docsDir, EDITION_DIRECTORY[edition]);
}

/** The Markdown files of a directory and its subdirectories, as paths relative to it. */
function markdownFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith('.md'))
    .map((path) => path.split('\\').join('/'))
    .sort();
}

/**
 * Reads the navigation and the pages of an edition. Every written page must be in the navigation
 * and every translation must have a source page; pages of the navigation not written yet are left
 * out with a warning.
 */
function loadEdition(
  config: SiteConfig,
  edition: Edition,
  navPath: string,
  problems: Problems
): { content: EditionContent; pages: PageEntry[] } {
  const directory = editionDirectory(config, edition);
  const nav = parseNav(JSON.parse(readFileSync(navPath, 'utf8')) as unknown);
  const listed = navPages(nav);
  const files = new Map<Language, Set<string>>(
    LANGUAGES.map((language) => [language, new Set(markdownFiles(join(directory, language)))])
  );
  const source = files.get(SOURCE_LANGUAGE) ?? new Set<string>();
  const listedFiles = new Set(listed.map((page) => page.file));
  const planned = new Set<string>();

  if (
    edition !== 'open' &&
    nav.groups.some((group) => group.items.some((item) => item.kind === 'api'))
  ) {
    problems.error(
      navPath,
      undefined,
      "the API reference is the library's: only its navigation has it"
    );
  }

  if (!source.has(HOME_FILE)) {
    problems.error(
      join(directory, SOURCE_LANGUAGE, HOME_FILE),
      undefined,
      'the home page is missing'
    );
  }

  for (const file of source) {
    if (file !== HOME_FILE && !listedFiles.has(file)) {
      problems.error(
        join(directory, SOURCE_LANGUAGE, file),
        undefined,
        `the page is not in ${displayPath(config.siteDir, navPath)}; add it to a group`
      );
    }
  }

  for (const language of LANGUAGES) {
    for (const file of files.get(language) ?? []) {
      if (language !== SOURCE_LANGUAGE && !source.has(file)) {
        problems.error(
          join(directory, language, file),
          undefined,
          `the translation has no ${SOURCE_LANGUAGE} page ${SOURCE_LANGUAGE}/${file}`
        );
      }
    }
  }

  for (const page of listed) {
    if (!source.has(page.file)) {
      planned.add(page.file);
    }
  }

  if (planned.size > 0) {
    problems.warn(
      navPath,
      undefined,
      `${planned.size} page${planned.size === 1 ? ' is' : 's are'} not written yet and left out of the site: ${[...planned].join(', ')}`
    );
  }

  const read = (language: Language, file: string): SourceFile => {
    const path = join(directory, language, file);
    return { edition, language, file, path, text: readFileSync(path, 'utf8') };
  };

  const pages: PageEntry[] = [];
  const entries = [
    { file: HOME_FILE, title: null },
    ...listed
      .filter((page) => !planned.has(page.file))
      .map((page) => ({ file: page.file, title: page.title }))
  ];

  for (const language of LANGUAGES) {
    for (const entry of entries) {
      if (!source.has(entry.file)) {
        continue;
      }

      const translated = files.get(language)?.has(entry.file) ?? false;
      pages.push({
        edition,
        language,
        file: entry.file,
        url: pageUrl(language, entry.file, edition),
        source: read(translated ? language : SOURCE_LANGUAGE, entry.file),
        translated,
        navTitle: entry.title === null ? null : entry.title[language]
      });
    }
  }

  return { content: { edition, nav, planned }, pages };
}

/**
 * Reads the editions of the documentation: the library's, whose navigation it must have, and the
 * commercial one where its directory has a navigation.
 */
export function loadContent(config: SiteConfig, problems: Problems): Content {
  const editions: EditionContent[] = [];
  const pages: PageEntry[] = [];

  for (const edition of EDITIONS) {
    const navPath = join(editionDirectory(config, edition), 'nav.json');

    if (edition !== 'open' && !existsSync(navPath)) {
      continue;
    }

    const loaded = loadEdition(config, edition, navPath, problems);
    editions.push(loaded.content);
    pages.push(...loaded.pages);
  }

  return { editions, pages };
}

/** The pages of a language without a translation of their own, for the translators. */
export function missingTranslations(content: Content, language: Language): PageEntry[] {
  return content.pages.filter((page) => page.language === language && !page.translated);
}
