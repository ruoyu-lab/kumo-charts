# 事件

`chart.on(event, listener)`，返回取消监听的函数：

| 事件                     | 内容                                                | 什么时候                                                                                                                                                   |
| ------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`                  | `{ chart, instance, symbol, timeframe }`            | 第一张图建好、开始加载数据，内容和 `chartReady` 一样，是当前的图                                                                                           |
| `chartReady`             | `{ chart, instance, symbol, timeframe }`            | 布局里的一张图建好（包括重建），`chart` 是它在布局里的位置，`instance` 是它的 `Chart`；在这里给每张图加页面自己的标记或线                                  |
| `symbolChange`           | `{ chart, symbol }`                                 | 当前图显示的品种变了：用户选的、接口切换的，或者另一张图成为当前的图；`chart` 是当前图在布局里的位置                                                       |
| `watchlistStar`          | `{ symbol, starred }`                               | 用户在品种搜索里点了星标：`starred` 为 `true` 是要加进自选，`false` 是要移出；页面改了自己的列表再给 `watchlist`，见[「自选」](page-items.md)              |
| `timeframeChange`        | `{ chart, timeframe }`                              | 同上，周期                                                                                                                                                 |
| `chartTypeChange`        | `{ chart, chartType, settings }`                    | 同上，图表类型；改了当前类型的设置（比如逐笔 K 线的笔数）也发出。`settings` 是当前类型的设置，没有设置的类型是 `null`                                      |
| `indicatorsChange`       | `{ chart, indicators }`                             | 某张图的指标加了、删了、改了参数或线条、显示或隐藏了；`chart` 是它在布局里的位置                                                                           |
| `comparisonsChange`      | `{ chart, comparisons }`                            | 某张图的比较品种加了、删了、改了位置或样式、显示或隐藏了                                                                                                   |
| `drawingsChange`         | `{ chart, symbol, drawings }`                       | 某张图在某个品种上的画线变了（画线属于图）                                                                                                                 |
| `alertsChange`           | `{ symbol, alerts }`                                | 某个品种的提醒加了、改了、移动了、暂停或恢复了、删了                                                                                                       |
| `alertStatusChange`      | `{ symbol, id, status }`                            | 页面是否在盯一条提醒变了：开始盯、数据还在路上、暂停、过期、盯不了，见[「提醒」](alerts.md)                                                                |
| `alert`                  | 见下                                                | 提醒触发了                                                                                                                                                 |
| `layoutChange`           | `{ grid, active, links }`                           | 多图布局、当前的图、联动方式变了                                                                                                                           |
| `crosshairMove`          | `{ chart, symbol, time, price, paneId }`            | 指针在图上移动；离开时 `time`、`price`、`paneId` 为 `null`                                                                                                 |
| `visibleRangeChange`     | `{ chart, symbol, range }`                          | 图上显示的 K 线变了（拖动、缩放、加载）；`range` 是 `{ from, to }`，第一根和最后一根的时间                                                                 |
| `chartClick`             | `{ chart, symbol, time, price, paneId }`            | 点击图的绘图区                                                                                                                                             |
| `buttonClick`            | `{ id, item }`                                      | 点了页面自己的按钮；有菜单时 `item` 是选中的菜单项                                                                                                         |
| `drawingBarClick`        | `{ id, chart, symbol, drawing }`                    | 点了浮动条里页面自己的按钮（`drawingBarItems`），`drawing` 是选中的那条画线（带 `id`）                                                                     |
| `drawingToolChange`      | `{ active, magnet, continuous, hidden, favorites }` | 画线工具的状态变了：拿起或放下工具、磁铁、连续画、隐藏画线、收藏的工具                                                                                     |
| `drawingSelectionChange` | `{ selected }`                                      | 当前图上选中的画线换了、取消了，或者选中的那条变了；内容见[「自己做画线栏」](drawings.md)                                                                  |
| `drawingBoundsChange`    | `{ chart, id, bounds }`                             | 选中的画线在窗口里挪了位置；只在监听它时才量                                                                                                               |
| `contextMenuClick`       | `{ id, chart, symbol, time, price, order? }`        | 选了页面自己的右键菜单项                                                                                                                                   |
| `contextMenuClose`       | `{ chart, symbol, time, price, order? }`            | 有页面菜单项的右键菜单关上了，或换成了另一个菜单；参数和打开时给 `contextMenu` 的一样，比如用来收掉菜单开着时画的东西                                      |
| `dataError`              | `{ chart, symbol, request, interval, error }`       | 数据源出错：`request` 是 `symbol`（resolveSymbol）、`bars`（getBars）或 `history`（往左加载更早的 K 线）；`error` 是数据源抛出的错误，可以上报到自己的监控 |
| `storageError`           | `{ operation, error }`                              | 存储出错：`operation` 是 `load`（读不到，这次打开不再保存）或 `save`（没存上，下次变化再存）；默认的浏览器存储在空间满了、被禁用时也会报                   |

`alert` 的内容：`id`（哪条提醒）、`symbol`、`timeframe`（按哪个周期的 K 线判断）、`time`（触发时那根 K 线的时间）、`price`（那根 K 线的收盘价）、`subject`（比较的是什么，画线按类型写，画线删了也看得懂：`{ source, trigger, value }`）、`message`（用户写的消息）、`replay`（是不是回放历史时触发的）、`remote`（是不是在别处判断、经 `reportAlert()` 报过来的，见[「提醒」](alerts.md)）、`title` 和 `body`（按图表的语言写好的提醒文字，如「提醒」「BTC/USDT 上穿 68,000.00 · 看突破」，可以直接用来推送）。

`time` 都是毫秒时间戳；`price` 在主图上是价格，在副图上是指标的值。所有事件名在 `PRO_CHART_EVENTS` 里。从 `symbolChange` 到 `alertsChange` 这些报状态的事件，在一轮变化结束后才发出，只报结果：比如 `setState()` 换了品种、布局和指标，每样只报一次。

```ts
// 页面上自己的报价栏跟着十字线走。
chart.on('crosshairMove', ({ time, price }) => {
  quoteBar.show(time === null ? null : { time, price });
});

// 数据源出错时上报。
chart.on('dataError', ({ symbol, request, error }) => {
  monitor.capture(error, { symbol, request });
});
```
