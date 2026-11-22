# 色とフォント

`upColor` と `accentColor` で足りるならそれを使えば十分です。Web サイトの配色に合わせるには、`themes` でテーマごとに色を変えます。`tokens` は画面のデザイン変数（CSS カスタムプロパティで、`--` は付けない）、`chart` はチャート自体の色（チャートライブラリの `Theme`）です。

```ts
createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  theme: 'dark',
  fontFamily: '"HarmonyOS Sans", system-ui, sans-serif',
  themes: {
    dark: {
      tokens: {
        'app-bg': '#0b0e11',
        panel: '#161a1e',
        border: '#2b3139',
        accent: '#f0b90b',
        'accent-text': '#0b0e11'
      },
      chart: { background: '#161a1e', up: '#0ecb81', down: '#f6465d' }
    }
  }
});
```

主なデザイン変数：`app-bg`（いちばん外側の背景色）、`panel`（トップバーと描画ツールバーの背景色）、`panel-raised`（メニュー、ウィンドウ）、`border`（区切り線）、`text`、`muted`（副次的な文字）、`faint`（さらに薄い文字）、`accent`、`accent-strong`、`accent-text`（メインカラーと、メインカラーの上の文字）、`up`、`down`（画面での上昇・下落の色）、`hover`、`selected-bg`、`selected-text`（ホバー、選択）、`radius`（角丸）。すべて `THEME_TOKENS` にあります。チャートの色：`background`、`grid`、`text`、`up`、`down`、`volumeUp`、`volumeDown`、`accent`、`crosshair`、`palette`（インジケーターのラインが順に使う色）など。

`upColor: 'red'` がまず上昇・下落の色を入れ替え、`themes` で渡した色がその上にかぶさります。ユーザーがチャート設定で変えた色（各チャートの背景、グリッド、ローソク足の色）が優先されます。

## CSS でスタイルを変える

チャートは Shadow DOM の中にあり、ページのスタイルは入り込めませんが、次の部分は `::part()` で選べます：`topbar`（トップバー）、`drawing-toolbar`（描画ツールバー）、`chart-area`（すべてのチャートの領域）、`chart`（各チャート）、`custom-button`（ページ独自のボタン）。

```css
kumo-pro-chart::part(topbar) {
  border-bottom-width: 2px;
}

kumo-pro-chart::part(custom-button) {
  font-weight: 600;
}
```

`kumo-pro-chart` 要素そのもの（コンテナ内のもの）には、枠線や角丸などを直接付けられます。色は CSS ではなく `themes` で変えてください。`themes` はチャート自体の色も変え、テーマを切り替えるとそれに合わせて変わります。
