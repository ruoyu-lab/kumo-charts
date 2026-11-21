# カスタム描画ツール

描画ツールの描き方にはチャートライブラリの描画定義（`chart.drawings.register()` と同じもの。チャートライブラリの「カスタム描画ツール」を参照）を使います。プロチャートはそれをすべてのチャート（あとから作るチャートも含む）に登録して描画バーに置き、ユーザーは組み込みのツールと同じように描き、選択し、ドラッグし、スタイルを変え、アラートを設定でき、状態にも保存されます：

```ts
import { DRAWING_GROUP_IDS, type CustomDrawing } from '@kumo-charts/pro-chart';
import { fibRetracement } from '@kumo-charts/core/drawings';

const RULER: CustomDrawing = {
  name: { en: 'R ruler', zh: 'R 尺', ja: 'R 定規', ko: 'R 자' }, // 描画バーとメニューに出る名前。en は必須
  icon: 'M5 19L19 5M5 19h4M19 5v4', // 24×24 のグリッド上の SVG パスで、組み込みのアイコンと同じく線で描く。組み込みのアイコンの名前でもよい
  group: 'fibonacci', // どのグループに入れるか。DRAWING_GROUP_IDS のいずれか
  after: 'fib-retracement', // このツールの後ろに置く。なければグループの最後
  definition: { ...fibRetracement, type: 'r-ruler' } // タイプは組み込みのツールやページのほかのツールと同じ名前にはできない
};

const chart = createProChart(container, { datafeed, symbol: 'BTCUSDT', customDrawings: [RULER] });
```

ツールの定義があとから手に入るときは、`chart.registerDrawing(RULER)` で登録します。ページの一部がオフになるとき（たとえばツールを提供するプラグイン）は、`chart.unregisterDrawing('r-ruler')` で取り下げます。描画バーからはなくなり、チャート上のその描画は描かれず、そのアラートも止まりますが、チャートの状態には順序もそのままで残り、もう一度登録すると元どおりに描かれます。ユーザーがお気に入りに入れたページのツールは、取り下げているあいだはお気に入り描画ツールに表示されず、もう一度登録すると再び表示されます。
