# イベント

`chart.on(event, listener)` は、リッスンをやめる関数を返します：

| イベント                 | 内容                                                | いつ                                                                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ready`                  | `{ chart, instance, symbol, timeframe }`            | 最初のチャートができ、データの読み込みを始めたとき。内容は `chartReady` と同じで、現在のチャートです                                                                                                                                       |
| `chartReady`             | `{ chart, instance, symbol, timeframe }`            | レイアウト内のチャートが 1 つできたとき（作り直しも含む）。`chart` はレイアウト内での位置、`instance` はその `Chart` です。ここで各チャートにページ独自のマーカーやラインを追加します                                                      |
| `symbolChange`           | `{ chart, symbol }`                                 | 現在のチャートが表示する銘柄が変わったとき：ユーザーが選んだ、メソッドで切り替えた、または別のチャートが現在のチャートになった。`chart` は現在のチャートのレイアウト内での位置です                                                         |
| `watchlistStar`          | `{ symbol, starred }`                               | ユーザーが銘柄検索で星印をクリックしたとき：`starred` が `true` ならウォッチリストに追加、`false` なら外す要求です。ページは自分の一覧を変えてから `watchlist` に渡し直します。[「ウォッチリスト」](page-items.md)を参照                   |
| `timeframeChange`        | `{ chart, timeframe }`                              | 同上、時間足                                                                                                                                                                                                                               |
| `chartTypeChange`        | `{ chart, chartType, settings }`                    | 同上、チャートタイプ。現在のタイプの設定（たとえばティックバーの約定件数）を変えたときも発火します。`settings` は現在のタイプの設定で、設定のないタイプでは `null`                                                                         |
| `indicatorsChange`       | `{ chart, indicators }`                             | あるチャートのインジケーターが追加・削除された、パラメーターやラインが変わった、表示・非表示が切り替わったとき。`chart` はそのレイアウト内での位置です                                                                                     |
| `comparisonsChange`      | `{ chart, comparisons }`                            | あるチャートの比較銘柄が追加・削除された、表示位置やスタイルが変わった、表示・非表示が切り替わったとき                                                                                                                                     |
| `drawingsChange`         | `{ chart, symbol, drawings }`                       | あるチャートのある銘柄の描画が変わったとき（描画はチャートに属します）                                                                                                                                                                     |
| `alertsChange`           | `{ symbol, alerts }`                                | ある銘柄のアラートが追加・変更・移動・一時停止・再開・削除されたとき                                                                                                                                                                       |
| `alertStatusChange`      | `{ symbol, id, status }`                            | ページがアラートを監視しているかどうかが変わったとき：監視開始、データがまだ届いていない、一時停止、期限切れ、監視できない。[「アラート」](alerts.md)を参照                                                                                |
| `alert`                  | 下を参照                                            | アラートが発動したとき                                                                                                                                                                                                                     |
| `layoutChange`           | `{ grid, active, links }`                           | マルチチャートレイアウト、現在のチャート、連動の方法が変わったとき                                                                                                                                                                         |
| `crosshairMove`          | `{ chart, symbol, time, price, paneId }`            | ポインターがチャート上で動いたとき。離れると `time`、`price`、`paneId` が `null`                                                                                                                                                           |
| `visibleRangeChange`     | `{ chart, symbol, range }`                          | チャートに表示される足が変わったとき（ドラッグ、拡大縮小、読み込み）。`range` は `{ from, to }` で、最初と最後の足の時間                                                                                                                   |
| `chartClick`             | `{ chart, symbol, time, price, paneId }`            | チャートの描画領域をクリックしたとき                                                                                                                                                                                                       |
| `buttonClick`            | `{ id, item }`                                      | ページ独自のボタンをクリックしたとき。メニューがあるときは `item` が選んだメニュー項目                                                                                                                                                     |
| `drawingBarClick`        | `{ id, chart, symbol, drawing }`                    | フローティングバーのページ独自のボタン（`drawingBarItems`）をクリックしたとき。`drawing` は選択中の描画（`id` 付き）                                                                                                                       |
| `drawingToolChange`      | `{ active, magnet, continuous, hidden, favorites }` | 描画ツールの状態が変わったとき：ツールを持った・手放した、マグネット、連続描画、描画の非表示、お気に入りのツール                                                                                                                           |
| `drawingSelectionChange` | `{ selected }`                                      | 現在のチャートで選択中の描画が替わった・外れた、または選択中の描画が変わったとき。内容は[「自前の描画ツールバー」](drawings.md)を参照                                                                                                      |
| `drawingBoundsChange`    | `{ chart, id, bounds }`                             | 選択中の描画がウィンドウ内で位置を変えたとき。リッスンしているときだけ測ります                                                                                                                                                             |
| `contextMenuClick`       | `{ id, chart, symbol, time, price, order? }`        | ページ独自の右クリックメニュー項目を選んだとき                                                                                                                                                                                             |
| `contextMenuClose`       | `{ chart, symbol, time, price, order? }`            | ページの項目がある右クリックメニューが閉じた、または別のメニューに替わったとき。引数は開いたときに `contextMenu` に渡したものと同じで、たとえばメニューを開いているあいだに描いたものを片付けるのに使います                                |
| `dataError`              | `{ chart, symbol, request, interval, error }`       | データフィードでエラーが起きたとき：`request` は `symbol`（resolveSymbol）、`bars`（getBars）、`history`（左へ古い足を読み込む）のいずれか。`error` はデータフィードが投げたエラーで、自前の監視に報告できます                             |
| `storageError`           | `{ operation, error }`                              | ストレージでエラーが起きたとき：`operation` は `load`（読み込めず、今回開いているあいだは保存しない）か `save`（保存できず、次の変化で再び保存）。デフォルトのブラウザストレージは、容量がいっぱいのときや無効にされているときも報告します |

`alert` の内容：`id`（どのアラートか）、`symbol`、`timeframe`（どの時間足の足で判定したか）、`time`（発動したときの足の時間）、`price`（その足の終値）、`subject`（何を比べたか。描画はタイプで書くので、描画が削除されても意味がわかります：`{ source, trigger, value }`）、`message`（ユーザーが書いたメッセージ）、`replay`（履歴のリプレイ中に発動したかどうか）、`remote`（別の場所で判定され、`reportAlert()` で報告されたものかどうか。[「アラート」](alerts.md)を参照）、`title` と `body`（チャートの言語で書かれたアラートの文言。たとえば「アラート」「BTC/USDT 上抜け 68,000.00 · ブレイクを見る」で、そのままプッシュ通知に使えます）。

`time` はどれもミリ秒のタイムスタンプです。`price` はメインペインでは価格、サブペインではインジケーターの値です。すべてのイベント名は `PRO_CHART_EVENTS` にあります。`symbolChange` から `alertsChange` までの状態を報告するイベントは、一連の変化が終わってから発火し、結果だけを報告します。たとえば `setState()` で銘柄、レイアウト、インジケーターが変わっても、それぞれ 1 回だけ報告します。

```ts
// ページ独自の気配値バーをクロスヘアに追従させる。
chart.on('crosshairMove', ({ time, price }) => {
  quoteBar.show(time === null ? null : { time, price });
});

// データフィードのエラーを報告する。
chart.on('dataError', ({ symbol, request, error }) => {
  monitor.capture(error, { symbol, request });
});
```
