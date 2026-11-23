import { createHash } from 'node:crypto';
import { siteUrl } from '../src/shared/base';
import type { SearchIndex } from '../src/shared/search';
import type { Language } from '../src/shared/ui-text';
import { EDITION_DIRECTORY, type Edition } from './editions';
import type { TextSection } from './markdown';

/** A page as the search sees it. */
export interface SearchPage {
  readonly title: string;
  readonly url: string;
  readonly sections: readonly TextSection[];
}

export function buildSearchIndex(pages: readonly SearchPage[]): SearchIndex {
  return {
    pages: pages.map((page) => ({ title: page.title, url: page.url })),
    records: pages.flatMap((page, position) =>
      page.sections.map(
        (section) => [position, section.anchor, section.heading, section.text] as const
      )
    )
  };
}

/**
 * The index of a language of an edition as a file named by its content, so that it can be cached
 * for ever: `/docs/search/zh-CN.….json` for the library's, `/docs/search/commercial/zh-CN.….json`.
 */
export function searchIndexFile(
  language: Language,
  edition: Edition,
  index: SearchIndex
): { url: string; json: string } {
  const json = JSON.stringify(index);
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 10);
  const directory = EDITION_DIRECTORY[edition] === '' ? '' : `${EDITION_DIRECTORY[edition]}/`;
  return { url: siteUrl(`search/${directory}${language}.${hash}.json`), json };
}
