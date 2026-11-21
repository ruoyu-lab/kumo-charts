# カスタム描画ツール

<!-- code-prelude
declare const priceZone: import('@kumo-charts/core/drawings').DrawingTypeDefinition;
declare const zoneId: string;
-->

独自の描画ツールも、組み込みのものと同じように扱えます。ユーザーが描き、ドラッグし、選択し、元に戻すことができ、レイアウトに保存でき、アラートで監視することもできます。

描画のタイプは、チャートに 3 つのことを伝えます。アンカーがいくつあるか、どう描くか（`paint`）、ポインターがどこにあればそれに当たったとみなすか（`hitTest`）です。ここでは「価格ゾーン」を作ります。2 つのアンカーで上下 2 本の価格ラインを決め、1 つ目のアンカーからチャートの右端まで伸ばします。

```ts live height=400
import { createChart, withAlpha } from '@kumo-charts/core';
import {
  drawings,
  type Anchors,
  type DrawingTypeDefinition,
  type Positions
} from '@kumo-charts/core/drawings';
import { loadBars } from '@docs/data';

const priceZone: DrawingTypeDefinition<Anchors<2>> = {
  type: 'price-zone',
  points: 2,
  // 設定画面で変更できるスタイル
  fields: ['color', 'fillColor', 'lineWidth', 'lineStyle'],
  defaultStyle: (theme) => ({ color: theme.accent, fillColor: withAlpha(theme.accent, 0.12) }),

  paint: ({ ctx, geometry, selected }) => {
    const { box } = zone(geometry.points);
    const { style, width } = geometry;
    ctx.fillStyle = style.fillColor;
    ctx.fillRect(box.left, box.top, width - box.left, box.bottom - box.top);
    ctx.strokeStyle = style.color;
    ctx.lineWidth = selected ? style.lineWidth + 1 : style.lineWidth;
    ctx.beginPath();
    ctx.moveTo(box.left, box.top);
    ctx.lineTo(width, box.top);
    ctx.moveTo(box.left, box.bottom);
    ctx.lineTo(width, box.bottom);
    ctx.stroke();
  },

  hitTest: (geometry, point, tolerance) => {
    const { box } = zone(geometry.points);
    if (point.x < box.left - tolerance) return null;
    const edge = Math.min(Math.abs(point.y - box.top), Math.abs(point.y - box.bottom));
    if (edge <= tolerance) return { part: 'line', distance: edge };
    return null;
  }
};

/** 2 つのアンカーで囲まれた範囲（ピクセル座標） */
function zone([a, b]: Positions<Anchors<2>>) {
  return {
    box: { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y) }
  };
}

const chart = createChart(document.getElementById('chart')!, {
  modules: [drawings([priceZone])]
});

chart.data.set(await loadBars(), { interval: '1m' });
chart.data.setTimeframe('1h');
chart.drawings.startTool('price-zone'); // チャートを 2 回クリックしてみる
```

## 座標

`paint` と `hitTest` が受け取る `geometry` には、次のものが入っています。

- `points`：アンカーのピクセル座標。ペインのプロット領域の左上を基準とし、置かれた順に並ぶ。
- `anchors`：アンカーの時間と価格。
- `width`、`height`：プロット領域のサイズ。
- `style`：この描画の最終的なスタイル（デフォルト値に描画自身のスタイルを重ねたもの）。
- `valueToY`、`yToValue`、`timeToX`：価格・時間とピクセルの間の換算。追加のラインを描くときに使う。
- `bars`：表示されている足。たとえばアンカー以降の最高値を探すときに使う。
- `formatValue`：価格を軸と同じ書式で表示する。ラベルを描くときに使う。
- `theme`、`textFont`、`measureText`：テキストを描くときに使う。

`DrawingTypeDefinition<Anchors<2>>` のようにアンカーの数で型を書くと、`points` と `anchors` はちょうど 2 つの組になり、あるかどうかを確かめずに取り出せます。チャートは `points` と同じ数のアンカーを渡します。

`paint` の `ctx` はすでにプロット領域にクリップされ、座標も平行移動済みなので、そのまま CSS ピクセルで描けば大丈夫です。高解像度ディスプレイのスケーリングはチャートが処理します。`hovered` と `selected` は、ポインターがその上にあるか、選択されているかを表すので、目立つように描き分けるのに使えます。 破線は描画の線種どおりに描きます。`dashPattern(style.lineStyle, style.lineWidth)`（`@kumo-charts/core/drawings` から読み込み）で、組み込みの描画と同じ破線になります。

## 当たり判定

`hitTest` は当たらなければ `null` を返し、当たったときは `part` と距離を返します。`line` は線上、`body` は文字やラベルの枠、塗りつぶして描いたマークといった描画の中身です。塗りつぶしの部分では当たりを返さないでください。塗りつぶしは描画の背景で、そこをクリックすると下にあるものに当たり、ドラッグするとチャートがスクロールします。描画は、チャート組み込みの描画と同じく線をクリックして選びます。描画どうし、あるいは注文ラインやアラートのラインと重なっているときは、線上に当たったものが中身に当たったものより優先されます。同じく線上（または中身）に当たったものの中では近いものが、同じ距離なら上にある（後から描いた）ものが優先されます。`tolerance` はチャートの `interaction.hitTolerance` で、デフォルトは 6 ピクセルです。

ハンドル（ドラッグして形を変える小さな点）はチャートが処理します。デフォルトではアンカーごとに 1 つあり、ドラッグするとそのアンカーが動きます。別のハンドルが必要なときは `handles()` と `moveHandle()` を書きます。`moveHandle()` の 4 番目の引数 `space` は、時間と価格を描くときの位置（足の番号、軸の目盛り上の値）に変換します。この空間で計算すれば、対数軸でも、足の間に欠けがあっても、ハンドルがちょうどポインターの下に来ます。`unitHeight` は目盛りの 1 単位が画面上で足何本分の幅の高さかを表し、これを使うと角度や長さが画面に見えるとおりになります。5 番目の引数はその描画のスタイルです。ハンドルの `id` がアンカーの番号（`'0'`、`'1'`…）なら `moveHandle()` は省略でき、ドラッグするとそのアンカーが動きます。`id` がアンカーの番号ではないのに `moveHandle()` がないと、ハンドルが表示された時点でエラーになります。

## その他のオプション

| オプション            | 働き                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `points: 0`           | アンカー数が決まっていない。ダブルクリックか Enter で終了する。パスなど                                                                                                                                             |
| `freehand`            | 押したままドラッグして描く。ブラシなど（`points: 0` と組み合わせる）                                                                                                                                                |
| `place`、`complete()` | ユーザーが置くのは最初のいくつかのアンカーだけで、残りはあなたが計算する。目標価格から対称に損切り価格を出すなど。`complete()` は `points` 個のアンカーを返すこと。そうでないとそのクリックでは置けず、エラーになる |
| `mainPane`            | メインペインのローソク足から計算する（`geometry.bars` を読むなど）。メインペインにだけ置ける                                                                                                                        |
| `paintBelow()`        | ローソク足の下に描く部分。ポジションの損益エリアなど                                                                                                                                                                |
| `editableText`        | 置いた直後とダブルクリックしたときに、テキスト編集ボックスを開く                                                                                                                                                    |
| `axisMarks()`         | 選択中に軸上で強調表示する価格と時間。2 番目の引数はスタイル                                                                                                                                                        |
| `bounds()`            | 描画が占める範囲（アンカーの外に伸びる線やラベルを含む）。`chart.drawings.bounds()` はこれを返す。何も描かないときは `null` で、ユーザーもそこには置けない。省略するとハンドルを囲む範囲                            |
| `levels()`            | アラートが監視できるライン                                                                                                                                                                                          |

`bounds()` を書いた描画は、その範囲が画面の外に完全に出ているときは描かれず、ポインターが近くにないときは当たり判定もされません。そのため `bounds()` には描くものと当たるものをすべて含めてください。書かない描画はいつも描かれ、判定されます。

## アラートで監視できるようにする

```ts no-check
levels: ([a, b]) => {
  const top = Math.max(a.price, b.price);
  const bottom = Math.min(a.price, b.price);
  const time = Math.min(a.time, b.time);
  return [
    // 2 点の時間が同じなら水平線になる。extend: 'end' で右端まで伸ばす
    { key: 'top', from: { time, price: top }, to: { time, price: top }, extend: 'end' },
    { key: 'bottom', from: { time, price: bottom }, to: { time, price: bottom }, extend: 'end' }
  ];
};
```

これで「価格がこのゾーンに入った」というアラートを設定できます。

```ts
chart.alerts.add({
  id: 'zone',
  trigger: 'enter-channel',
  value: [
    { kind: 'drawing', id: zoneId, level: 'top' },
    { kind: 'drawing', id: zoneId, level: 'bottom' }
  ]
});
```

## 使う

```ts
import { drawings, allDrawings } from '@kumo-charts/core/drawings';

createChart(container, { modules: [drawings([...allDrawings, priceZone])] });

// または作成したあとで
chart.drawings.register(priceZone);
```

新しいバージョンの定義に差し替える（ページがこの描画の描き方を更新したなど）には `replace()` を使います。チャート上のこの種類の描画は残り、新しい定義で描き直されます。このツールを使用中なら取り消されます。アンカー数が変わる場合は、先にチャート上のこの種類の描画を削除してから差し替えます。不要になったら `unregister()` で外します（チャート上にこの種類の描画があるとエラーになります）。

描画以外のデータ（ページが描画ごとに計算した値など）を読んで描く場合、データが変わったら `refresh()` を呼んで描き直します。チャートはデータの変化を自分では検知できません。

```ts
chart.drawings.replace({ ...priceZone, fields: ['color', 'fill', 'fillColor'] });
chart.drawings.refresh();
```

スタイルをチャートが受け付けるか先に確かめるには（ユーザーが入力したもの、別の場所に保存したものなど）、`checkDrawingStyle()` を使います。受け付けられない場合は、どこが違うかを示すエラーになります。

```ts
import { checkDrawingStyle } from '@kumo-charts/core/drawings';

checkDrawingStyle({ lineWidth: 2, levelRange: { start: 0, end: -1 } });
```
