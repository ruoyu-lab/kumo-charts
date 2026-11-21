# カスタムインジケーター

<!-- code-prelude
declare const DEVIATION: import('@kumo-charts/core/indicators').IndicatorDefinition<{ period: number }>;
-->

独自のインジケーターも、組み込みのものと同じように扱えます。チャートに追加でき、凡例に表示され、アラートで監視でき、レイアウトに保存でき、チャートのない場所で計算することもできます。

## 最も簡単な書き方

各値を計算するのに何本さかのぼるか（`lookback`）をチャートに伝え、その本数の足から値を計算する関数（`compute`）を渡します。

```ts live height=420
import { createChart } from '@kumo-charts/core';
import { indicators, type IndicatorDefinition } from '@kumo-charts/core/indicators';
import { loadBars } from '@docs/data';

/** 価格が移動平均からどれだけ離れているか（パーセント） */
const DEVIATION: IndicatorDefinition<{ period: number }> = {
  type: 'DEVIATION',
  name: '移動平均乖離',
  pane: 'new', // 専用のペインを開く。'main' ならメインペインに描く
  precision: 2,
  params: { period: { default: 20, min: 2, max: 500, integer: true, label: '期間' } },
  outputs: () => [{ key: 'dev', label: '乖離%', plot: { kind: 'histogram', colorBy: 'sign' } }],
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

`window` は直近 `lookback` 本の足で、古い順に並んでいます。`window.price(i)` はインジケーターに設定された価格（デフォルトは終値）、`window.bar(i)` は足全体です。足が `lookback` 本に満たないうちは呼ばれず、その間の足には値がありません。

`compute` は、出力ごとに 1 つの値を持つ配列を返します。値がないところでは `NaN` を返します。

## 使う

チャートの作成時に、組み込みのものと一緒に渡します。

```ts
import { indicators, allIndicators } from '@kumo-charts/core/indicators';

createChart(container, { modules: [indicators([...allIndicators, DEVIATION])] });
```

または、作成したあとで登録します。

```ts
chart.indicators.register(DEVIATION);
chart.indicators.add({ type: 'DEVIATION', params: { period: 50 } });
```

## 1 本ずつ計算する

`compute` は足ごとにウィンドウ全体を計算し直すので、期間が長いと遅くなります。また、EMA のように、ずっと前からの状態を覚えておく必要があるインジケーターもあります。そういうときは `create` に書き換え、1 本ずつ先へ進めて計算する計算器を返します。

```ts
import type { IndicatorDefinition, IndicatorStream } from '@kumo-charts/core/indicators';

/** 何本続けて上昇・下落したか：上昇は正、下落は負 */
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
  name: '連続上昇・下落',
  pane: 'new',
  precision: 0,
  params: {},
  outputs: () => [{ key: 'streak', label: 'STREAK', plot: { kind: 'histogram', colorBy: 'sign' } }],
  create: () => new StreakStream()
};
```

ルールは 2 つあります。

- `next(bar, price)` は足ごとに 1 回、時間の順に呼ばれます。`bar` オブジェクトは使い回されるので、その参照を保存しないでください。必要な値は数値として取り出して使います。
- `clone()` はすべての状態をコピーしなければなりません。最新の足がリアルタイムで更新されるとき、チャートは更新前のコピーからその足を計算し直します。そのため、コピーと元のものが互いに影響し合ってはいけません。

## ライブラリの部品で組み立てる

EMA や標準偏差のようなよく使う計算は、自分で書き直す必要はありません。`@kumo-charts/core/indicators` は、ライブラリ自身のインジケーターが使っている部品を公開しています。どれも `clone()` できます。

| 部品                          | 計算するもの                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `movingAverage(kind, period)` | 移動平均：`'sma'`、`'ema'`、`'rma'`、`'wma'`、`'vwma'`。組み込みのインジケーターが選ぶ平均と同じ |
| `StandardDeviation`           | 直近 `period` 個の値の標準偏差                                                                   |
| `RollingExtremes`             | 直近 `period` 本の足の最高値と最安値                                                             |
| `RingBuffer`                  | 直近 `capacity` 個の値。最大、最小、合計も取れる                                                 |
| `Previous`                    | ひとつ前の値                                                                                     |

たとえば EMA の上下に標準偏差の何倍かを足し引きしたバンドです。

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
    const middle = this.average.next(price, bar); // 足は出来高加重平均が出来高を読むため
    const spread = this.deviation.next(price) * this.width;
    this.out[0] = middle;
    this.out[1] = middle + spread;
    this.out[2] = middle - spread;
    return this.out;
  }

  clone(): IndicatorStream {
    // ブロックはそれぞれ自分の状態をコピーする
    return new EmaBandStream(this.width, this.average.clone(), this.deviation.clone());
  }
}

export const EMA_BAND: IndicatorDefinition<{ period: number; width: number }> = {
  type: 'EMA_BAND',
  name: 'EMA バンド',
  pane: 'main',
  precision: 'price',
  params: {
    period: { default: 20, min: 2, max: 500, integer: true, label: '期間' },
    width: { default: 2, min: 0.1, max: 10, label: '倍率' }
  },
  outputs: () => [
    { key: 'basis', label: 'EMA', plot: { kind: 'line' } },
    { key: 'upper', label: '上限', plot: { kind: 'line' } },
    { key: 'lower', label: '下限', plot: { kind: 'line' } }
  ],
  fills: () => [{ from: 'upper', to: 'lower' }],
  create: ({ period, width }) =>
    new EmaBandStream(width, movingAverage('ema', period), new StandardDeviation(period))
};
```

平均と標準偏差は、`period` 個の値がそろうまでは `NaN` です。`NaN` は読み飛ばし、値はそのままです。`clone()` で部品をそれぞれ `clone()` すれば、計算器全体がコピーされます。

## 出力の描き方

各出力の `plot` は次のとおりです。

| `kind`      | 描き方                                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `line`      | 折れ線。`style` は `solid`、`dashed`、`dotted` のいずれか。`width` は線の太さ（ピクセル、0.5〜10、既定 1.25）                                                                                                                                 |
| `segments`  | 値が変わらない区間ごとに水平線を描く。日ごとのピボットポイントなど。`style`、`width` は `line` と同じ                                                                                                                                         |
| `histogram` | 0 から伸びる棒。正負（`sign`）、増減（`change`）、足の向き（`bar`）で色分けする                                                                                                                                                               |
| `columns`   | 別の出力（または固定値）からこの値までの棒                                                                                                                                                                                                    |
| `candles`   | ローソク足。この出力が終値、ほかの 3 つが始値・高値・安値。テーマの上昇・下落色                                                                                                                                                               |
| `box`       | 別の出力からこの値までのボックス。取引セッションの高値・安値の範囲など                                                                                                                                                                        |
| `marker`    | 値がある足に図形やテキストを描く。ゴールデンクロスの位置の矢印など。`value: true` で値も書く（ピボットの価格など）                                                                                                                            |
| `zigzag`    | ジグザグ。`high`、`low` の 2 つの出力の値を足の順に並べ、同じ向きの連続からは最後の 1 つだけを取って結ぶ。`extend` で最新の足でのこの出力の値まで延ばし、`labels` でピボットの横に価格・変化・出来高を書く。`style`、`width` は `line` と同じ |
| `hidden`    | 描かない。凡例への表示とアラートのためだけに使う                                                                                                                                                                                              |

ローソク足として描くとき、始値・高値・安値の 3 つの出力はふつう `hidden` にします。単独では描かれず、凡例には値が表示されます。4 つの値はそのローソク足の色で表示され、価格スケールは高値・安値に合わせて伸縮します。ローソク足の出力に色を設定すると、すべての足がその色になります。

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

出力のその他の設定：

```ts
import type { IndicatorOutput } from '@kumo-charts/core/indicators';

const upper: IndicatorOutput = {
  key: 'upper',
  label: 'Upper',
  plot: { kind: 'line' },
  color: '#5b9cf0', // 指定しなければテーマの palette から順に取る
  themeColor: 'up', // またはテーマの上昇・下落の色を使う
  offset: 26, // 26 本右にずらして描く。一目均衡表の先行スパンなど
  legend: false, // 凡例に表示しない
  precision: 4, // この出力だけの小数点以下の桁数
  autoscale: false // 価格軸の自動スケールの対象にしない
};
```

2 本のラインの間を塗りつぶすには、定義に `fills` を書きます。たとえばボリンジャーバンドの上下のバンドの間なら `fills: () => [{ from: 'upper', to: 'lower' }]` です。`outputs` と同じくパラメーターから返すので、パラメーターでバンドを出したときだけ塗りつぶすこともできます。塗りつぶしに使う出力がそのパラメーターでは出ないときは、インジケーターを追加するときにエラーになり、黙って描かれないことはありません。

## ジグザグ

ジグザグのように、ピボットが数本後にならないと見つからず、さらに先のピボットに置き換わることもあるインジケーターは `zigzag` で描きます。計算器は各足でその時点で見つけた高値・安値だけを返し、後から変えません。描くときに同じ向きの連続から最後の 1 つを取るので、後の値がピボットを先へ移します。

```ts
import type { Bar } from '@kumo-charts/core';
import {
  RingBuffer,
  type IndicatorDefinition,
  type IndicatorStream
} from '@kumo-charts/core/indicators';

// 終値が period 本の中で最も高ければ高値、最も安ければ安値として記録する
class SwingStream implements IndicatorStream {
  private readonly out = new Float64Array(3);

  constructor(private readonly closes: RingBuffer) {}

  next(bar: Bar): ArrayLike<number> {
    this.closes.push(bar.close);
    const full = this.closes.full;
    this.out[0] = bar.close; // ラインは最新の終値まで延びる
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
  name: 'スイング',
  pane: 'main',
  precision: 'price',
  params: { period: { default: 20, min: 2, integer: true } },
  outputs: () => [
    {
      key: 'line',
      label: 'スイング',
      plot: {
        kind: 'zigzag',
        high: 'high',
        low: 'low',
        extend: true,
        labels: { price: true, change: 'percent' }
      },
      legend: false
    },
    { key: 'high', label: '高値', plot: { kind: 'hidden' }, legend: false },
    { key: 'low', label: '安値', plot: { kind: 'hidden' }, legend: false }
  ],
  create: ({ period }) => new SwingStream(new RingBuffer(period))
};
```

`labels` の `change` は `absolute`（価格）か `percent`（パーセント）で、`volume: true` は 2 つのピボットの間の出来高（前のピボットの次の足からこのピボットの足まで。最初のピボットは最初の足から）を書きます。高値のラベルは上に、テーマの上昇色で、安値のラベルは下に、下落色で書き、ラインが延びる先の最新の足にもラベルが付きます。`high`、`low` の出力はふつう `hidden`、`legend: false` にして、ラインだけに使います。

## パラメーター

```ts
import type { ParamSpec } from '@kumo-charts/core/indicators';

const params = {
  period: { default: 14, min: 1, max: 500, integer: true, label: '期間' },
  periods: { default: [5, 10, 20], min: 1, integer: true }, // 数値の配列。複数の移動平均など
  anchor: {
    default: 1,
    // これらの値しか取れない。画面ではドロップダウンとして表示する
    options: [
      { value: 1, label: '日' },
      { value: 2, label: '週' }
    ]
  }
} satisfies Record<string, ParamSpec>;
```

パラメーターはすべて数値か数値の配列です。ユーザーが指定したパラメーターはここに書いた範囲でチェックされ、範囲外ならエラーになります。

## 取引日に合わせて計算する

取引日、週、月ごとに計算をやり直すインジケーター、たとえば日ごとに計算し直す VWAP では、2 番目の引数で受け取る取引カレンダーを使います。

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
    // この足がどの取引日に属するか。取引セッション外の時間は null
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
  name: '当日高値',
  pane: 'main',
  precision: 'price',
  params: {},
  outputs: () => [{ key: 'high', label: 'DH', plot: { kind: 'segments' } }],
  create: (_params, { calendar }) => new DayHighStream(calendar)
};
```

このカレンダーはチャートの `calendar` オプションそのものです。ユーザーが取引セッションを変えると、インジケーターは計算し直されます。2 番目の引数には足の期間 `interval` もあります。チャートが表示している時間足で、`data.set()` に期間を渡さなかった足では `null` です。

## ローソク足以外のデータを読む

計算器はローソク足以外のデータ、たとえば別に取得した資金調達率、建玉、約定履歴も読めます。そのデータがいつ変わったかをチャートは知らないので、変わるたびに `chart.indicators.refresh()` を呼んでください。チャートがそのインジケーターを計算し直し、それを読むインジケーター（その移動平均など）も一緒に計算し直します。

```ts
import type { Bar } from '@kumo-charts/core';
import type { IndicatorDefinition, IndicatorStream } from '@kumo-charts/core/indicators';

/** 資金調達率を足の時刻ごとに保存し、取得した分から入れる */
const rates = new Map<number, number>();

class FundingStream implements IndicatorStream {
  private readonly out = new Float64Array(1);

  next(bar: Bar): ArrayLike<number> {
    this.out[0] = rates.get(bar.time) ?? Number.NaN; // まだ取得していない足は描かない
    return this.out;
  }

  clone(): IndicatorStream {
    return new FundingStream(); // 外のデータは計算器の状態ではないので複製しない
  }
}

const FUNDING: IndicatorDefinition<Record<string, never>> = {
  type: 'FUNDING',
  name: '資金調達率',
  pane: 'new',
  precision: 4,
  params: {},
  outputs: () => [{ key: 'rate', label: '料率', plot: { kind: 'histogram', colorBy: 'sign' } }],
  create: () => new FundingStream()
};

chart.indicators.register(FUNDING);
const id = chart.indicators.add({ type: 'FUNDING' });

// 履歴をまとめて取得した：インジケーター全体を計算し直す
const history = (await (await fetch('/api/funding')).json()) as Array<[number, number]>;
history.forEach(([time, rate]) => rates.set(time, rate));
chart.indicators.refresh(id);

// 最新の足の値が変わった：その足だけを計算し直す
export function onRate(time: number, rate: number): void {
  rates.set(time, rate);
  chart.indicators.refresh(id, time);
}
```

`refresh(id, from)` は時刻 `from` を含む足から計算し直します。`from` が最新の足なら、ティックと同じくその足だけを計算します。それより前の足のとき、または `from` を省いたときは、インジケーター全体を最初から計算します。外のデータは計算器の状態ではないので `clone()` で複製する必要はありませんが、計算器自身の状態はこれまでどおりすべて複製します。チャートなしで計算するとき（`computeIndicator()`）は知らせる先がないため、計算器は呼び出した時点のデータを読みます。データが変わったら計算し直してください。

## チャートなしで計算する

```ts
import { computeIndicator } from '@kumo-charts/core/indicators';

const { dev } = computeIndicator(DEVIATION, bars, { params: { period: 50 } });
// dev[i] は i 本目の足の値。チャート上で計算した値と同じ
```

1 本ずつ進めるには `createIndicatorCalculator()` を使います。サーバーでリアルタイムデータに合わせて計算したり、アラートを判定したりするのに向いています。どれも Node.js で動きます。
