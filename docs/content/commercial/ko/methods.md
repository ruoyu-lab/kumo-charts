# 메서드

`createProChart()`가 돌려주는 객체(Vue, React 컴포넌트는 `created`에서 같은 객체를 넘겨줌):

| 멤버                                                         | 설명                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chart`                                                      | 현재 차트(`@kumo-charts/core`의 `Chart`). 상단 바와 그리기 도구가 이것에 작용합니다. 준비되기 전에는 `null`                                                                                                                                                                                                      |
| `charts`                                                     | 멀티 차트 레이아웃에 표시된 모든 차트. 현재 차트도 들어 있습니다. 컨테이너가 좁으면 현재 차트만 표시합니다                                                                                                                                                                                                       |
| `setSymbol(id, target?)`                                     | 현재 차트의 종목을 바꿉니다. 종목을 연동하면 모든 차트가 함께 바뀝니다. 먼저 `resolveSymbol`로 종목을 찾고, 찾지 못하면 거부하며 바꾸지 않습니다                                                                                                                                                                 |
| `setTimeframe(timeframe, target?)`                           | 현재 차트의 주기를 바꿉니다. 제공하는 주기 중 하나여야 합니다                                                                                                                                                                                                                                                    |
| `setChartType(type, settings?, target?)`                     | 차트 유형. ["차트 유형"](chart-types.md) 참고. `settings`는 설정이 있는 봉 유형(예: 틱 바)의 설정으로 `setChartType('tick', { count: 500 })`처럼 쓰며, 주지 않은 것은 그대로                                                                                                                                     |
| `applyOptions(options)`                                      | 표시한 뒤 옵션을 바꿉니다. 앞 절 참고                                                                                                                                                                                                                                                                            |
| `addIndicator(type, input?, target?)`                        | 현재 차트에 지표를 하나 더하고 그 id를 돌려줍니다. `input`(`ProChartIndicatorInput`)으로 `id`, `params`, `source`, `visible`, `lines`, `levels`, `autoscale`, `pane`(아래 참고)을 줄 수 있습니다                                                                                                                 |
| `updateIndicator(id, patch, target?)`                        | 지표를 바꿉니다. `params`, `lines`는 키별로 합치고, 나머지는 바꿉니다                                                                                                                                                                                                                                            |
| `removeIndicator(id, target?)`                               | 지표를 삭제합니다                                                                                                                                                                                                                                                                                                |
| `registerIndicator(indicator)`                               | 자체 지표를 등록합니다. ["사용자 지표"](custom-indicators.md) 참고                                                                                                                                                                                                                                               |
| `unregisterIndicator(type)`                                  | 페이지가 등록한 지표를 내립니다. 대화 상자에 더 이상 나오지 않고, 차트의 그 지표는 그려지지 않지만 상태에는 남으며, 다시 등록하면 다시 그려집니다                                                                                                                                                                |
| `registerDrawing(drawing)`                                   | 자체 그리기 도구를 등록합니다. ["사용자 그리기 도구"](custom-drawings.md) 참고                                                                                                                                                                                                                                   |
| `unregisterDrawing(type)`                                    | 페이지가 등록한 그리기 도구를 내립니다. 그리기 도구 모음에서 없어지고, 차트의 그 그리기는 그려지지 않지만 상태에는 남으며, 다시 등록하면 다시 그려집니다                                                                                                                                                         |
| `addComparison(symbol, input?, target?)`                     | 현재 차트에서 종목 하나를 비교하고 그 id를 돌려줍니다. `input`(`ProChartComparisonInput`)으로 `id`, `placement`(`percent` 기본값, `scale`, `pane`), `style`, `color`, `width`, `visible`을 줄 수 있습니다. ["종목 비교"](compare.md) 참고                                                                        |
| `updateComparison(id, patch, target?)`                       | 비교 종목을 바꿉니다. 준 설정은 바꾸고, 나머지는 그대로                                                                                                                                                                                                                                                          |
| `removeComparison(id, target?)`                              | 비교 종목을 뺍니다                                                                                                                                                                                                                                                                                               |
| `getAlerts(symbol?)`                                         | 모든 종목(또는 한 종목)의 알림. 각각 `symbol`과 `status`(페이지가 감시하고 있는지)가 붙습니다. ["알림"](alerts.md) 참고                                                                                                                                                                                          |
| `addAlert(alert, symbol?)`                                   | 종목에 알림을 더하고 그 id를 돌려줍니다. 종목을 쓰지 않으면 현재 차트의 종목                                                                                                                                                                                                                                     |
| `updateAlert(id, patch)`, `removeAlert(id)`                  | 알림 바꾸기(`ProChartAlertPatch`: 준 설정은 바꾸고, 나머지는 그대로), 알림 삭제                                                                                                                                                                                                                                  |
| `setRemoteAlerts(statuses)`                                  | 알림 판단을 다른 곳에 맡깁니다(예: 자체 서버. 페이지를 닫아도 평소처럼 알림). 페이지는 더 이상 감시하지 않고 준 상태를 표시합니다. `null`이면 페이지로 되돌립니다(["알림"](alerts.md) 참고)                                                                                                                      |
| `reportAlert(id, { time, price })`                           | 다른 곳에서 판단한 알림이 울렸을 때: 페이지가 스스로 울린 것과 똑같이 메시지를 띄우고, 소리를 내고, `alert` 이벤트(`remote: true`)를 내보냅니다                                                                                                                                                                  |
| `describeAlert(id)`                                          | 알림이 울릴 때 페이지가 쓰는 제목과 본문(`{ title, body }`, 차트의 현재 언어). 다른 곳에서 알림을 보낼 때 같은 말을 쓸 수 있습니다                                                                                                                                                                               |
| `setLayout(grid)`                                            | 멀티 차트 레이아웃: `single`, `columns`(좌우), `rows`(상하), `three`(왼쪽 큰 것 하나, 오른쪽 작은 것 둘), `three-right`(왼쪽 작은 것 둘, 오른쪽 큰 것 하나), `four`, `six-wide`(2행 3열), `six-tall`(3행 2열), `six-left`(왼쪽 큰 것 하나, 오른쪽 작은 것 다섯), `six-top`(위쪽 큰 것 하나, 아래쪽 작은 것 다섯) |
| `setLinks({ symbol, timeframe, crosshair, time, drawings })` | 다른 차트가 현재 차트를 따라 종목 변경, 주기 변경, 십자선 이동, 시간 맞추기를 할지, 그리기를 함께 쓸지(켜짐: 같은 종목의 차트가 그리기 하나를 함께 씀, 꺼짐: 각자 따로 그림). 준 것만 바꿉니다                                                                                                                   |
| `setActiveChart(index)`                                      | 레이아웃의 `index`번째(0부터) 차트를 현재 차트로 만듭니다                                                                                                                                                                                                                                                        |
| `setFavoriteTimeframes(timeframes)`                          | 상단 바에 바로 표시할 주기. 나머지는 주기 메뉴에 들어갑니다                                                                                                                                                                                                                                                      |
| `setFavoriteChartTypes(types)`                               | 상단 바 차트 유형 버튼 옆에 표시할 차트 유형. 메뉴에서 별표를 다는 것과 같습니다                                                                                                                                                                                                                                 |
| `setFavoriteDrawingTools(types)`                             | 즐겨찾는 그리기 도구 바에 둘 그리기 도구. 도구 목록에서 별표를 다는 것과 같으며, 비어 있으면 바를 표시하지 않습니다                                                                                                                                                                                              |
| `setAlertSound(sound)`                                       | 알림 소리의 전체 스위치와 음량: `{ on?, volume? }`. `volume`은 0에서 1까지이며, 주지 않은 것은 그대로                                                                                                                                                                                                            |
| `startReplay(time?, target?)`, `stopReplay(target?)`         | `time`의 봉부터 리플레이하며, 같은 종목의 차트도 함께입니다. `time`을 주지 않으면 리플레이 버튼을 누른 것과 같아서 사용자가 차트에서 시작점을 고릅니다                                                                                                                                                           |
| `openDialog(dialog)`, `closeDialog()`                        | 종목 검색(`symbolSearch`), 종목 비교(`compare`), 지표(`indicators`), 차트 설정(`chartSettings`), 차트 데이터 내보내기(`exportData`), 단축키 목록(`shortcuts`) 창을 엽니다                                                                                                                                        |
| `notify(text)`                                               | 차트 위에 알림 하나를 표시합니다. 사용자가 닫을 수 있습니다                                                                                                                                                                                                                                                      |
| `getChartView(target?)`                                      | 차트 하나가 표시하는 내용으로, 상태에 저장되는 것과 같습니다: 종목, 주기, 차트 유형과 봉 유형마다의 설정, 지표, 비교 종목, 가격축, 현재가, 그리고 사용자가 끌어 바꾼 창 높이(`paneHeights`)                                                                                                                      |
| `getLayout()`                                                | 레이아웃: `grid`(차트 몇 개), `active`(현재 차트), `links`(다른 차트가 현재 차트의 무엇을 따르는지)                                                                                                                                                                                                              |
| `getState()`                                                 | 상태 전체(`ChartState`). `storage`에 저장하는 것과 같습니다. ["상태 저장"](storage.md) 참고                                                                                                                                                                                                                      |
| `setState(state)`                                            | `getState()`가 준 상태를 표시합니다. 차트는 그것에 따라 다시 만들어집니다                                                                                                                                                                                                                                        |
| `getDrawings(target?)`                                       | 어떤 차트의 어떤 종목의 그리기. `target`은 `{ chart?, symbol? }`이며, 주지 않으면 현재 차트와 그 종목입니다. 그리기는 차트에 속하며, 표시하지 않은 종목의 것도 저장되어 있습니다                                                                                                                                 |
| `addDrawing(drawing, symbol?)`                               | 종목에 그리기를 하나 더하고 그 id를 돌려줍니다. 아래 "메서드로 그리기" 참고                                                                                                                                                                                                                                      |
| `updateDrawing(id, patch, symbol?)`                          | 그리기를 바꿉니다. `points`, `text`, `timeframes` 등은 통째로 바꾸고, `style`은 필드별로 합칩니다                                                                                                                                                                                                                |
| `removeDrawing(id, symbol?)`                                 | 그리기를 삭제합니다. 그리기에 걸린 알림도 함께 삭제합니다                                                                                                                                                                                                                                                        |
| `on(event, listener)`                                        | 이벤트를 듣고, 듣기를 멈추는 함수를 돌려줍니다                                                                                                                                                                                                                                                                   |
| `destroy()`                                                  | 차트를 페이지에서 없애고 시세 구독을 멈춥니다. 아직 대기 중인 호출은 함께 거부됩니다                                                                                                                                                                                                                             |

`chart`, `charts`, `on`, `destroy`를 빼면 메서드는 모두 Promise를 돌려줍니다:

- **준비되기 전에 호출하면 대기열에 들어가며**, 준비되면 호출한 순서대로 실행되므로 만들자마자 호출해도 괜찮습니다. 결과가 필요 없으면 그냥 호출하면 됩니다. `destroy()` 때 아직 대기 중인 호출은 그 뒤의 호출처럼 거부됩니다: `The pro chart was destroyed: create another one.`
- **잘못 쓰면 Promise가 거부되며**, 오류 메시지가 어디가 틀렸고 무엇을 쓸 수 있는지 알려 줍니다. 예: `There is no indicator "RSII": the types are MA, EMA, …`, `The timeframe "7m" is not offered: the timeframes are 1m, 5m, …`. 지표의 파라미터, 데이터 소스, 기준선은 차트 라이브러리의 `checkIndicatorInput()`으로 검사하며(매물대도 마찬가지), 오류 메시지는 차트 라이브러리의 `chart.indicators.add()`와 같습니다. 예: `params.period must be at least 1, received 0.`. 설정에 잘못 쓴 필드(예: `param`)가 있어도 거부되며, 조용히 무시되지 않습니다.
- 메서드는 기본적으로 현재 차트(상단 바에서 강조된 것)에 작용합니다. `target`을 받는 메서드는 현재 차트를 바꾸지 않고 레이아웃의 다른 차트를 조작할 수 있습니다. `{ chart: 1 }`은 두 번째(0부터)이며, 예를 들어 `addIndicator('RSI', {}, { chart: 1 })`입니다.

```ts
const id = await chart.addIndicator('RSI', { params: { period: 6 } });
await chart.updateIndicator(id, { lines: { rsi: { color: '#f59e0b', width: 2 } } });
chart.setLayout('columns');
chart.startReplay(Date.UTC(2026, 0, 5)); // 2026-01-05 봉부터 리플레이
```

지표를 어느 창에 그릴지는 `pane`으로 정합니다. `null`(기본값)은 지표 유형을 따르며, 메인 창 지표는 봉 위에, 나머지는 따로 창 하나에, 거래량은 봉 아래쪽에 그립니다. `'main'`은 봉 위에 그립니다(원래 따로 창을 쓰는 지표는 봉 위에서 자기 스케일을 써서 봉을 납작하게 만들지 않습니다). `'new'`는 따로 창 하나입니다. 차트에서 그 앞에 있는 다른 지표의 id를 쓰면 그 지표와 창을 함께 씁니다. 함께 쓰던 지표가 삭제되면 지표 유형을 따라 그립니다. 사용자가 창 경계를 끌어 바꾼 높이는 상태에 저장되어, 다음에 열어도 그 높이입니다.

```ts
const rsi = await chart.addIndicator('RSI');
await chart.addIndicator('KDJ', { pane: rsi }); // RSI와 같은 창에 그립니다
await chart.updateIndicator('vol-1', { pane: 'new' }); // 거래량을 따로 창 하나에
```

사용자도 화면에서 옮길 수 있습니다. 포인터를 범례의 지표 행에 올리면 끝의 "⋯" 버튼이 메뉴를 열고, "이동"에 "메인 차트"(이미 봉 위에 있으면 없음), "새 창"(이미 창 하나를 혼자 쓰고 있으면 없음), 그리고 다른 창에 있는 각 지표가 범례의 이름으로 "MACD 12 26 9와(과) 같은 창"처럼 나옵니다. 뒤에 있는 지표의 창으로 옮기면 차트에서의 순서도 그 지표 뒤로 함께 옮겨지므로 앞뒤를 신경 쓰지 않아도 됩니다. 원래 같은 창에 있던 지표는 원래 창에 남으며, 위치와 사용자가 끈 높이도 바뀌지 않습니다. 옮긴 것이 창의 첫 번째였다면 남은 지표의 차트 순서가 그 앞으로 옮겨지고, 창은 남은 첫 지표로 기록됩니다(`paneHeights`의 높이도 그쪽으로 옮겨짐). 새 창으로 옮긴 것은 항상 맨 아래에 새 창을 엽니다. 옮긴 결과는 `updateIndicator()`로 `pane`을 바꾼 것과 같이 상태에 저장되며, 창 높이도 그대로 기억됩니다. 매물대는 봉 위에 그리고 창을 차지하지 않으므로 이 메뉴가 없습니다.

`chart`와 `charts`는 차트 라이브러리의 `Chart`이며, 그 메서드(좌표 변환, 스크린샷, 마커 등)를 바로 쓸 수 있습니다. 지표와 그리기는 위의 메서드로 바꿔야 합니다. `chart`에 직접 더한 지표는 프로 차트가 알지 못하므로, 다음 동기화 때 제거됩니다.

차트는 다시 만들어질 수 있습니다. 멀티 차트 레이아웃을 바꾸거나, `setState()`를 하거나, 컨테이너가 좁아져 현재 차트만 표시할 때는 원래 `Chart`가 새것으로 바뀝니다. 페이지가 차트마다 자체 표시나 선을 두려면 `chartReady`를 듣습니다. 차트마다 만들어질 때(첫 차트 포함) 내보내며, 차트의 레이아웃에서의 위치, 새 `Chart`, 표시하는 종목과 주기가 담깁니다:

```ts
chart.on('chartReady', ({ instance, symbol }) => {
  instance.markers.set(myTrades(symbol)); // 페이지 자체의 체결 표시
});
```

차트가 종목이나 주기를 바꿔도 `Chart`는 바뀌지 않으므로, `symbolChange`, `timeframeChange`에 맞춰 직접 그린 것을 갱신합니다. 종목, 주기, 봉 유형을 바꾸면 차트는 원래의 시간과 확대 정도에 머뭅니다. 최신 봉을 보고 있었다면 새 최신 봉이 원래 자리에 나타나고(오른쪽 여백은 그대로), 과거를 거슬러 보고 있었다면 오른쪽 끝의 시간이 그대로이며, 새 데이터가 충분히 이전까지 없으면 먼저 과거를 불러온 뒤 그 시간으로 돌아갑니다.

## 메서드로 그리기

**그리기는 차트에 속합니다**: 각 차트(각 탭)의 그리기는 그릴 때 차트가 표시하던 종목별로 나뉘어 그 차트의 상태(`ChartView.drawings`)에 저장됩니다. 차트의 종목을 바꿨다가 되돌려도 원래 그리기가 남아 있습니다. 한 레이아웃의 여러 차트는 기본적으로 그리기를 함께 씁니다(`links.drawings`가 켜짐. 상단 바 레이아웃 메뉴의 "그리기 동기화"). 같은 종목을 표시하는 차트는 그리기 하나를 함께 쓰며 레이아웃 첫 차트의 상태에 저장되고, 어느 차트에서 그리든, 바꾸든, 실행 취소와 다시 실행을 하든 같습니다. 다른 종목을 표시하는 차트는 그 종목 자체의 그리기를 씁니다. "그리기 동기화"를 끄면 차트마다 따로 그립니다. 끌 때는 차트마다 그때의 그리기를 한 벌씩 받고, 켤 때는 각 차트의 그리기를 첫 차트로 합칩니다(같은 id는 하나로 봄). 새 차트를 열면 원래 차트의 상태를 (그 그리기와 함께) 복사하고, 그 뒤로는 따로 그립니다. 알림은 여전히 종목별로 저장되며, 감시하는 그리기는 각 차트에서 찾습니다(같은 그리기를 복사한 여러 차트에서는 id가 같아 하나로 봅니다).

`addDrawing()` 등 메서드의 `target`은 `{ chart?, symbol? }`이며, `chart`는 레이아웃에서 차트의 위치, `symbol`은 종목입니다. 둘 다 주지 않으면 현재 차트와 그것이 표시하는 종목입니다:

- 그 차트가 그 종목을 표시하고 있으면 그 차트에서 바꾸며, 사용자가 그린 것과 같아서 실행 취소할 수 있습니다.
- 그렇지 않으면 차트의 규칙으로 검사한 뒤 그 차트에 저장하고, 그 종목을 표시할 때 나타납니다.

그리기의 형식은 차트 라이브러리의 `chart.drawings.add()`와 같으며(`type`, `points`, `style`, `text`, `timeframes` 등. 차트 라이브러리의 그리기 문서 참고), `id`를 주지 않으면 자동으로 만듭니다. 좌표는 준 시간과 가격에 정확히 맞추며, 자석처럼 붙지 않습니다.

```ts
const id = await chart.addDrawing({
  type: 'horizontal-line',
  points: [{ time: Date.UTC(2026, 0, 5), price: 1688 }],
  style: { color: '#e5484d', lineStyle: 'dashed' },
  text: '저항선'
});
await chart.updateDrawing(id, { style: { extendRight: true } });
await chart.addDrawing({ type: 'rectangle', points: [/* … */] }, { chart: 1, symbol: '000001.SZ' }); // 두 번째 차트, 다른 종목
```

변화가 있을 때마다(사용자가 그리거나 바꾼 것이든, 메서드로 바꾼 것이든) `drawingsChange`를 내보내며, 그 차트의 그 종목의 그리기가 모두 담깁니다.
