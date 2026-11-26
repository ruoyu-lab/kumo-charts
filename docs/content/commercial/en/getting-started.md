# Quick start

Install it with npm:

```bash
npm install @kumo-charts/pro-chart
```

On your own computer's development servers it needs no license key; on a website or in an app it needs one, see ["License"](license.md).

```ts
import { createProChart } from '@kumo-charts/pro-chart';

const chart = createProChart(document.getElementById('chart')!, {
  datafeed: myDatafeed, // see "Market data" below
  symbol: '600519.SH'
});
```

The chart fills its container, so give the container a height. It lives in a Shadow DOM of its own: the page's styles do not reach the chart, and the chart's styles do not reach the page; a page can have several of them.

A few more of the options most often used:

```ts
const chart = createProChart(container, {
  datafeed: myDatafeed,
  symbol: '600519.SH',
  upColor: 'red', // red up, green down
  accentColor: '#c2410c', // the brand's color
  brand: { name: 'Acme Securities', logo: '/logo.svg', href: '/' },
  licenseKey: 'KCS1.…'
});

// The page's own symbol list, buttons and so on switch the chart through its methods.
watchlist.on('select', (id) => chart.setSymbol(id));

// When an alert fires, the page sends the notification itself.
chart.on('alert', (event) => {
  push(event.title, event.body); // such as "Alert" and "Kweichow Moutai Crossing up 1,688.00"
});
```

Further on is customizing: adding your own buttons and context menu items (a "Place order", say), registering your own indicators, following the website's colors, working indicators, layouts and replay through methods, and keeping the whole state of the chart on your own server. Each has a page of its own after this one.

## A plain web page

A page without Vue, React or a bundler imports the package's single bundled ES module, `dist/browser/pro-chart.js`, from a CDN: the chart, the Vue runtime and the commercial components are all in it, so it depends on no framework; it is about 1.3 MB minified, about 420 KB gzipped. On a production site, put the version in the address (`@kumo-charts/pro-chart@version/…`), so that it does not change when a new version is released.

```html
<div id="chart" style="height: 600px"></div>
<script type="module">
  import { createProChart } from 'https://cdn.jsdelivr.net/npm/@kumo-charts/pro-chart/dist/browser/pro-chart.js';

  createProChart(document.getElementById('chart'), { datafeed, symbol: 'BTCUSDT' });
</script>
```

The chart lives in a Shadow DOM of its own, so the page's styles for buttons, borders and font sizes do not reach it. Vue and React use components: see ["Vue and React"](frameworks.md).

## What it does not include

Trading (connecting brokerage accounts, orders, positions), the market data itself, the watchlist itself and side panels (pages usually have their own, and a watchlist can be connected to the stars of the symbol search), user accounts and back ends. An entry point to trading can be connected to the page's own trading interface with [your own buttons and context menu items](page-items.md).
