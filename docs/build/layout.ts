import { THEME_STORAGE_KEY } from '../src/shared/storage-keys';
import { LANGUAGES, UI_TEXT, type Language } from '../src/shared/ui-text';
import { HOME_FILE, pageUrl } from './content';
import type { Edition } from './editions';
import { escapeHtml } from './html';
import type { Heading } from './markdown';

/** A link of the sidebar, maybe with links under it. */
export interface SidebarLink {
  readonly title: string;
  readonly url: string;
  /** Code-like titles, such as entry points, are set in the monospace font. */
  readonly code?: boolean;
  readonly children?: readonly SidebarLink[];
}

export interface SidebarGroup {
  readonly title: string;
  readonly links: readonly SidebarLink[];
}

export interface PageLink {
  readonly title: string;
  readonly url: string;
}

/** Everything a page of the site is made of. */
export interface LayoutPage {
  readonly edition: Edition;
  readonly language: Language;
  readonly url: string;
  readonly title: string;
  /** The article. */
  readonly html: string;
  /** The language of the article, the source language while the page is not translated. */
  readonly contentLanguage: Language;
  /** The headings of the article; the `##` and `###` ones make the table of contents. */
  readonly headings: readonly Heading[];
  /** The page in every language. */
  readonly alternates: Readonly<Record<Language, string>>;
  readonly sidebar: readonly SidebarGroup[];
  readonly previous: PageLink | null;
  readonly next: PageLink | null;
  readonly searchIndexUrl: string;
  readonly repository: string;
  /** Shown above the article, such as the note of an untranslated page. */
  readonly notice?: string;
}

const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  system: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>',
  language: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
  github:
    '<path d="M9 19c-4.5 1.4-4.5-2.2-6.3-2.7m12.6 4.5v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.9 5.8 3.2 5.8 3.2a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9.6c0 4.7 2.8 5.7 5.5 6a3 3 0 0 0-.8 2.3v3.4"/>'
} as const;

/** Kumo Charts' logo, as on its website: its mark on a rounded square, in the text's colors. */
const LOGO =
  '<svg class="brand-logo" width="24" height="24" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7"/><path transform="translate(5 8.45) scale(0.22)" d="M74.2 0 98.9 0 99.7 0.3 100 0.9 100 14.8 99.6 16 98.7 17 97.1 17.6 75.2 17.6 74 18.1 40.6 51.9 39 52.5 21.4 52.5 20.7 52.7 18.9 54.2 5 68 3.3 68.7 0.7 68.7 0.1 68.2 0 23.8 0.8 21.8 1.8 20.7 3 20 4.2 19.6 19.4 19.6 20.4 20.3 20.6 20.7 20.6 44.9 21.1 45.5 22.1 45.6 54.9 14.7 68.4 1.5 70.7 0.3ZM72.4 34.4 73.3 34.5 73.8 35.1 73.8 65.9 73.3 67 72.2 68.1 70.7 68.7 52.6 68.6 52.1 68.1 52 58.2 52.1 54.1 52.5 53.5Z"/></svg>';

export function icon(name: keyof typeof ICONS): string {
  // Sized here too: before the stylesheet, an icon without a size fills the page.
  return `<svg class="icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

/**
 * Sets the theme before the page paints: the stored choice, or the system's. The client keeps
 * it in step afterwards.
 */
export function themeScript(): string {
  return `<script>(()=>{let p=null;try{p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch{}const r=document.documentElement;r.dataset.themePreference=p??'system';r.dataset.theme=p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'})()</script>`;
}

/**
 * Keeps the page hidden until its script has set it up, which then fades it in, rather than
 * showing it half styled; without scripts it shows at once.
 */
const HIDDEN_UNTIL_READY =
  '<style>html:not([data-ready]) body{opacity:0}</style><noscript><style>body{opacity:1!important}</style></noscript>';

/** The `<head>` shared by the pages of the site. */
export function head(title: string, language: Language): string {
  return [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    themeScript(),
    HIDDEN_UNTIL_READY,
    '<script type="module" src="/src/client/main.ts"></script>',
    `<meta name="docs-language" content="${language}" />`
  ].join('\n');
}

function sidebarLink(link: SidebarLink, current: string): string {
  const active = link.url === current;
  const label = link.code ? `<code>${escapeHtml(link.title)}</code>` : escapeHtml(link.title);
  const children = link.children?.length
    ? `<ul>${link.children.map((child) => sidebarLink(child, current)).join('')}</ul>`
    : '';
  return `<li><a href="${escapeHtml(link.url)}"${active ? ' aria-current="page"' : ''}>${label}</a>${children}</li>`;
}

export function sidebar(groups: readonly SidebarGroup[], current: string): string {
  return groups
    .map(
      (group) =>
        `<section class="sidebar-group"><h2>${escapeHtml(group.title)}</h2><ul>${group.links
          .map((link) => sidebarLink(link, current))
          .join('')}</ul></section>`
    )
    .join('');
}

function toc(page: LayoutPage): string {
  const items = page.headings.filter((heading) => heading.level === 2 || heading.level === 3);

  if (items.length === 0) {
    return '';
  }

  const text = UI_TEXT[page.language];
  return `<aside class="toc" aria-label="${escapeHtml(text.onThisPage)}"><p class="toc-title">${escapeHtml(text.onThisPage)}</p><ul>${items
    .map(
      (heading) =>
        `<li class="toc-level-${heading.level}"><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`
    )
    .join('')}</ul></aside>`;
}

function pager(page: LayoutPage): string {
  if (!page.previous && !page.next) {
    return '';
  }

  const text = UI_TEXT[page.language];
  const link = (item: PageLink | null, kind: 'previous' | 'next') =>
    item
      ? `<a class="pager-${kind}" href="${escapeHtml(item.url)}" rel="${kind === 'previous' ? 'prev' : 'next'}"><span>${escapeHtml(text[kind])}</span>${escapeHtml(item.title)}</a>`
      : '<span></span>';
  return `<nav class="pager" aria-label="${escapeHtml(`${text.previous} / ${text.next}`)}">${link(page.previous, 'previous')}${link(page.next, 'next')}</nav>`;
}

function themeMenu(language: Language): string {
  const text = UI_TEXT[language];
  const option = (value: string, label: string, name: 'system' | 'sun' | 'moon') =>
    `<button type="button" role="menuitemradio" aria-checked="false" data-theme-option="${value}">${icon(name)}${escapeHtml(label)}</button>`;
  return [
    '<div class="popup">',
    `<button class="icon-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="${escapeHtml(text.theme)}" title="${escapeHtml(text.theme)}" data-theme-toggle>`,
    `<span class="theme-icon-light">${icon('sun')}</span><span class="theme-icon-dark">${icon('moon')}</span>`,
    '</button>',
    `<div class="menu" role="menu" hidden>${option('system', text.themeSystem, 'system')}${option('light', text.themeLight, 'sun')}${option('dark', text.themeDark, 'moon')}</div>`,
    '</div>'
  ].join('');
}

/** The name of an edition in a language, such as `Kumo Charts 商业版`. */
export function editionName(language: Language, edition: Edition): string {
  const text = UI_TEXT[language];
  return edition === 'open' ? text.nameOpen : text.nameCommercial;
}

/** The switch between the editions, to the home page of each in the language shown. */
function editionSwitch(language: Language, edition: Edition): string {
  const text = UI_TEXT[language];
  const link = (item: Edition, label: string, url: string) =>
    `<a href="${escapeHtml(url)}"${item === edition ? ' aria-current="true"' : ''} data-edition="${item}">${escapeHtml(label)}</a>`;
  return `<nav class="edition-switch" aria-label="${escapeHtml(text.edition)}">${link('open', text.editionOpen, pageUrl(language, HOME_FILE, 'open'))}${link('commercial', text.editionCommercial, pageUrl(language, HOME_FILE, 'commercial'))}</nav>`;
}

/**
 * The bar on top of every page: menu, brand, the switch between the editions, search, language,
 * theme and repository.
 */
export function topbar(
  language: Language,
  alternates: Readonly<Record<Language, string>>,
  repository: string,
  edition: Edition
): string {
  const text = UI_TEXT[language];
  const options = LANGUAGES.map(
    (item) =>
      `<a role="menuitemradio" aria-checked="${item === language}" href="${escapeHtml(alternates[item])}" hreflang="${item}" lang="${item}" data-language="${item}">${escapeHtml(UI_TEXT[item].languageName)}</a>`
  ).join('');
  const languages = [
    '<div class="popup">',
    `<button class="language-switch" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="${escapeHtml(text.language)}" title="${escapeHtml(text.language)}" data-language-toggle>${icon('language')}<span>${escapeHtml(text.languageName)}</span></button>`,
    `<div class="menu" role="menu" hidden>${options}</div>`,
    '</div>'
  ].join('');
  return [
    '<header class="topbar">',
    `<button class="icon-button menu-toggle" type="button" aria-controls="sidebar" aria-expanded="false" aria-label="${escapeHtml(text.menu)}" data-menu-toggle>${icon('menu')}</button>`,
    `<a class="brand" href="${escapeHtml(pageUrl(language, HOME_FILE, 'open'))}">${LOGO}<span class="brand-name">Kumo Charts</span></a>`,
    editionSwitch(language, edition),
    `<button class="search-button" type="button" data-search-open>${icon('search')}<span>${escapeHtml(text.search)}</span><kbd data-search-shortcut>Ctrl K</kbd></button>`,
    '<div class="topbar-actions">',
    languages,
    themeMenu(language),
    `<a class="icon-button repository-link" href="${escapeHtml(repository)}" aria-label="GitHub" title="GitHub">${icon('github')}</a>`,
    '</div>',
    '</header>'
  ].join('');
}

function searchDialog(language: Language): string {
  const text = UI_TEXT[language];
  return [
    `<dialog class="search" aria-label="${escapeHtml(text.search)}" data-search>`,
    '<div class="search-field">',
    icon('search'),
    `<input type="search" placeholder="${escapeHtml(text.searchPlaceholder)}" aria-label="${escapeHtml(text.searchPlaceholder)}" autocomplete="off" spellcheck="false" data-search-input />`,
    `<button class="search-close" type="button" aria-label="${escapeHtml(text.closeSearch)}" data-search-close>Esc</button>`,
    '</div>',
    '<div class="search-results" role="listbox" data-search-results></div>',
    `<p class="search-hint">${escapeHtml(text.searchHint)}</p>`,
    '</dialog>'
  ].join('');
}

/** A whole page of the documentation. */
export function renderLayout(page: LayoutPage): string {
  const text = UI_TEXT[page.language];
  const alternates = LANGUAGES.filter((language) => language !== page.language)
    .map(
      (language) =>
        `<link rel="alternate" hreflang="${language}" href="${escapeHtml(page.alternates[language])}" />`
    )
    .join('\n');
  const notice = page.notice ? `<p class="notice">${escapeHtml(page.notice)}</p>` : '';
  // A home page titled with its edition's name is not named twice.
  const name = editionName(page.language, page.edition);
  const title = page.title === name ? name : `${page.title} · ${name}`;

  return `<!doctype html>
<html lang="${page.language}">
<head>
${head(title, page.language)}
<meta name="docs-search-index" content="${escapeHtml(page.searchIndexUrl)}" />
${alternates}
</head>
<body>
<a class="skip-link" href="#content">${escapeHtml(text.skipToContent)}</a>
${topbar(page.language, page.alternates, page.repository, page.edition)}
<div class="layout">
<nav id="sidebar" class="sidebar" aria-label="${escapeHtml(text.menu)}">${sidebar(page.sidebar, page.url)}</nav>
<div class="sidebar-backdrop" data-menu-close hidden></div>
<div class="panel">
<main id="content" class="main">
${notice}
<article class="prose" lang="${page.contentLanguage}">
${page.html}
</article>
${pager(page)}
</main>
${toc(page)}
</div>
</div>
${searchDialog(page.language)}
</body>
</html>
`;
}
