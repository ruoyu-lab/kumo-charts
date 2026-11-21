# Custom indicators

<!-- code-prelude
declare const DEVIATION: import('@kumo-charts/core/indicators').IndicatorDefinition<{ period: number }>;
-->

An indicator of your own works like those of the library: it goes on the chart, shows in the legend, can be watched by alerts, is saved with the layout, and computes without a chart too.

## The simplest way

Tell the chart how many bars each value looks back at (`lookback`), and give a function that computes the values from them (`compute`):

```ts live height=420
import { createChart } from '@kumo-charts/core';
import { indicators, type IndicatorDefinition } from '@kumo-charts/core/indicators';
import { loadBars } from '@docs/data';

/** How far the price is from its moving average, in percent */
const DEVIATION: IndicatorDefinition<{ period: number }> = {
  type: 'DEVIATION',
  name: 'Deviation',
  pane: 'new', // a pane of its own; 'main' draws on the main pane
  precision: 2,
  params: { period: { default: 20, min: 2, max: 500, integer: true, label: 'Period' } },
  outputs: () => [{ key: 'dev', label: 'DEV%', plot: { kind: 'histogram', colorBy: 'sign' } }],
  levels: () => [0],
  lookback: ({ period }) => period,
  compute: (window) => {
    let sum = 0;
    for (let i = 0; i < window.length; i += 1) sum += window.price(i);
    const average = sum / window.length;
    const latest = window.price(window.length - 1);
    return [((latest - average) / average) * 100];
  }
};

const chart = createChart(document.getElementById('chart')!, {
  modules: [indicators([DEVIATION])]
});

chart.data.set(await loadBars(), { interval: '1m' });
chart.data.setTimeframe('1h');
chart.indicators.add({ type: 'DEVIATION' });
```

`window` holds the latest `lookback` bars, oldest first: `window.price(i)` is the indicator's price (the close by default), `window.bar(i)` the whole bar. Until there are `lookback` bars, `compute` is not called and those bars have no value.

`compute` returns an array with a value for each output; `NaN` where there is none.

## Using it

Give it with the library's indicators when you create the chart:

```ts
import { indicators, allIndicators } from '@kumo-charts/core/indicators';

createChart(container, { modules: [indicators([...allIndicators, DEVIATION])] });
```

Or register it later:

```ts
chart.indicators.register(DEVIATION);
chart.indicators.add({ type: 'DEVIATION', params: { period: 50 } });
```

## Bar by bar

`compute` goes through the whole window on every bar, which gets slow with long periods; and some indicators carry state from long ago, such as an EMA. For those, write `create`, returning a calculator that steps from bar to bar:

```ts
import type { IndicatorDefinition, IndicatorStream } from '@kumo-charts/core/indicators';

/** How many bars in a row closed up (positive) or down (negative) */
class StreakStream implements IndicatorStream {
  private readonly out = new Float64Array(1);

  constructor(
    private previous = Number.NaN,
    private streak = 0
  ) {}

  next(_bar: unknown, price: number): ArrayLike<number> {
    if (price > this.previous) this.streak = this.streak > 0 ? this.streak + 1 : 1;
    else if (price < this.previous) this.streak = this.streak < 0 ? this.streak - 1 : -1;
    else this.streak = 0;
    this.previous = price;
    this.out[0] = this.streak;
    return this.out;
  }

  clone(): IndicatorStream {
    return new StreakStream(this.previous, this.streak);
  }
}

export const STREAK: IndicatorDefinition<Record<string, never>> = {
  type: 'STREAK',
  name: 'Streak',
  pane: 'new',
  precision: 0,
  params: {},
  outputs: () => [{ key: 'streak', label: 'STREAK', plot: { kind: 'histogram', colorBy: 'sign' } }],
  create: () => new StreakStream()
};
```

Two rules:

- `next(bar, price)` is called once a bar, in order of time. The `bar` object is reused: keep the numbers you need, not the object.
- `clone()` copies all the state. As the latest bar updates in real time, the chart computes it again from a copy taken before it, so a copy must not share anything with the original.

## Built of the library's blocks

Common calculations such as an EMA or a standard deviation need not be written again: `@kumo-charts/core/indicators` exports the blocks the library's own indicators are built of, each with `clone()`:

| Block                         | Computes                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `movingAverage(kind, period)` | a moving average: `'sma'`, `'ema'`, `'rma'`, `'wma'` or `'vwma'`, as the built-in indicators pick |
| `StandardDeviation`           | the standard deviation of the latest `period` values                                              |
| `RollingExtremes`             | the highest high and lowest low of the latest `period` bars                                       |
| `RingBuffer`                  | the latest `capacity` values, their highest, lowest and sum                                       |
| `Previous`                    | the value before                                                                                  |

Such as a band of a few standard deviations around an EMA:

```ts
import type { Bar } from '@kumo-charts/core';
import {
  movingAverage,
  StandardDeviation,
  type BarStep,
  type IndicatorDefinition,
  type IndicatorStream
} from '@kumo-charts/core/indicators';

class EmaBandStream implements IndicatorStream {
  private readonly out = new Float64Array(3);

  constructor(
    private readonly width: number,
    private readonly average: BarStep,
    private readonly deviation: StandardDeviation
  ) {}

  next(bar: Bar, price: number): ArrayLike<number> {
    const middle = this.average.next(price, bar); // the bar, for the volume of a volume-weighted average
    const spread = this.deviation.next(price) * this.width;
    this.out[0] = middle;
    this.out[1] = middle + spread;
    this.out[2] = middle - spread;
    return this.out;
  }

  clone(): IndicatorStream {
    // each block copies its own state
    return new EmaBandStream(this.width, this.average.clone(), this.deviation.clone());
  }
}

export const EMA_BAND: IndicatorDefinition<{ period: number; width: number }> = {
  type: 'EMA_BAND',
  name: 'EMA band',
  pane: 'main',
  precision: 'price',
  params: {
    period: { default: 20, min: 2, max: 500, integer: true, label: 'Length' },
    width: { default: 2, min: 0.1, max: 10, label: 'Width' }
  },
  outputs: () => [
    { key: 'basis', label: 'EMA', plot: { kind: 'line' } },
    { key: 'upper', label: 'Upper', plot: { kind: 'line' } },
    { key: 'lower', label: 'Lower', plot: { kind: 'line' } }
  ],
  fills: () => [{ from: 'upper', to: 'lower' }],
  create: ({ period, width }) =>
    new EmaBandStream(width, movingAverage('ema', period), new StandardDeviation(period))
};
```

The averages and the deviation are `NaN` until `period` values came; a `NaN` is skipped and leaves the value as it was. Cloning each block in `clone()` copies the whole calculator.

## How outputs are drawn

Each output's `plot`:

| `kind`      | Draws                                                                                                                                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `line`      | A line; `style` is `solid`, `dashed` or `dotted`, `width` its width in pixels (0.5 to 10, default 1.25)                                                                                                                                                                                      |
| `segments`  | A horizontal line through each run of equal values, such as the pivot points of a day; `style` and `width` as for `line`                                                                                                                                                                     |
| `histogram` | Columns from zero, colored by sign (`sign`), change (`change`) or bar direction (`bar`)                                                                                                                                                                                                      |
| `columns`   | Columns from another output (or a fixed value) to this one                                                                                                                                                                                                                                   |
| `candles`   | Candles: this output the close, three others the open, high and low, in the theme's up and down colors                                                                                                                                                                                       |
| `box`       | Boxes from another output to this one, such as the range of a session                                                                                                                                                                                                                        |
| `marker`    | A shape or a text on the bars with a value, such as an arrow where lines cross; `value: true` writes the value too, such as the price of a pivot                                                                                                                                             |
| `zigzag`    | A zigzag: of the values of two outputs, `high` and `low`, in the order of their bars, the last of each run of one side, joined; `extend` goes on to this output's value on the latest bar, and `labels` writes the price, change and volume by each pivot; `style` and `width` as for `line` |
| `hidden`    | Nothing: shown in the legend and available to alerts only                                                                                                                                                                                                                                    |

Drawn as candles, the open, high and low are usually `hidden` outputs: not drawn on their own, their values still in the legend. The four values read in the color of the candle, and the price scale fits the highs and lows; a color set on the candles' output paints every candle in it.

```ts
import type { IndicatorOutput } from '@kumo-charts/core/indicators';

const outputs: IndicatorOutput[] = [
  { key: 'open', label: 'Open', plot: { kind: 'hidden' } },
  { key: 'high', label: 'High', plot: { kind: 'hidden' } },
  { key: 'low', label: 'Low', plot: { kind: 'hidden' } },
  {
    key: 'close',
    label: 'Close',
    plot: { kind: 'candles', open: 'open', high: 'high', low: 'low' }
  }
];
```

More settings of an output:

```ts
import type { IndicatorOutput } from '@kumo-charts/core/indicators';

const upper: IndicatorOutput = {
  key: 'upper',
  label: 'Upper',
  plot: { kind: 'line' },
  color: '#5b9cf0', // without it, the theme's palette in turn
  themeColor: 'up', // or the theme's rising or falling color
  offset: 26, // drawn 26 bars to the right, as Ichimoku's leading spans
  legend: false, // not in the legend
  precision: 4, // decimals of this output alone
  autoscale: false // left out when the price scale fits what is in view
};
```

To shade between two outputs, give the definition `fills`, such as between the bands of Bollinger Bands: `fills: () => [{ from: 'upper', to: 'lower' }]`. Like `outputs`, it is a function of the parameters, so a shade can come only with the bands the parameters turn on; a shade between outputs the parameters do not make fails as the indicator is added, rather than drawing nothing.

## Zigzags

An indicator whose pivots are found some bars late and replaced by later ones further on, such as the zig zag, draws them with `zigzag`. Its calculator gives on each bar only the highs and lows it found then, never changing them; the drawing takes the last of each run of one side, so a later value moves the pivot on:

```ts
import type { Bar } from '@kumo-charts/core';
import {
  RingBuffer,
  type IndicatorDefinition,
  type IndicatorStream
} from '@kumo-charts/core/indicators';

// A close that is the highest of `period` closes is a high, the lowest a low
class SwingStream implements IndicatorStream {
  private readonly out = new Float64Array(3);

  constructor(private readonly closes: RingBuffer) {}

  next(bar: Bar): ArrayLike<number> {
    this.closes.push(bar.close);
    const full = this.closes.full;
    this.out[0] = bar.close; // The line goes on to the latest close
    this.out[1] = full && bar.close >= this.closes.max() ? bar.close : Number.NaN;
    this.out[2] = full && bar.close <= this.closes.min() ? bar.close : Number.NaN;
    return this.out;
  }

  clone(): IndicatorStream {
    return new SwingStream(this.closes.clone());
  }
}

const SWINGS: IndicatorDefinition<{ period: number }> = {
  type: 'SWINGS',
  name: 'Swings',
  pane: 'main',
  precision: 'price',
  params: { period: { default: 20, min: 2, integer: true } },
  outputs: () => [
    {
      key: 'line',
      label: 'Swings',
      plot: {
        kind: 'zigzag',
        high: 'high',
        low: 'low',
        extend: true,
        labels: { price: true, change: 'percent' }
      },
      legend: false
    },
    { key: 'high', label: 'High', plot: { kind: 'hidden' }, legend: false },
    { key: 'low', label: 'Low', plot: { kind: 'hidden' }, legend: false }
  ],
  create: ({ period }) => new SwingStream(new RingBuffer(period))
};
```

The `change` of `labels` is `absolute` (a price) or `percent`, and `volume: true` writes the volume between two pivots (from the bar after the pivot before through this one's, from the first bar for the first pivot). The label of a high goes above it in the theme's up color, that of a low below it in its down color; the end the line goes on to has one too. The `high` and `low` outputs are usually `hidden` with `legend: false`, there only for the line.

## Parameters

```ts
import type { ParamSpec } from '@kumo-charts/core/indicators';

const params = {
  period: { default: 14, min: 1, max: 500, integer: true, label: 'Period' },
  periods: { default: [5, 10, 20], min: 1, integer: true }, // several numbers, such as moving averages
  anchor: {
    default: 1,
    // only these values, which a form offers as a select
    options: [
      { value: 1, label: 'Day' },
      { value: 2, label: 'Week' }
    ]
  }
} satisfies Record<string, ParamSpec>;
```

Parameters are numbers or arrays of numbers. The chart checks what users give against these ranges and throws for values outside them.

## Following trading days

An indicator that starts again every trading day, week or month, such as a daily VWAP, takes the trading calendar in the second argument:

```ts
import type { Bar, Calendar } from '@kumo-charts/core';
import type { IndicatorDefinition, IndicatorStream } from '@kumo-charts/core/indicators';

class DayHighStream implements IndicatorStream {
  private readonly out = new Float64Array(1);

  constructor(
    private readonly calendar: Calendar,
    private day: number | null = null,
    private high = Number.NaN
  ) {}

  next(bar: Bar): ArrayLike<number> {
    // the trading day of the bar; null outside the sessions
    const day = this.calendar.bucket(bar.time, '1D');
    this.high = day === this.day ? Math.max(this.high, bar.high) : bar.high;
    this.day = day;
    this.out[0] = this.high;
    return this.out;
  }

  clone(): IndicatorStream {
    return new DayHighStream(this.calendar, this.day, this.high);
  }
}

const DAY_HIGH: IndicatorDefinition<Record<string, never>> = {
  type: 'DAY_HIGH',
  name: 'Day high',
  pane: 'main',
  precision: 'price',
  params: {},
  outputs: () => [{ key: 'high', label: 'DH', plot: { kind: 'segments' } }],
  create: (_params, { calendar }) => new DayHighStream(calendar)
};
```

The calendar is the chart's `calendar` option; when the user changes the sessions, the indicator computes again. The second argument also has `interval`, the interval of the bars: the timeframe the chart shows, or `null` for bars `data.set()` got without one.

## Data besides the bars

A calculator can also read data besides the bars, such as funding rates, open interest or trades fetched apart. The chart cannot tell when that data changes, so call `chart.indicators.refresh()` whenever it does: the chart computes the indicator again, and those reading it, such as an average of it, with it:

```ts
import type { Bar } from '@kumo-charts/core';
import type { IndicatorDefinition, IndicatorStream } from '@kumo-charts/core/indicators';

/** Funding rates by the time of their bars, put in as they come */
const rates = new Map<number, number>();

class FundingStream implements IndicatorStream {
  private readonly out = new Float64Array(1);

  next(bar: Bar): ArrayLike<number> {
    this.out[0] = rates.get(bar.time) ?? Number.NaN; // none fetched yet: not drawn
    return this.out;
  }

  clone(): IndicatorStream {
    return new FundingStream(); // the data outside is no state of the calculator
  }
}

const FUNDING: IndicatorDefinition<Record<string, never>> = {
  type: 'FUNDING',
  name: 'Funding rate',
  pane: 'new',
  precision: 4,
  params: {},
  outputs: () => [{ key: 'rate', label: 'Rate', plot: { kind: 'histogram', colorBy: 'sign' } }],
  create: () => new FundingStream()
};

chart.indicators.register(FUNDING);
const id = chart.indicators.add({ type: 'FUNDING' });

// A stretch of history came: the whole indicator again
const history = (await (await fetch('/api/funding')).json()) as Array<[number, number]>;
history.forEach(([time, rate]) => rates.set(time, rate));
chart.indicators.refresh(id);

// The latest bar's value changed: that bar alone again
export function onRate(time: number, rate: number): void {
  rates.set(time, rate);
  chart.indicators.refresh(id, time);
}
```

`refresh(id, from)` computes again from the bar holding time `from` on: from the latest bar, only that bar, as for a tick; from an earlier bar, or without `from`, the whole indicator. The data outside is no state of the calculator, which `clone()` leaves alone; the calculator's own state it still copies whole. Without a chart (`computeIndicator()`) there is nothing to tell: the calculator reads the data as it is at the call, and is to be run again once it changes.

## Without a chart

```ts
import { computeIndicator } from '@kumo-charts/core/indicators';

const { dev } = computeIndicator(DEVIATION, bars, { params: { period: 50 } });
// dev[i] is the value at bar i, as the chart computes it
```

To step bar by bar, use `createIndicatorCalculator()`, for example to follow real-time data on a server and evaluate alerts. Both run in Node.js.
