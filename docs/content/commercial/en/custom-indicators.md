# Custom indicators

An indicator's algorithm is an indicator definition of the library (as `chart.indicators.register()` takes), which the pro chart registers on every chart (including charts made later) and lists in the indicators window; users add it, change its parameters and lines as they do with the built-in indicators, and the state keeps it:

```ts
import type { CustomIndicator } from '@kumo-charts/pro-chart';

const MID: CustomIndicator = {
  name: { en: 'Mid price', zh: '中间价', ja: '中値', ko: '중간가' }, // the name after the code; en is required
  group: 'trend', // the group it is listed in: trend, bands, oscillators, volume, volatility, other (the default); plugins is a separate "Plugins" group at the end
  // origin: { en: 'My plugin', zh: '我的插件' }, // shown by its name in the dialog to say where it comes from, as the plugin that gives it
  definition: {
    type: 'MID', // the code, shown in the indicators window and the legend; it cannot be the name of a built-in indicator
    name: 'MID',
    pane: 'main', // over the main pane; 'new' for a pane of its own below
    precision: 'price',
    params: { period: { default: 5, min: 1, max: 200, integer: true, label: 'Period' } },
    outputs: () => [{ key: 'mid', label: 'MID', plot: { kind: 'line' } }],
    lookback: ({ period }) => period as number,
    // bars are the latest lookback bars, from earliest to latest.
    compute: (bars) => {
      let sum = 0;

      for (let index = 0; index < bars.length; index += 1) {
        sum += (bars.bar(index).high + bars.bar(index).low) / 2;
      }

      return [sum / bars.length];
    }
  }
};

const chart = createProChart(container, { datafeed, symbol: 'BTCUSDT', customIndicators: [MID] });
chart.addIndicator('MID', { params: { period: 10 } });
```

When the definition of an indicator comes later, register it with `chart.registerIndicator(MID)`. A custom indicator the user saved shows once it is registered; in `customIndicators`, it shows right on opening. Its code cannot be the name of a built-in indicator. When a part of the page turns off (a plugin that gives indicators, say), take it down with `chart.unregisterIndicator('MID')`: the indicators dialog no longer lists it, such indicators on the chart are no longer drawn and the alerts reading them stop, but they stay in the chart's state with their parameters, and are drawn as they were when registered again.

## Writing it as a formula

To do without writing an algorithm, use a formula of Chinese market software: `formula` in place of `definition`, as `{ formula: { type: 'MYMACD', name: 'MYMACD', formula: 'DIF:EMA(C,12)-EMA(C,26); …' } }`. The syntax, functions and options are on [Formulas](formula.md).
