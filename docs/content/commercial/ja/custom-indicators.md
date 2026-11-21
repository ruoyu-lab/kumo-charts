# カスタムインジケーター

インジケーターのアルゴリズムにはチャートライブラリのインジケーター定義（`chart.indicators.register()` と同じもの）を使います。プロチャートはそれをすべてのチャート（あとから作るチャートも含む）に登録してインジケーターウィンドウに並べ、ユーザーは組み込みのインジケーターと同じように追加したり、パラメーターやラインを変えたりでき、状態にも保存されます：

```ts
import type { CustomIndicator } from '@kumo-charts/pro-chart';

const MID: CustomIndicator = {
  name: { en: 'Mid price', zh: '中间价', ja: '中値', ko: '중간가' }, // コードの後ろに出る名前。en は必須
  group: 'trend', // どのグループに並べるか：trend、bands、oscillators、volume、volatility、other（デフォルト）。plugins は最後にある独立した「プラグイン」グループ
  // origin: { en: 'My plugin', zh: '我的插件' }, // ダイアログで名前の横に出所を書く。たとえば提供するプラグイン
  definition: {
    type: 'MID', // コード。インジケーターウィンドウと凡例に表示され、組み込みのインジケーターと同じ名前にはできない
    name: 'MID',
    pane: 'main', // メインペインに重ねる。'new' は専用のサブペイン
    precision: 'price',
    params: { period: { default: 5, min: 1, max: 200, integer: true, label: 'Period' } },
    outputs: () => [{ key: 'mid', label: 'MID', plot: { kind: 'line' } }],
    lookback: ({ period }) => period as number,
    // bars は直近 lookback 本の足で、古い順。
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

インジケーターの定義があとから手に入るときは、`chart.registerIndicator(MID)` で登録します。ユーザーが保存したカスタムインジケーターは、登録すると表示されます。`customIndicators` に入れておけば開いたときから表示されます。コードは組み込みのインジケーターと同じ名前にはできません。ページの一部がオフになるとき（たとえばインジケーターを提供するプラグイン）は、`chart.unregisterIndicator('MID')` で取り下げます。インジケーターのダイアログには出なくなり、チャート上のそのインジケーターは描かれず、それを読むアラートも止まりますが、チャートの状態には残り、パラメーターも失われず、もう一度登録すると元どおりに描かれます。

## 数式で書く

アルゴリズムを書きたくないときは、中国の相場ソフトの数式を使えます。`definition` の代わりに `formula` を使い、たとえば `{ formula: { type: 'MYMACD', name: 'MYMACD', formula: 'DIF:EMA(C,12)-EMA(C,26); …' } }` のように書きます。書き方、関数、オプションは[数式](formula.md)を参照してください。
