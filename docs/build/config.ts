import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Where the site reads its pages and the library from, and where links to the library's repository go. */
export interface SiteConfig {
  /** The checkout of the library, whose sources the API reference and the code of the pages use. */
  readonly chartsRoot: string;
  /** The directory with `nav.json` and one directory of pages per language. */
  readonly docsDir: string;
  /** The site's folder, `docs`, which the paths of its problems are relative to. */
  readonly siteDir: string;
  /** The repository on GitHub, such as `https://github.com/ruoyu-lab/kumo-charts`. */
  readonly repository: string;
  /** The branch links to the repository point at. */
  readonly branch: string;
}

const siteDir = resolve(import.meta.dirname, '..');
/** The library this site is in and documents: the root of its repository. */
const chartsRoot = resolve(siteDir, '..');

/** The repository URL from the core package, without `git+` and `.git`. */
function repositoryUrl(): string {
  const manifest = JSON.parse(
    readFileSync(join(chartsRoot, 'packages/core/package.json'), 'utf8')
  ) as { repository: { url: string } };
  return manifest.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
}

/**
 * The configuration of the site. `docsDir` is relative to the site's folder: `content` for the
 * documentation, or the pages of the tests.
 */
export function siteConfig(docsDir = 'content'): SiteConfig {
  return {
    chartsRoot,
    docsDir: resolve(siteDir, docsDir),
    siteDir,
    repository: repositoryUrl(),
    branch: 'main'
  };
}
