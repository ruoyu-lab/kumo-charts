# 自定义指标

<!-- code-prelude
declare const DEVIATION: import('@kumo-charts/core/indicators').IndicatorDefinition<{ period: number }>;
-->

自己写的指标和内置的一样：能加到图上、显示在图例里、被提醒盯着、存进布局，也能在没有图表的地方计算。

## 最简单的写法

告诉图表每个值要往回看几根（`lookback`），再给一个函数用这几根算出值（`compute`）：

```ts live height=420
import { createChart } from '@kumo-charts/core';
import { indicators, type IndicatorDefinition } from '@kumo-charts/core/indicators';
import { loadBars } from '@docs/data';

/** 价格偏离均线的百分比 */
const DEVIATION: IndicatorDefinition<{ period: number }> = {
  type: 'DEVIATION',
  name: '均线偏离',
  pane: 'new', // 自己开一个副图；'main' 画在主图上
  precision: 2,
  params: { period: { default: 20, min: 2, max: 500, integer: true, label: '周期' } },
  outputs: () => [{ key: 'dev', label: '偏离%', plot: { kind: 'histogram', colorBy: 'sign' } }],
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

`window` 是最近的 `lookback` 根 K 线，从旧到新；`window.price(i)` 是指标设定的价格（默认收盘价），`window.bar(i)` 是整根 K 线。K 线还不够 `lookback` 根时不会调用，那几根没有值。

`compute` 返回一个数组，每个输出一个值；没有值的地方返回 `NaN`。

## 用上它

建图时和内置的放在一起：

```ts
import { indicators, allIndicators } from '@kumo-charts/core/indicators';

createChart(container, { modules: [indicators([...allIndicators, DEVIATION])] });
```

或者建好以后再注册：

```ts
chart.indicators.register(DEVIATION);
chart.indicators.add({ type: 'DEVIATION', params: { period: 50 } });
```

## 逐根计算

`compute` 每根都把整个窗口重算一遍，周期长了会慢；有的指标还要记住很久以前的状态，比如 EMA。这时改写 `create`，返回一个逐根往前算的计算器：

```ts
import type { IndicatorDefinition, IndicatorStream } from '@kumo-charts/core/indicators';

/** 连续上涨或下跌了几根：涨为正，跌为负 */
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
  name: '连涨连跌',
  pane: 'new',
  precision: 0,
  params: {},
  outputs: () => [{ key: 'streak', label: 'STREAK', plot: { kind: 'histogram', colorBy: 'sign' } }],
  create: () => new StreakStream()
};
```

两条规则：

- `next(bar, price)` 每根调用一次，按时间顺序。`bar` 对象会被复用，不要存它的引用，要用就把数字取出来。
- `clone()` 要复制全部状态。最新一根 K 线实时更新时，图表会从更新之前的副本重新算这一根，所以副本必须和原来的互不影响。

## 用内置的积木

EMA、标准差这些常用的计算不用自己重写。`@kumo-charts/core/indicators` 导出了 图表库自己的指标用的几块积木，每块都能 `clone()`：

| 积木                          | 算什么                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `movingAverage(kind, period)` | 移动平均：`'sma'`、`'ema'`、`'rma'`、`'wma'`、`'vwma'`，和内置指标选的均线一样 |
| `StandardDeviation`           | 最近 `period` 个值的标准差                                                     |
| `RollingExtremes`             | 最近 `period` 根 K 线的最高价和最低价                                          |
| `RingBuffer`                  | 最近 `capacity` 个值，能取最大、最小、求和                                     |
| `Previous`                    | 上一个值                                                                       |

比如 EMA 上下加减几倍标准差的通道：

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
    const middle = this.average.next(price, bar); // K 线是给成交量加权的均线用的
    const spread = this.deviation.next(price) * this.width;
    this.out[0] = middle;
    this.out[1] = middle + spread;
    this.out[2] = middle - spread;
    return this.out;
  }

  clone(): IndicatorStream {
    // 每块积木复制它自己的状态
    return new EmaBandStream(this.width, this.average.clone(), this.deviation.clone());
  }
}

export const EMA_BAND: IndicatorDefinition<{ period: number; width: number }> = {
  type: 'EMA_BAND',
  name: 'EMA 通道',
  pane: 'main',
  precision: 'price',
  params: {
    period: { default: 20, min: 2, max: 500, integer: true, label: '周期' },
    width: { default: 2, min: 0.1, max: 10, label: '倍数' }
  },
  outputs: () => [
    { key: 'basis', label: 'EMA', plot: { kind: 'line' } },
    { key: 'upper', label: '上轨', plot: { kind: 'line' } },
    { key: 'lower', label: '下轨', plot: { kind: 'line' } }
  ],
  fills: () => [{ from: 'upper', to: 'lower' }],
  create: ({ period, width }) =>
    new EmaBandStream(width, movingAverage('ema', period), new StandardDeviation(period))
};
```

均线和标准差在攒够 `period` 个值之前给 `NaN`；遇到 `NaN` 会跳过，值保持不变。`clone()` 里把每块积木各自 `clone()` 一下，计算器就复制全了。

## 输出画成什么

每个输出的 `plot`：

| `kind`      | 画法                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `line`      | 折线，`style` 可以是 `solid`、`dashed`、`dotted`，`width` 是线宽（像素，0.5 到 10，默认 1.25）                                                                                                       |
| `segments`  | 值不变的一段画一条横线，比如每天的枢轴点；`style`、`width` 同 `line`                                                                                                                                 |
| `histogram` | 从 0 开始的柱子，按正负（`sign`）、涨跌（`change`）或 K 线方向（`bar`）上色                                                                                                                          |
| `columns`   | 从另一个输出（或一个固定值）到这个值的柱子                                                                                                                                                           |
| `candles`   | 蜡烛：这个输出是收盘，另三个输出给开、高、低，按涨跌用主题的颜色                                                                                                                                     |
| `box`       | 从另一个输出到这个值的方框，比如交易时段的高低区间                                                                                                                                                   |
| `marker`    | 在有值的 K 线上画一个形状或文字，比如金叉处的箭头；`value: true` 把值也写上，比如枢轴点的价格                                                                                                        |
| `zigzag`    | 之字线：`high`、`low` 两个输出的值按 K 线先后，同一方向连着的只取最后一个，连成折线；`extend` 延伸到这个输出在最新一根 K 线上的值，`labels` 在拐点旁写价格、涨跌、成交量；`style`、`width` 同 `line` |
| `hidden`    | 不画，只在图例里显示、给提醒用                                                                                                                                                                       |

画成蜡烛时，开、高、低三个输出一般用 `hidden`：不单独画，图例里照样写出值。四个值都用这根蜡烛的颜色，价格坐标按最高、最低缩放；给蜡烛的输出设了颜色，每根都用这个颜色。

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

输出的其它设置：

```ts
import type { IndicatorOutput } from '@kumo-charts/core/indicators';

const upper: IndicatorOutput = {
  key: 'upper',
  label: 'Upper',
  plot: { kind: 'line' },
  color: '#5b9cf0', // 不给就按主题的 palette 依次取
  themeColor: 'up', // 或者用主题的涨跌色
  offset: 26, // 往右挪 26 根画，比如一目均衡表的先行带
  legend: false, // 不在图例里显示
  precision: 4, // 这个输出单独的小数位
  autoscale: false // 不参与价格坐标的自动缩放
};
```

两条线之间填色，在定义里写 `fills`，比如布林带的上下轨之间：`fills: () => [{ from: 'upper', to: 'lower' }]`。它和 `outputs` 一样按参数给，所以可以只在参数打开了上下轨时才填色；填色用到的输出这组参数没有，加指标时会报错，不会悄悄不画。

## 之字线

拐点要过几根 K 线才能认出、又会被后来更远的拐点替换的指标，比如之字转向，用 `zigzag` 画。计算器每根 K 线只给当时认出的高点、低点，以后不改；画的时候同一方向连着的几个只取最后一个，后来的值就把拐点挪了过去：

```ts
import type { Bar } from '@kumo-charts/core';
import {
  RingBuffer,
  type IndicatorDefinition,
  type IndicatorStream
} from '@kumo-charts/core/indicators';

// 收盘价是 period 根里最高的记一个高点，最低的记一个低点
class SwingStream implements IndicatorStream {
  private readonly out = new Float64Array(3);

  constructor(private readonly closes: RingBuffer) {}

  next(bar: Bar): ArrayLike<number> {
    this.closes.push(bar.close);
    const full = this.closes.full;
    this.out[0] = bar.close; // 线延伸到最新的收盘价
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
  name: '摆动',
  pane: 'main',
  precision: 'price',
  params: { period: { default: 20, min: 2, integer: true } },
  outputs: () => [
    {
      key: 'line',
      label: '摆动',
      plot: {
        kind: 'zigzag',
        high: 'high',
        low: 'low',
        extend: true,
        labels: { price: true, change: 'percent' }
      },
      legend: false
    },
    { key: 'high', label: '高点', plot: { kind: 'hidden' }, legend: false },
    { key: 'low', label: '低点', plot: { kind: 'hidden' }, legend: false }
  ],
  create: ({ period }) => new SwingStream(new RingBuffer(period))
};
```

`labels` 的 `change` 写 `absolute`（价格）或 `percent`（百分比），`volume: true` 写两个拐点之间的成交量（从上一个拐点的下一根 K 线到这个拐点，第一个拐点从第一根算起）。高点的标签在上方、用主题的涨色，低点的在下方、用跌色，延伸到的最新一根也有标签。`high`、`low` 两个输出一般设成 `hidden`、`legend: false`，只给线用。

## 参数

```ts
import type { ParamSpec } from '@kumo-charts/core/indicators';

const params = {
  period: { default: 14, min: 1, max: 500, integer: true, label: '周期' },
  periods: { default: [5, 10, 20], min: 1, integer: true }, // 一组数字，比如多条均线
  anchor: {
    default: 1,
    // 只能取这几个值，界面上显示成下拉框
    options: [
      { value: 1, label: '日' },
      { value: 2, label: '周' }
    ]
  }
} satisfies Record<string, ParamSpec>;
```

参数都是数字或数字数组。用户给的参数会按这里的范围检查，超出范围的会报错。

## 跟着交易日算

需要按交易日、周、月重新开始的指标，比如每天重新算的 VWAP，用第二个参数里的交易日历：

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
    // 这根 K 线属于哪个交易日，时段外的时间是 null
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
  name: '当日最高',
  pane: 'main',
  precision: 'price',
  params: {},
  outputs: () => [{ key: 'high', label: 'DH', plot: { kind: 'segments' } }],
  create: (_params, { calendar }) => new DayHighStream(calendar)
};
```

日历就是图表的 `calendar` 选项，用户改了交易时段，指标会重新算。第二个参数里还有 `interval`，是 K 线的周期：图表合成了周期就是合成的周期，`data.set()` 没给周期时是 `null`。

## 读 K 线以外的数据

计算器也可以读 K 线以外的数据，比如另外取来的资金费率、持仓量、逐笔成交。那份数据什么时候变了，图表不知道，所以每次变了都要调用 `chart.indicators.refresh()`，让图表重算这个指标，读它的指标（比如它的均线）也跟着重算：

```ts
import type { Bar } from '@kumo-charts/core';
import type { IndicatorDefinition, IndicatorStream } from '@kumo-charts/core/indicators';

/** 资金费率，按 K 线的时间存：取到一段放一段 */
const rates = new Map<number, number>();

class FundingStream implements IndicatorStream {
  private readonly out = new Float64Array(1);

  next(bar: Bar): ArrayLike<number> {
    this.out[0] = rates.get(bar.time) ?? Number.NaN; // 还没取到的不画
    return this.out;
  }

  clone(): IndicatorStream {
    return new FundingStream(); // 外面的数据不是计算器的状态，不用复制
  }
}

const FUNDING: IndicatorDefinition<Record<string, never>> = {
  type: 'FUNDING',
  name: '资金费率',
  pane: 'new',
  precision: 4,
  params: {},
  outputs: () => [{ key: 'rate', label: '费率', plot: { kind: 'histogram', colorBy: 'sign' } }],
  create: () => new FundingStream()
};

chart.indicators.register(FUNDING);
const id = chart.indicators.add({ type: 'FUNDING' });

// 取到一段历史：整个指标重算
const history = (await (await fetch('/api/funding')).json()) as Array<[number, number]>;
history.forEach(([time, rate]) => rates.set(time, rate));
chart.indicators.refresh(id);

// 最新一根的值变了：只重算最新一根
export function onRate(time: number, rate: number): void {
  rates.set(time, rate);
  chart.indicators.refresh(id, time);
}
```

`refresh(id, from)` 从含时间 `from` 的那根 K 线起重算：`from` 落在最新一根上时只算这一根，和一个 tick 一样；落在更早的 K 线上，或者不给 `from`，整个指标从头算。外面的数据不是计算器的状态，`clone()` 不用复制它，计算器自己的状态照样要复制全。不用图表计算时（`computeIndicator()`），没有图表可以通知，计算器读到的是调用那一刻的数据，数据变了要再算一遍。

## 不用图表也能算

```ts
import { computeIndicator } from '@kumo-charts/core/indicators';

const { dev } = computeIndicator(DEVIATION, bars, { params: { period: 50 } });
// dev[i] 是第 i 根 K 线上的值，和图表上算出来的一样
```

逐根推进用 `createIndicatorCalculator()`，适合在服务器上跟着实时数据算、判断提醒。这些都能在 Node.js 里运行。
