# 状態の保存

デフォルトではブラウザに保存されるので、別の端末では消えてしまいます。ユーザーアカウントごとに同期するには、`storage` を渡します：

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  storage: {
    // まだ保存していないときは null。読み込めないとき（ネットワークやサーバーのエラー）は null ではなくエラーを投げる。
    load: async () => {
      const response = await fetch('/api/chart-state');

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`チャートの状態を読み込めませんでした：${response.status}`);
      }

      return response.json();
    },
    save: (state) => {
      void fetch('/api/chart-state', { method: 'PUT', body: JSON.stringify(state) });
    }
  }
});
```

`state` は JSON オブジェクト（`ChartState`）で、マルチチャートレイアウトと境目の位置、各チャートの銘柄、時間足、チャートタイプ（足の種類ごとの設定を含む）、インジケーター（それぞれのパラメーターとラインの設定を含む）と比較銘柄、インジケーターテンプレート、価格軸と現在値の表示、お気に入りの時間足・チャートタイプ・描画ツール・インジケーター、各チャート独自の描画（描いたときの銘柄ごとに分けて保存）、銘柄ごとに保存するアラート、描画ツールごとに最後に使ったスタイル、リプレイの小ウィンドウ・描画のフローティングツールバー・お気に入り描画ツールのバーをドラッグした位置、お気に入り描画ツールのバーを表示するかどうか、ユーザーが選んだタイムゾーン（`timeZone`：`exchange`、`local`、タイムゾーン名。選んでいなければ `null`）を含みます。チャートは変化が止まってから 0.5 秒後に `save()` を呼び、内容が変わっていなければ呼びません。ページを閉じるときは、まだ保存していない分を保存します。`load()` がエラーを投げるか reject したときは、チャートはデフォルトの状態から始め、今回開いているあいだは `save()` を呼びません。読み込めなかった状態がデフォルトの状態で上書きされないようにするためです。`save()` が失敗したときは、次に変化したときにもう一度保存します。どちらの失敗でも `storageError` イベントが発火します。状態にはバージョン番号があり、チャートは現在のバージョンの状態だけを読み、ほかのバージョンならデフォルトの状態から始めます。読み込んだ状態は項目ごとに検査し、壊れたフィールドはデフォルト値を使います。テーマと言語はストレージから読まず、ページが決めます。

自動保存ではなく、ユーザーが「レイアウトを保存」をクリックしたときだけ保存したい、または複数のレイアウトを切り替えたいときは、`storage: null` と 2 つのメソッドを使います：

```ts
const layouts = new Map<string, ChartState>();

saveButton.onclick = async () => layouts.set(name, await chart.getState());
layoutMenu.onselect = (name) => chart.setState(layouts.get(name)!);
```

`setState()` は新しい状態でチャートを作り直し、読み方は `storage` と同じです。項目ごとに検査し、壊れたフィールドはデフォルト値を使い、バージョンが違うときは reject します。
