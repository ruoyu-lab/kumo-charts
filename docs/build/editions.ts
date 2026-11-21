/**
 * The editions of the documentation, each with pages and a navigation of its own: the open-source
 * library, Kumo Charts, at `/zh-CN/…`, and the commercial components built on it at
 * `/zh-CN/commercial/…`.
 */
export const EDITIONS = ['open', 'commercial'] as const;

export type Edition = (typeof EDITIONS)[number];

/**
 * Where an edition's pages are, in the docs directory before its languages and in its addresses
 * after them: nothing for the library's.
 */
export const EDITION_DIRECTORY: Readonly<Record<Edition, string>> = {
  open: '',
  commercial: 'commercial'
};

/**
 * The edition of a path in the docs directory, by its parts, and the parts after the edition's
 * directory: `commercial/zh-CN/data.md` is the commercial edition's `zh-CN/data.md`.
 */
export function editionOf(parts: readonly string[]): {
  readonly edition: Edition;
  readonly rest: readonly string[];
} {
  const [first, ...rest] = parts;
  return first === EDITION_DIRECTORY.commercial
    ? { edition: 'commercial', rest }
    : { edition: 'open', rest: parts };
}
