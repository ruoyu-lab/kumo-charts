# Comparing symbols

The ⊕ after the symbol's name in the top bar opens the compare window: search for a symbol, and clicking a row (or pressing Enter) adds it on the "Same % scale"; with the pointer over a row, three buttons on its right offer a choice:

| Placement                  | `placement` in methods | How it is drawn                                                                                                                                                                                                      |
| -------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same % scale (the default) | `percent`              | On the price scale of the main pane, switched to percent; every symbol counts from the close of the first bar in view, all starting at 0% and each moving by its own changes, computed again on dragging and zooming |
| New price scale            | `scale`                | On the main pane, with a price scale of its own: the first on the left price scale, and more without a scale (their values are in the legend)                                                                        |
| New pane                   | `pane`                 | In a pane of its own, with a price scale of its own                                                                                                                                                                  |

The top of the window lists the symbols the current chart compares, each of which can be taken away; the window stays open after adding one, to add more. With the main pane on a regular or logarithmic scale, adding a symbol on the "Same % scale" switches it to percent (indexed to 100 stays as it is, each symbol likewise counting from its own first bar); it can be switched back to regular from the price scale's context menu afterwards.

- Compared symbols fetch data in the chart's current timeframe (built from the datafeed's bar timeframes, as for the main pane), load earlier bars along when dragging to the left, and move with live data when there is some (streamed as bars or as trades); during a replay, they likewise show only the part replayed.
- A row of the legend shows the name and the close (with the symbol's own decimals), and the price scale marks its latest value (in percent on a percent scale), moved aside automatically when it overlaps the latest price's label. With the pointer over the row, there are show/hide, settings and remove buttons; the settings window changes the placement, the style (named and drawn as the chart types: Bars, Candles, Hollow candles, Line, Line with markers, Step line, Area, HLC area, Baseline, Columns, High-low, with the `style` of methods `ohlc`, `candles`, `hollow-candles`, `line`, `line-markers`, `step-line`, `area`, `hlc-area`, `baseline`, `columns` and `high-low`), the color and the line width (for the five lines and areas; the others use the up and down colors), and changes apply at once. Without a color set, colors are taken in turn from the end of the palette, away from the colors indicators often use.
- Compared symbols stay when the main pane's symbol changes; each chart has its own, kept in `ChartView.comparisons` (`{ id, symbol, placement, style, color, width, visible }`).

```ts
const id = await chart.addComparison('ETHUSDT'); // on the same % scale
await chart.addComparison('XAUUSDT', { placement: 'pane', style: 'area' });
await chart.updateComparison(id, { color: '#0d9488', width: 3 });
chart.on('comparisonsChange', ({ chart: index, comparisons }) => save(index, comparisons));
```
