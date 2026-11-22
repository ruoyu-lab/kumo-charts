# Colors and fonts

When `upColor` and `accentColor` are enough, use them. To match the website's colors, change the colors of each theme with `themes`: `tokens` are the design variables of the interface (CSS custom properties, without the `--`), and `chart` the colors of the chart itself (the library's `Theme`).

```ts
createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  theme: 'dark',
  fontFamily: '"HarmonyOS Sans", system-ui, sans-serif',
  themes: {
    dark: {
      tokens: {
        'app-bg': '#0b0e11',
        panel: '#161a1e',
        border: '#2b3139',
        accent: '#f0b90b',
        'accent-text': '#0b0e11'
      },
      chart: { background: '#161a1e', up: '#0ecb81', down: '#f6465d' }
    }
  }
});
```

The main design variables: `app-bg` (the outermost background), `panel` (the background of the top bar and the drawing toolbar), `panel-raised` (menus and windows), `border` (dividers), `text`, `muted` (secondary text), `faint` (fainter text), `accent`, `accent-strong` and `accent-text` (the main color, and text on it), `up` and `down` (the up and down colors of the interface), `hover`, `selected-bg` and `selected-text` (hovered and selected) and `radius` (rounded corners). They are all in `THEME_TOKENS`. The colors of the chart: `background`, `grid`, `text`, `up`, `down`, `volumeUp`, `volumeDown`, `accent`, `crosshair`, `palette` (the colors indicator lines take in turn) and others.

`upColor: 'red'` swaps the up and down colors first, and the colors given in `themes` go on top of that. The colors the user changes in the chart settings (the background, grid and bar colors of each chart) come first.

## Changing styles with CSS

The chart is in a Shadow DOM, which the page's styles do not get into, but these parts can be selected with `::part()`: `topbar` (the top bar), `drawing-toolbar` (the drawing toolbar), `chart-area` (the area of all the charts), `chart` (each chart) and `custom-button` (the page's own buttons).

```css
kumo-pro-chart::part(topbar) {
  border-bottom-width: 2px;
}

kumo-pro-chart::part(custom-button) {
  font-weight: 600;
}
```

The `kumo-pro-chart` element itself (the one in the container) can take borders, rounded corners and the like directly. Change colors with `themes`, not CSS: it changes the colors of the chart itself too, and follows when the theme switches.
