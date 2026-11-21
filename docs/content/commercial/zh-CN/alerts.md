# 提醒

提醒按品种保存。每条提醒比较两样东西：盯的值（`source`：价格，或某个指标的某条线）和比较的对象（`value`：一个数值、某条画线的某条线，或某个指标的某条线），条件（`trigger`）和图表库的提醒一样：`cross`（穿过）、`cross-up`（上穿）、`cross-down`（下穿）、`above`（高于）、`below`（低于），以及通道条件 `enter-channel`（进入通道）、`exit-channel`（退出通道）、`inside-channel`（通道内）、`outside-channel`（通道外）：通道条件比较的是两条边界之间的通道，`value` 写成两条边界 `[a, b]`（顺序不限，每根 K 线上取低的那条做下沿、高的做上沿）；进入是向上穿过下沿或向下穿过上沿，退出反过来，通道内、通道外看的是这一次判断时在不在两条边界之间。常见的写法：

- 价格上穿 68000：`{ trigger: 'cross-up', value: 68000 }`
- 价格穿过一条趋势线、矩形的下沿：`{ trigger: 'cross', value: { kind: 'drawing', id, level: 'bottom' } }`（`level` 是画线的线，不写是第一条；线按画出来的样子判断：延长了就判断延长的部分，斐波那契隐藏的档位不能盯）
- 价格离开一个矩形（从上沿或下沿出去）：`{ trigger: 'exit-channel', value: [{ kind: 'drawing', id, level: 'top' }, { kind: 'drawing', id, level: 'bottom' }] }`，在矩形上叫「离开矩形」（矩形上的四个通道条件叫进入矩形、离开矩形、矩形内部、矩形外部）；平行通道是 `base` 和 `parallel`，斐波那契是两档，如 `'0.382'` 和 `'0.618'`，价格区间也有 `top` 和 `bottom`
- 价格进入 100,000 到 105,000 的价格通道：`{ trigger: 'enter-channel', value: [105000, 100000] }`；RSI 在 30 到 70 之间：`{ source: { kind: 'indicator', type: 'RSI', key: 'rsi' }, trigger: 'inside-channel', value: [70, 30] }`。边界也可以是指标的线，如布林带的上轨和下轨
- 价格跌破头肩形态的颈线、穿过锚定 VWAP 或回归趋势的上沿：`level` 分别是 `'neckline'`、`'vwap'`、`'2'`（在某个比例或标准差上的线，名字就是图上标签写的那个数：回归趋势的线叫 `'2'`、`'-2'` 和基准线 `'0'`，外侧两条在前，所以「进入/离开通道」默认就是整个回归通道；锚定 VWAP 的通道带叫 `'1'`、`'-1'`；速度阻力扇时间档的射线叫 `'time-0.382'` 这样）
- RSI 高于 70：`{ source: { kind: 'indicator', type: 'RSI', key: 'rsi' }, trigger: 'above', value: 70 }`
- MACD 金叉：`{ source: { kind: 'indicator', type: 'MACD', key: 'macd' }, trigger: 'cross-up', value: { kind: 'indicator', type: 'MACD', key: 'signalLine' } }`
- 价格上穿 20 日均线：`{ trigger: 'cross-up', value: { kind: 'indicator', type: 'MA', params: { periods: [20] }, key: 'ma20' } }`

指标按提醒自己记下的类型、参数（`params`）和价格（`source`）计算，和图上有没有这个指标、参数后来改没改无关。其他设置：`timeframe`（按哪个周期的 K 线判断，不写是当前图的周期）、`frequency`（`once` 仅一次，触发后自动暂停；`once-per-bar` 每根 K 线最多一次；`every-time` 每次满足）、`onClose`（`true` 只按收盘的 K 线判断，每根 K 线收盘时最多一次，`once` 照样触发后暂停；默认 `false`，K 线没走完也算）、`expires`（到期时间，毫秒时间戳，`null` 永不过期）、`message`（用户写的消息，触发时附在提醒文字后面）、`sound`（触发时响一声，默认开）、`enabled`（开着，默认是）。所有提醒怎么响在状态的 `alertSound` 里：`on` 关掉时哪条都不响，`volume` 是音量，从 0 到 1（默认开、1），接口是 `setAlertSound({ on?, volume? })`。图表里没有这两项的界面，由页面放在自己的设置里。

```ts
const id = await chart.addAlert(
  {
    trigger: 'cross-up',
    value: 70000,
    frequency: 'once-per-bar',
    message: '突破前高'
  },
  'BTCUSDT'
);
await chart.updateAlert(id, { expires: Date.now() + 7 * 86_400_000 });
const watched = (await chart.getAlerts()).filter((alert) => alert.status === 'watching');
```

**页面开着时盯着每个品种。** 每个有提醒（开着、没过期）的品种和周期，后台都有一个看不见的图表按提醒的周期加载 K 线、接实时数据、算指标和画线的位置，和一张显示这个品种和周期的图判断得一模一样；行情订阅和显示这个品种的图共用，只订阅有提醒的品种，暂停、删掉、过期以后就退订。一条提醒只由后台判断一次，图上同时显示这个品种也不会报两次；图只画提醒线（比一个数的一条，两个数的通道两条；指标的提醒画在这个指标的副图里，图上有算法一样的这个指标时），回放历史时按回放的 K 线触发（`replay: true`）。提醒线可以拖，通道的两条各拖各的。页面关了就不再盯。

**页面关了也提醒：交给服务端。** 服务端用开源图表库的 `createAlertEngine()`（不画图的判断器，判断、指标、画线的代码和图表是同一份）按同样的 K 线、指标、画线判断，判断得和页面一模一样。页面这边：`setRemoteAlerts(statuses)` 把提醒交给它，`statuses` 是每条提醒在那边的状态（如 `{ a1: 'watching', a2: 'failed' }`），页面不再盯任何提醒、显示这些状态（没给的显示 `loading`：还在交过去的路上），提醒窗口底下写「页面关了也会监控」，再调一次换掉状态，`null` 交回页面；那边触发了，`reportAlert(id, { time, price })`（那根 K 线的时间、收盘价）让页面和自己触发的一样弹出消息、响声、发 `alert` 事件（`remote: true`），仅一次的提醒由那边暂停，页面不改它；`describeAlert(id)` 给页面触发时说的标题和正文，交给服务端发推送时说一样的话。

**交给服务端什么：`alertSpec()`。** 服务端不开页面，要知道一条提醒怎么判断：按哪个周期的 K 线、合成成什么周期、用什么交易日历、读哪些指标、盯哪些画线。`alertSpec(alert, symbol, drawings, intervals)` 把页面上的一条提醒（`ProChartAlert`）、它的品种（`SymbolInfo`）、这个品种的画线（开源图表库的 `DrawingInput`）和数据源的周期（`datafeed.intervals`，品种没写自己的周期时用）换成这份规格（`AlertSpec`）：`symbol`、`interval`（K 线按它取）、`timeframe`（合成的周期，和 `interval` 一样时是 `null`）、`calendar`、`indicators`、`drawings` 和 `alert`（开源图表库的 `createAlertEngine()` 直接收的提醒）。同一个品种、同一批 K 线的提醒共用一个判断器，设置相同的指标共用一个 id，所以服务端不用重复算。算不了的返回 `null`：这个品种没有能合成这个周期的 K 线，或者提醒读的是只有页面自己才有的指标（自定义指标）。提醒里提到的画线或线不在 `drawings` 里时，交给判断器以后它会报这个提醒盯不了（`failed`）。

```ts
import { alertSpec } from '@kumo-charts/pro-chart';

// alert 是 getAlerts() 给的一条提醒，'BTCUSDT' 是它所在的品种，drawings 是这个品种的画线。
const symbol = await datafeed.resolveSymbol('BTCUSDT');
const spec = alertSpec(alert, symbol, drawings, datafeed.intervals);

if (spec) {
  // 这份规格是 JSON，可以交给服务端存起来，那边照它取 K 线、建判断器。
  await fetch('/my-alerts', { method: 'PUT', body: JSON.stringify(spec) });
}
```

`status` 说明页面是否在盯：`watching`（在盯实时数据）、`loading`（数据还在路上）、`paused`（暂停了，或仅一次的提醒已经触发）、`expired`（过期了）、`failed`（盯不了：品种或 K 线拿不到，或提醒的画线、指标没有了；数据源失败时会过一会儿重试）。变化时发出 `alertStatusChange`。

用户这边：右键菜单的「在这个价格添加提醒」一点就加上（穿过、仅一次）；「添加提醒…」、价格轴上的「添加提醒…」、Alt+A、画线右键菜单的「添加提醒…」、指标图例上的铃铛都打开提醒窗口，填好对应的价格、画线或指标；双击提醒线或右键「编辑提醒…」改已有的提醒。窗口最上面是一句话总结（如「当 价格 上穿 66,121.50 时提醒，按 15分 K 线实时判断，只提醒一次。」，跟着设置变），下面分三组。条件：监控（价格、指标、画线）、指标和指标线或画线和线（通道条件是「通道」的两条线，画线只有两条线时不用选；斐波那契回撤默认 0.382 和 0.618 两档）、方式（价格、指标和有两条线以上的画线都有进入通道、退出通道、通道内、通道外，矩形上叫进入矩形、离开矩形、矩形内部、矩形外部）、价格或对比（数值，下面写着现价；价格可以对比主图上的指标线，指标可以对比它的另一条线；通道条件是「上限」「下限」两行，各是一个数或一条指标线，价格默认上下各 1%，指标默认它最高和最低的参考线，如 RSI 的 80 和 20）、周期（每个周期分「实时」和「收盘」，即 `onClose`）。触发：提醒几次（一次、每根 K 线一次、每次）、有效期（一直有效、24 小时、7 天、30 天、到指定时间…，指定时间按图上选的时区填）。通知：声音、附言。最下面写着「页面开着时才会监控」。窗口里没有暂停，暂停和恢复在页面自己的提醒列表里用 `updateAlert(id, { enabled })`。`features: { alerts: false }` 去掉这些入口，图上也不画提醒线、页面不再监控（回放里也不触发）；提醒本身照样存着，接口照常可用，再打开就都回来。
