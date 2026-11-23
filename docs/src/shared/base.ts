/** Where the site is served, `kumocharts.com/docs/`: every address of the site starts with it. */
export const BASE = '/docs/';

/** The address of a path of the site: `zh-CN/data/` is `/docs/zh-CN/data/`. */
export function siteUrl(path: string): string {
  return `${BASE}${path}`;
}

/**
 * The path of an address of the site, as the site's files are laid out: `/docs/zh-CN/data/` is
 * `zh-CN/data/`; `null` for an address outside the site.
 */
export function sitePath(url: string): string | null {
  return url.startsWith(BASE) ? url.slice(BASE.length) : null;
}
