# Vue と React

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { KumoProChart } from '@kumo-charts/pro-chart/vue';

const symbol = ref('600519.SH');
const theme = ref<'light' | 'dark'>('light');
</script>

<template>
  <div style="height: 600px">
    <KumoProChart
      :options="{ datafeed, upColor: 'red', theme }"
      v-model:symbol="symbol"
      @indicators-change="save"
      @button-click="({ id }) => id === 'trade' && openTicket()"
      @created="(c) => (chart = c)"
    />
  </div>
</template>
```

```tsx
import { KumoProChart } from '@kumo-charts/pro-chart/react';

const options = useMemo(() => ({ datafeed, upColor: 'red', theme }), [theme]);

<div style={{ height: 600 }}>
  <KumoProChart
    options={options}
    symbol={symbol}
    onSymbolChange={(event) => setSymbol(event.symbol)}
    onIndicatorsChange={save}
    onCreated={setChart}
  />
</div>;
```

- コンポーネントの名前は `KumoProChart` で、オープンソース版の `KumoChart` に対応します。`createProChart()` が返すチャートオブジェクトの型は `ProChart` です。
- `options` のうち `applyOptions()` で変えられるもの（テーマ、言語、色、画面の文言、機能の切り替え、ボタンとメニュー、ウォッチリスト、描画ツールバー……）は追従します。新しいオブジェクトを渡すと（Vue ではリアクティブなオブジェクトのキーを変えても同じ）、変わったものを `applyOptions()` で反映し、外したものはデフォルトに戻ります。`features`、`messages`、`themes` は `applyOptions()` と同じくキーごとにマージします。`datafeed`、`storage`、`customIndicators` のようなものはマウント時に 1 回だけ読みます。React では `useMemo` などで、変わっていないときはオブジェクトを同じものに保ち、レンダーのたびに作り直さないでください。それ以外の操作は、`created` で渡されるチャートオブジェクトを通して行います。
- `symbol` と `timeframe` はプロパティとしてバインドできます。プロパティが変わるとチャートも変わります。`symbol` や `timeframe` をバインドしたときはページが決め、開いたときもその値を使い、ユーザーが最後に見ていたものは復元しません。Vue では `v-model:symbol`、`v-model:timeframe` で双方向にバインドし、React では `onSymbolChange`、`onTimeframeChange` と組み合わせます。`symbol` をバインドしたときは `options` に書かなくても構いません。
- ページが渡したものをチャートが受け付けないとき（データフィードで見つからない銘柄、提供していない時間足、書き間違えたオプションなど）は、チャートは元のままで、Vue の `@prop-error`、React の `onPropError` が `{ prop, value, error }` を受け取ります。`prop` は `symbol`、`timeframe`、`options` のいずれか、`value` はページが渡した値（`options` のときは変わったオプション）、`error` は対応するメソッド（`setSymbol()`、`setTimeframe()`、`applyOptions()`）が reject したエラーです。リスナーがないと、エラーは誰も処理しない Promise の reject として投げられ、ブラウザのコンソールで確認できます。コンポーネントのアンマウント時にまだ順番が来ていなかったプロパティは報告しません。
- どのイベントも直接リッスンできます。Vue では `@symbol-change`、`@indicators-change`、`@crosshair-move`……、React では `onSymbolChange`、`onIndicatorsChange`、`onCrosshairMove`……で、常に最新のレンダーで渡された関数を呼びます。`created`（React では `onCreated`）はコンポーネントのマウント時にチャートオブジェクトを渡し、最初のチャートができるのを待ちません。`ready` はほかのイベントと同じく、最初のチャートができたときに発火します。
- React は 18 と 19 に対応し、StrictMode も含みます。
