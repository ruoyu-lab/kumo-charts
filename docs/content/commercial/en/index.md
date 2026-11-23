# Kumo Charts Commercial

Kumo Charts Commercial is a set of commercial components built on the open-source [Kumo Charts](../../en/index.md), used under a [commercial license](license.md). Its heart is **the pro chart**: a chart for watching markets with the full set of tools, which goes into a web page once it is connected to your own market data, in Vue, in React or in a plain page.

```ts
import { createProChart } from '@kumo-charts/pro-chart';

const chart = createProChart(document.getElementById('chart')!, {
  datafeed: myDatafeed,
  symbol: '600519.SH'
});
```

Start with the [Quick start](getting-started.md).

## What is in it

- **The pro chart** (`@kumo-charts/pro-chart`): in the top bar, symbol search, comparing symbols, timeframes, chart types, indicators and indicator templates, replay, undo and redo, screenshots and exporting the chart's data; the drawing tools on the left, multi-chart layouts, context menus, the chart settings and indicator settings windows, and [alerts](alerts.md) on prices, indicators and drawings. The top bar can be taken away entirely for one of the page's own, the page's watchlist can be connected to the stars of the symbol search, and the page can add its own buttons, context menu items, indicators and drawing tools.
- **Order flow**: two [chart types](chart-types.md), volume footprint and time price opportunity (TPO); three [indicators](indicators.md), volume delta, cumulative volume delta and buy and sell volume; large trades and an order book heatmap; and volume profiles split by the aggressor side.
- **Information-driven bars**: imbalance bars and run bars, built from live trades.
- **Formula indicators**: [formulas](formula.md) written the way Chinese market software writes them become indicators computed tick by tick in real time.

All of these are in the pro chart, and one commercial license key covers all of them.

## Try before you buy

Pages on a development server on your own computer (such as `http://localhost:5173`: the usual development ports count, see [License](license.md)) need no license key and show no watermark, so everything can be tried in full. On a production website or app, a chart without a license key shows "Kumo Charts Commercial · unlicensed, for evaluation only" in its bottom left corner. There are two licenses, personal and company, sold at [kumocharts.com](https://kumocharts.com/en/#pricing); the license key comes right after payment. The rules are on [License](license.md).

## A tour of the interface

Right-click on the chart: reset the chart view (Alt+R, ⌥R on a Mac), copy the price, add an alert at the price (added in one click), add an alert… (Alt+A, opens the alert window), replay from this bar, add an indicator, hide or remove the drawings, remove the alerts, take a screenshot, chart settings. Right-clicking a drawing or an alert line gives its own actions (a drawing: add an alert on its line…, copy, lock, hide, remove; an alert line: edit the alert…, pause, remove, and double-clicking the alert line opens it too). Right-click on the price scale: add an alert at the price…, reset the price scale, auto scale, invert the scale (Alt+I), regular, percent (Alt+P), indexed to 100, logarithmic (Alt+L), and the latest price's label, line and countdown to the bar's close, kept for each chart; the price scale of a pane below has only reset and auto scale. Right-clicking the time scale resets the time scale.

The multi-chart layouts are on the right of the top bar: one chart, two side by side, two stacked, two arrangements of three (one large on the left and two small on the right, two small on the left and one large on the right), four, and four arrangements of six (two rows of three, three rows of two, one large on the left and five small on the right, one large on top and five small below). The other charts can follow the current one when it changes the symbol or the timeframe, moves the crosshair or goes to a time (the timeframe is not followed by default, so each chart can show its own). Every border between charts can be dragged to resize them; each chart keeps at least 200×120 pixels, and they share the space evenly when there is not enough. Double-clicking a border puts the borders of that direction back where they were.

The bottom right corner of the time scale (below the price scale) shows the time zone of the chart's times, as `UTC+8`. Clicking it offers the exchange's time (the time zone of the symbol's trading calendar; a symbol for which the datafeed gives no calendar is taken as trading around the clock in UTC, as cryptocurrencies on every platform), UTC, local time, or the time zone of a major city, each with its UTC offset right now. The choice is kept in the state and used by every chart. It changes only the times shown: bars are still cut by the symbol's trading calendar. The times in the replay window follow this time zone too.

A selected drawing gets a toolbar of the common tools floating beside it (color, line width, line style, copy, lock, remove); the gear on the toolbar, or a double-click on the drawing, opens the drawing's settings window with four tabs: Style (lines, fills, extending left and right, arrows, the values, colors and visibility of each Fibonacci level), Text (the content, color, size, bold and italic, alignment and position), Coordinates (the time and price of every point, which can be typed in exactly), and Visibility (on which second, minute, hour, day, week and month timeframes it shows). Changes apply as they are typed and dragged, and an edit counts as one step to undo: the characters typed in a row into one field, or one drag of the opacity slider, are taken back by a single undo. Each tool remembers the style the user gave it last, and new drawings use it straight away; double-clicking a text drawing still edits it right on the chart.

Replay is controlled from a small window floating on the chart: dragging it by the dots at its left end moves it anywhere, the position is kept, and a double-click puts it back. While the start of a replay is being picked, the part right of the bar under the pointer, which the replay will hide, is dimmed.

In a multi-chart layout, the charts of the same symbol replay together: after clicking replay, every chart showing the symbol can pick the start, and the chart under the mouse shows the part it would hide. The chart clicked is where the replay starts; it becomes the current chart, the replay controls step by its timeframe, and the other charts of the symbol follow to the same time. A chart with a larger timeframe builds its bars from bars as fine as that chart's instead, so its bar in progress grows along and the prices after it stay out of sight; changing the data takes a moment, during which that chart is empty. Charts of other symbols go on showing live data. Leaving the replay on any chart of the symbol takes them all back to live.

## Screenshots and exporting data

The camera button on the right of the top bar is a menu:

- **Download image** (Alt+S): saves the current chart as a PNG, named like `BTCUSDT-1h.png`.
- **Copy image** (Alt+Shift+S, ⌥⇧S on a Mac; Ctrl+Shift+S is the browser's own screenshot in some browsers): puts an image of the current chart on the clipboard, to paste straight into a chat or a document. When the browser does not let the page put images on the clipboard (older browsers, or a page not on https), the image is downloaded instead, with a short note.

Exporting data is not shown by default; with `features: { dataExport: true }` it is in the layout's menu (the multi-chart layout button on the right of the top bar, as its last item):

- **Export chart data…**: pick the chart (in a multi-chart layout) and the time format, and export a CSV, named like `BTCUSDT-1h.csv`.

The CSV has every bar loaded on the chart, as the chart shows it: in the current timeframe and the current chart type (Heikin Ashi gives the Heikin Ashi values, say), and up to where the replay is during a replay. Each row has `time`, `open`, `high`, `low`, `close` and `volume`, then every line listed in the legend of each indicator shown (hidden indicators and lines are not exported); a column is named after the line's English name (which does not change with the interface's language), as `MA9` or `Signal line`, followed by the indicator's code when two names are the same, as `MA9 (VOL)`. The values of an indicator are exactly those on the chart, and those the library's `computeIndicator()` computes from the same bars, written in full as computed (floating point may leave an error at the end, as `82080.56000000011`; rounded to the chart's decimals, they read as in the legend); bars for which an indicator has no value yet (the first 19 of MA20, say) are left empty. What is not one value per bar, as volume profiles, is not exported, and neither are compared symbols.

There are two time formats: **ISO time** is written in the time zone chosen for the chart, with the offset at that time, as `2026-10-22T08:00:00+08:00` (UTC is written `Z`, and a time zone with daylight saving time uses the offset of each date); a **UNIX timestamp** counts seconds, as `1792627200` (with decimals for bars with milliseconds, as tick bars).

`features: { screenshot: false }` takes the camera button away; with `multiChart` off and exporting on, the layout button is there only to export (with a table icon). Without turning on `dataExport`, the page can still open the export window with `openDialog('exportData')`, for an item in its own menu, say.
