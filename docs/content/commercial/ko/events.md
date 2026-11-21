# 이벤트

`chart.on(event, listener)`는 듣기를 멈추는 함수를 돌려줍니다:

| 이벤트                   | 내용                                                | 언제                                                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`                  | `{ chart, instance, symbol, timeframe }`            | 첫 차트가 만들어져 데이터를 불러오기 시작할 때. 내용은 `chartReady`와 같으며, 현재 차트입니다                                                                                                                              |
| `chartReady`             | `{ chart, instance, symbol, timeframe }`            | 레이아웃의 차트 하나가 만들어질 때(다시 만들 때 포함). `chart`는 레이아웃에서의 위치, `instance`는 그 `Chart`입니다. 여기서 차트마다 페이지 자체의 표시나 선을 더합니다                                                    |
| `symbolChange`           | `{ chart, symbol }`                                 | 현재 차트가 표시하는 종목이 바뀔 때: 사용자가 골랐거나, 메서드로 바꿨거나, 다른 차트가 현재 차트가 되었을 때. `chart`는 현재 차트의 레이아웃에서의 위치입니다                                                              |
| `watchlistStar`          | `{ symbol, starred }`                               | 사용자가 종목 검색에서 별표를 눌렀을 때: `starred`가 `true`면 관심 종목에 넣으려는 것, `false`면 빼려는 것입니다. 페이지는 자기 목록을 바꾼 뒤 다시 `watchlist`에 줍니다. ["관심 종목"](page-items.md) 참고                |
| `timeframeChange`        | `{ chart, timeframe }`                              | 위와 같음, 주기                                                                                                                                                                                                            |
| `chartTypeChange`        | `{ chart, chartType, settings }`                    | 위와 같음, 차트 유형. 현재 유형의 설정(예: 틱 바의 체결 건수)을 바꿨을 때도 내보냅니다. `settings`는 현재 유형의 설정이며, 설정이 없는 유형은 `null`                                                                       |
| `indicatorsChange`       | `{ chart, indicators }`                             | 어떤 차트의 지표가 추가·삭제되었거나, 파라미터나 선이 바뀌었거나, 표시·숨김이 바뀌었을 때. `chart`는 레이아웃에서의 위치입니다                                                                                             |
| `comparisonsChange`      | `{ chart, comparisons }`                            | 어떤 차트의 비교 종목이 추가·삭제되었거나, 위치나 스타일이 바뀌었거나, 표시·숨김이 바뀌었을 때                                                                                                                             |
| `drawingsChange`         | `{ chart, symbol, drawings }`                       | 어떤 차트의 어떤 종목의 그리기가 바뀌었을 때(그리기는 차트에 속함)                                                                                                                                                         |
| `alertsChange`           | `{ symbol, alerts }`                                | 어떤 종목의 알림이 추가·변경·이동·일시정지·재개·삭제되었을 때                                                                                                                                                              |
| `alertStatusChange`      | `{ symbol, id, status }`                            | 페이지가 알림을 감시하는지가 바뀌었을 때: 감시 시작, 데이터가 아직 오는 중, 일시정지, 만료, 감시할 수 없음. ["알림"](alerts.md) 참고                                                                                       |
| `alert`                  | 아래 참고                                           | 알림이 울렸을 때                                                                                                                                                                                                           |
| `layoutChange`           | `{ grid, active, links }`                           | 멀티 차트 레이아웃, 현재 차트, 연동 방식이 바뀌었을 때                                                                                                                                                                     |
| `crosshairMove`          | `{ chart, symbol, time, price, paneId }`            | 포인터가 차트 위에서 움직일 때. 벗어나면 `time`, `price`, `paneId`가 `null`                                                                                                                                                |
| `visibleRangeChange`     | `{ chart, symbol, range }`                          | 차트에 표시되는 봉이 바뀌었을 때(드래그, 확대·축소, 불러오기). `range`는 `{ from, to }`로, 첫 봉과 마지막 봉의 시간                                                                                                        |
| `chartClick`             | `{ chart, symbol, time, price, paneId }`            | 차트의 그리기 영역을 눌렀을 때                                                                                                                                                                                             |
| `buttonClick`            | `{ id, item }`                                      | 페이지 자체의 버튼을 눌렀을 때. 메뉴가 있으면 `item`이 고른 메뉴 항목                                                                                                                                                      |
| `drawingBarClick`        | `{ id, chart, symbol, drawing }`                    | 플로팅 바의 페이지 자체 버튼(`drawingBarItems`)을 눌렀을 때. `drawing`은 선택된 그리기(`id` 포함)                                                                                                                          |
| `drawingToolChange`      | `{ active, magnet, continuous, hidden, favorites }` | 그리기 도구의 상태가 바뀌었을 때: 도구를 집어 들거나 내려놓음, 자석, 연속 그리기, 그리기 숨기기, 즐겨찾는 도구                                                                                                             |
| `drawingSelectionChange` | `{ selected }`                                      | 현재 차트에서 선택된 그리기가 바뀌었거나 풀렸거나, 선택된 그리기가 변했을 때. 내용은 ["직접 만드는 그리기 도구 모음"](drawings.md) 참고                                                                                    |
| `drawingBoundsChange`    | `{ chart, id, bounds }`                             | 선택된 그리기가 창 안에서 위치를 옮겼을 때. 들을 때만 잽니다                                                                                                                                                               |
| `contextMenuClick`       | `{ id, chart, symbol, time, price, order? }`        | 페이지 자체의 우클릭 메뉴 항목을 골랐을 때                                                                                                                                                                                 |
| `contextMenuClose`       | `{ chart, symbol, time, price, order? }`            | 페이지 항목이 있는 우클릭 메뉴가 닫혔거나 다른 메뉴로 바뀌었을 때. 인수는 열 때 `contextMenu`에 준 것과 같으며, 예를 들어 메뉴가 열려 있는 동안 그린 것을 치우는 데 씁니다                                                 |
| `dataError`              | `{ chart, symbol, request, interval, error }`       | 데이터 피드에서 오류가 났을 때: `request`는 `symbol`(resolveSymbol), `bars`(getBars), `history`(왼쪽으로 이전 봉 불러오기) 중 하나. `error`는 데이터 피드가 던진 오류로, 자체 모니터링에 보고할 수 있습니다                |
| `storageError`           | `{ operation, error }`                              | 저장소에서 오류가 났을 때: `operation`은 `load`(읽지 못함. 이번에 열려 있는 동안 저장하지 않음) 또는 `save`(저장하지 못함. 다음 변화 때 다시 저장). 기본 브라우저 저장소는 공간이 가득 찼거나 사용할 수 없을 때도 알립니다 |

`alert`의 내용: `id`(어느 알림인지), `symbol`, `timeframe`(어느 주기의 봉으로 판단했는지), `time`(울릴 때 그 봉의 시간), `price`(그 봉의 종가), `subject`(무엇을 비교했는지. 그리기는 유형으로 쓰므로 그리기가 삭제되어도 알아볼 수 있음: `{ source, trigger, value }`), `message`(사용자가 쓴 메시지), `replay`(과거를 리플레이하는 중에 울렸는지), `remote`(다른 곳에서 판단해 `reportAlert()`로 알려 온 것인지. ["알림"](alerts.md) 참고), `title`과 `body`(차트의 언어로 쓴 알림 문구. 예: "알림" "BTC/USDT 상향 교차 68,000.00 · 돌파 확인"이며, 그대로 푸시에 쓸 수 있음).

`time`은 모두 밀리초 타임스탬프이고, `price`는 메인 창에서는 가격, 보조 창에서는 지표의 값입니다. 모든 이벤트 이름은 `PRO_CHART_EVENTS`에 있습니다. `symbolChange`부터 `alertsChange`까지 상태를 알리는 이벤트는 한 차례의 변화가 끝난 뒤에 내보내며, 결과만 알립니다. 예를 들어 `setState()`가 종목, 레이아웃, 지표를 바꿔도 각각 한 번만 알립니다.

```ts
// 페이지 자체의 시세 바가 십자선을 따라갑니다.
chart.on('crosshairMove', ({ time, price }) => {
  quoteBar.show(time === null ? null : { time, price });
});

// 데이터 피드 오류를 보고합니다.
chart.on('dataError', ({ symbol, request, error }) => {
  monitor.capture(error, { symbol, request });
});
```
