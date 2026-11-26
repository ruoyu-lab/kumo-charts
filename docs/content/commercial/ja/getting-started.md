# クイックスタート

npm でインストールします。

```bash
npm install @kumo-charts/pro-chart
```

自分のパソコンの開発サーバーではライセンスキーは要りません。本番の Web サイトやアプリでは必要です。[「ライセンス」](license.md)を参照してください。

```ts
import { createProChart } from '@kumo-charts/pro-chart';

const chart = createProChart(document.getElementById('chart')!, {
  datafeed: myDatafeed, // 下の「相場データ」を参照
  symbol: '600519.SH'
});
```

チャートはコンテナいっぱいに広がるので、コンテナには高さを設定してください。チャートは専用の Shadow DOM の中に置かれます。ページのスタイルはチャートに影響せず、チャートのスタイルもページに影響しません。1 つのページに複数置けます。

よく使うものをいくつか加えると：

```ts
const chart = createProChart(container, {
  datafeed: myDatafeed,
  symbol: '600519.SH',
  upColor: 'red', // 上昇を赤、下落を緑に
  accentColor: '#c2410c', // ブランドカラー
  brand: { name: 'Acme 証券', logo: '/logo.svg', href: '/' },
  licenseKey: 'KCS1.…'
});

// ページ独自の銘柄一覧やボタンなどから、メソッドでチャートを切り替えます。
watchlist.on('select', (id) => chart.setSymbol(id));

// アラートが発火したら、ページが自分で通知を送ります。
chart.on('alert', (event) => {
  push(event.title, event.body); // 「アラート」「貴州茅台 上抜け 1,688.00」など
});
```

この先はカスタマイズです。独自のボタンや右クリックメニュー（たとえば「注文」）の追加、独自インジケーターの登録、サイトの配色への合わせ込み、メソッドによるインジケーター・レイアウト・リプレイの操作、チャートの状態をまるごと自前のサーバーに保存すること。どれも以降のページにあります。

## 普通の Web ページ

Vue や React もバンドラーも使わないページでは、パッケージに入っている 1 ファイルの ES モジュール `dist/browser/pro-chart.js` を CDN から読み込みます。チャート、Vue ランタイム、商用版のコンポーネントがすべて入っていて、どのフレームワークにも依存しません。圧縮後は約 1.3MB、gzip で約 420KB です。本番のサイトでは、新しいバージョンが出ても変わらないよう、アドレスにバージョンを書きます（`@kumo-charts/pro-chart@バージョン/…`）。

```html
<div id="chart" style="height: 600px"></div>
<script type="module">
  import { createProChart } from 'https://cdn.jsdelivr.net/npm/@kumo-charts/pro-chart/dist/browser/pro-chart.js';

  createProChart(document.getElementById('chart'), { datafeed, symbol: 'BTCUSDT' });
</script>
```

チャートは専用の Shadow DOM の中にあるので、ページ側でボタン、枠線、文字サイズを変えるスタイルは影響しません。Vue と React ではコンポーネントを使います。[「Vue と React」](frameworks.md)を参照してください。

## 含まれないもの

売買注文（証券口座との接続、注文、ポジション）、相場データそのもの、ウォッチリストそのものとサイドパネル（ページには普通それぞれ独自のものがあり、ウォッチリストは銘柄検索の星印につなげられます）、ユーザーアカウントとバックエンド。注文の入口は、[独自のボタンや右クリックメニュー](page-items.md)でページ独自の取引画面につなげられます。
