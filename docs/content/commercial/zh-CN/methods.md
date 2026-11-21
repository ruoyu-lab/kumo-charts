# 接口

`createProChart()` 返回的对象（Vue、React 组件在 `created` 里交出同一个对象）：

| 成员                                                         | 说明                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chart`                                                      | 当前的图（`@kumo-charts/core` 的 `Chart`），顶栏和画线工具作用于它；准备好之前是 `null`                                                                                                                                      |
| `charts`                                                     | 多图布局里显示的每一张图，当前的图也在里面；容器窄时只显示当前的图                                                                                                                                                           |
| `setSymbol(id, target?)`                                     | 切换当前图的品种；品种联动时所有图一起切换。先用 `resolveSymbol` 找到品种，找不到时拒绝、不切换                                                                                                                              |
| `setTimeframe(timeframe, target?)`                           | 切换当前图的周期，必须是提供的周期之一                                                                                                                                                                                       |
| `setChartType(type, settings?, target?)`                     | 图表类型，见[「图表类型」](chart-types.md)；`settings` 是有设置的 K 线类型（如逐笔 K 线）的设置，如 `setChartType('tick', { count: 500 })`，没给的保持原样                                                                   |
| `applyOptions(options)`                                      | 显示后改选项，见上一节                                                                                                                                                                                                       |
| `addIndicator(type, input?, target?)`                        | 给当前图加一个指标，返回它的 id；`input`（`ProChartIndicatorInput`）可以给 `id`、`params`、`source`、`visible`、`lines`、`levels`、`autoscale`、`pane`（见下面）                                                             |
| `updateIndicator(id, patch, target?)`                        | 改一个指标：`params`、`lines` 按键合并，其他的替换                                                                                                                                                                           |
| `removeIndicator(id, target?)`                               | 删一个指标                                                                                                                                                                                                                   |
| `registerIndicator(indicator)`                               | 注册一个自己的指标，见[「自定义指标」](custom-indicators.md)                                                                                                                                                                 |
| `unregisterIndicator(type)`                                  | 撤下页面注册的指标：对话框不再列它，图上它的指标不画了但留在状态里，再注册又画出来                                                                                                                                           |
| `registerDrawing(drawing)`                                   | 注册一个自己的画线工具，见[「自定义画线工具」](custom-drawings.md)                                                                                                                                                           |
| `unregisterDrawing(type)`                                    | 撤下页面注册的画线工具：画线栏不再有它，图上这种线不画了但留在状态里，再注册又画出来                                                                                                                                         |
| `addComparison(symbol, input?, target?)`                     | 在当前图上比较一个品种，返回它的 id；`input`（`ProChartComparisonInput`）可以给 `id`、`placement`（`percent` 默认、`scale`、`pane`）、`style`、`color`、`width`、`visible`，见[「比较品种」](compare.md)                     |
| `updateComparison(id, patch, target?)`                       | 改一个比较品种：给出的设置替换，其余不变                                                                                                                                                                                     |
| `removeComparison(id, target?)`                              | 去掉一个比较品种                                                                                                                                                                                                             |
| `getAlerts(symbol?)`                                         | 所有品种（或一个品种）的提醒，每条带 `symbol` 和 `status`（页面是否在盯），见[「提醒」](alerts.md)                                                                                                                           |
| `addAlert(alert, symbol?)`                                   | 给一个品种加提醒，返回它的 id；不写品种是当前图的品种                                                                                                                                                                        |
| `updateAlert(id, patch)`、`removeAlert(id)`                  | 改一个提醒（`ProChartAlertPatch`：给出的设置替换，其余不变）、删一个提醒                                                                                                                                                     |
| `setRemoteAlerts(statuses)`                                  | 提醒交给别处判断（如你的服务端，页面关了也照常提醒）：页面不再盯，显示给的状态；`null` 交回页面（见[「提醒」](alerts.md)）                                                                                                   |
| `reportAlert(id, { time, price })`                           | 别处判断的提醒触发了：和页面自己触发的一样弹出消息、响声，发 `alert` 事件（`remote: true`）                                                                                                                                  |
| `describeAlert(id)`                                          | 提醒触发时页面说的标题和正文（`{ title, body }`，图表当前的语言）：别处发通知时说一样的话                                                                                                                                    |
| `setLayout(grid)`                                            | 多图布局：`single`、`columns`（左右）、`rows`（上下）、`three`（左一大右两小）、`three-right`（左两小右一大）、`four`，`six-wide`（两行三列）、`six-tall`（三行两列）、`six-left`（左一大右五小）、`six-top`（上一大下五小） |
| `setLinks({ symbol, timeframe, crosshair, time, drawings })` | 其他图是否跟着当前图切换品种、切换周期、移动十字线、对齐时间、共用画线（开：同品种的图共用一份画线；关：各画各的），只改给出的                                                                                               |
| `setActiveChart(index)`                                      | 让布局里第 `index` 张图（从 0 起）成为当前的图                                                                                                                                                                               |
| `setFavoriteTimeframes(timeframes)`                          | 顶栏上直接显示的周期，其余的在周期菜单里                                                                                                                                                                                     |
| `setFavoriteChartTypes(types)`                               | 顶栏上图表类型按钮旁边显示的图表类型，和菜单里点亮星标一样                                                                                                                                                                   |
| `setFavoriteDrawingTools(types)`                             | 常用画线栏里的画线工具，和工具列表里点亮星标一样；空的就不显示这条栏                                                                                                                                                         |
| `setAlertSound(sound)`                                       | 提醒响铃的总开关和音量：`{ on?, volume? }`，`volume` 从 0 到 1，没给的不变                                                                                                                                                   |
| `startReplay(time?, target?)`、`stopReplay(target?)`         | 从 `time` 那根 K 线开始回放，同品种的图一起；不给 `time` 时和点回放按钮一样，由用户在图上选起点                                                                                                                              |
| `openDialog(dialog)`、`closeDialog()`                        | 打开品种搜索（`symbolSearch`）、比较品种（`compare`）、指标（`indicators`）、图表设置（`chartSettings`）、导出图表数据（`exportData`）、快捷键列表（`shortcuts`）窗口                                                        |
| `notify(text)`                                               | 在图表上方显示一条提示，用户可以关掉                                                                                                                                                                                         |
| `getChartView(target?)`                                      | 一张图显示的内容，和状态里存的一样：品种、周期、图表类型和各 K 线类型的设置、指标、比较品种、价格轴、最新价，以及用户拖过的窗格高度（`paneHeights`）                                                                         |
| `getLayout()`                                                | 布局：`grid`（几张图）、`active`（当前的图）、`links`（其他图跟着当前图的什么）                                                                                                                                              |
| `getState()`                                                 | 整个状态（`ChartState`），和存到 `storage` 的一样，见[「保存到自己的服务器」](storage.md)                                                                                                                                    |
| `setState(state)`                                            | 显示一个 `getState()` 给出的状态：图表按它重建                                                                                                                                                                               |
| `getDrawings(target?)`                                       | 一张图在一个品种上的画线，`target` 是 `{ chart?, symbol? }`，不给时是当前图和它的品种；画线属于图，没显示的品种也存着                                                                                                        |
| `addDrawing(drawing, symbol?)`                               | 给一个品种加一条画线，返回它的 id，见下面的「用接口画线」                                                                                                                                                                    |
| `updateDrawing(id, patch, symbol?)`                          | 改一条画线：`points`、`text`、`timeframes` 等整个替换，`style` 按字段合并                                                                                                                                                    |
| `removeDrawing(id, symbol?)`                                 | 删一条画线，画线上的提醒一起删掉                                                                                                                                                                                             |
| `on(event, listener)`                                        | 监听事件，返回取消监听的函数                                                                                                                                                                                                 |
| `destroy()`                                                  | 从页面移除图表，停止行情订阅；还在排队的调用随之拒绝                                                                                                                                                                         |

除了 `chart`、`charts`、`on` 和 `destroy`，方法都返回 Promise：

- **准备好之前调用的会排队**，准备好后按调用顺序执行，所以创建完马上调用也没问题。不需要结果时直接调用就行。`destroy()` 时还在排队的调用，和之后的调用一样被拒绝：`The pro chart was destroyed: create another one.`
- **用错了 Promise 会被拒绝**，错误信息说明哪里不对、可以写什么，比如 `There is no indicator "RSII": the types are MA, EMA, …`、`The timeframe "7m" is not offered: the timeframes are 1m, 5m, …`。指标的参数、数据源和参考线按图表库的 `checkIndicatorInput()` 检查（成交量分布也一样），错误信息和图表库的 `chart.indicators.add()` 相同，比如 `params.period must be at least 1, received 0.`。设置里写错的字段（比如 `param`）也会拒绝，不会悄悄不起作用。
- 方法默认作用于当前的图（顶栏高亮的那张）。带 `target` 的方法可以操作布局里的另一张图，不改变当前的图：`{ chart: 1 }` 是第二张（从 0 起），比如 `addIndicator('RSI', {}, { chart: 1 })`。

```ts
const id = await chart.addIndicator('RSI', { params: { period: 6 } });
await chart.updateIndicator(id, { lines: { rsi: { color: '#f59e0b', width: 2 } } });
chart.setLayout('columns');
chart.startReplay(Date.UTC(2026, 0, 5)); // 从 2026-01-05 那根 K 线开始回放
```

指标画在哪个窗格由 `pane` 决定：`null`（默认）按指标类型，主图指标画在 K 线上、其他的单独一个窗格，成交量在 K 线下方；`'main'` 画在 K 线上（本来单独一个窗格的指标在 K 线上用自己的刻度，不会把 K 线压扁）；`'new'` 单独一个窗格；也可以写图上排在它前面的另一个指标的 id，和那个指标共用窗格。被共用的指标删掉后，按指标类型画。用户拖动窗格边界改的高度会存在状态里，下次打开还是那么高。

```ts
const rsi = await chart.addIndicator('RSI');
await chart.addIndicator('KDJ', { pane: rsi }); // 和 RSI 画在同一个窗格
await chart.updateIndicator('vol-1', { pane: 'new' }); // 成交量单独一个窗格
```

用户在界面上也能挪：指针移到指标在图例里的那一行，最后的「⋯」按钮打开菜单，「移到」里有「K 线上」（已经在 K 线上时没有）、「新窗格」（已经独占一个窗格时没有），以及其他窗格里的每个指标，按图例里的名字写成「与 MACD 12 26 9 同一窗格」。挪进排在它后面的指标的窗格时，它在图上的顺序跟着挪到那个指标后面，不用管先后。原来和它同一窗格的指标留在原窗格，位置和用户拖过的高度都不变：它排在窗格第一时，留下的指标在图上的顺序挪到它前面，窗格改按留下的第一个指标记（`paneHeights` 里的高度跟着换过去）；挪到新窗格的总在最下面新开一个。挪的结果和用 `updateIndicator()` 改 `pane` 一样存在状态里，窗格高度照旧记得。成交量分布画在 K 线上、不占窗格，没有这个菜单。

`chart` 和 `charts` 是图表库的 `Chart`，可以直接用它的接口（坐标换算、截图、标记等）。指标和画线要通过上面的方法改：直接在 `chart` 上加的指标，专业图表不知道，下次同步时会被去掉。

图会重建：切换多图布局、`setState()`、容器变窄只显示当前图时，原来的 `Chart` 换成新的。页面要在每张图上放自己的标记或线，就监听 `chartReady`，它在每张图建好时发出（包括第一张），带图在布局里的位置、新的 `Chart` 和它显示的品种、周期：

```ts
chart.on('chartReady', ({ instance, symbol }) => {
  instance.markers.set(myTrades(symbol)); // 页面自己的成交标记
});
```

一张图换品种、换周期时 `Chart` 不变，跟着 `symbolChange`、`timeframeChange` 更新自己画的东西。换品种、换周期、换 K 线类型时图停在原来的时间和缩放：原本看着最新的 K 线，新的最新 K 线出现在原来的位置（右边留的空白不变）；原本在往回看历史，右边缘的时间不变，新数据不够早时先往前加载历史再回到那个时间。

## 用接口画线

**画线属于图**：每张图（每个标签）的画线按画的时候图显示的品种分着存在这张图的状态里（`ChartView.drawings`）；这张图换品种再换回来，原来的画线还在。一个布局里的几张图，默认共用画线（`links.drawings` 开着，顶栏布局菜单里的「同步画线」）：显示同一个品种的图共用一份，存在布局第一张图的状态里，从哪张图画、改、撤销重做都一样；显示别的品种的图用那个品种自己的。关掉「同步画线」，每张图各画各的：关的时候每张图拿到一份当时的画线，开的时候各图的画线合到第一张图里（同 id 算一条）。新开一张图时，把原来那张图的状态复制一份（带着它的画线），之后各画各的。提醒仍按品种保存，它盯的画线从各图里找（同一条画线复制出来的几张图 id 相同，算一条）。

`addDrawing()` 等方法的 `target` 是 `{ chart?, symbol? }`，`chart` 是图在布局里的位置，`symbol` 是品种，都不给时是当前图和它显示的品种：

- 这张图正显示这个品种时，在这张图上改，和用户画的一样，可以撤销；
- 否则按图表的规则检查后存在这张图里，等它显示这个品种时出现。

画线的格式和图表库的 `chart.drawings.add()` 一样（`type`、`points`、`style`、`text`、`timeframes` 等，见图表库的画线文档），不给 `id` 时自动生成。坐标按给的时间和价格精确设置，不吸附。

```ts
const id = await chart.addDrawing({
  type: 'horizontal-line',
  points: [{ time: Date.UTC(2026, 0, 5), price: 1688 }],
  style: { color: '#e5484d', lineStyle: 'dashed' },
  text: '压力位'
});
await chart.updateDrawing(id, { style: { extendRight: true } });
await chart.addDrawing({ type: 'rectangle', points: [/* … */] }, { chart: 1, symbol: '000001.SZ' }); // 第二张图、别的品种
```

每次变化（用户画的、改的，或者接口改的）都会发出 `drawingsChange`，带这张图和这个品种的全部画线。
