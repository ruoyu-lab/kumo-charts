# 接入行情

实现 4 个方法就能接上任何行情服务器：

```ts
import type { Datafeed } from '@kumo-charts/pro-chart';

const myDatafeed: Datafeed = {
  // 服务器能给的 K 线周期。其他周期由图表合成：5m、15m 由 1m 合成，1W、1M 由 1D 合成。
  intervals: ['1m', '1D'],

  // 不认识的品种、或者暂时取不到时都要拒绝。拒绝时图表保留这个品种，显示加载失败、可以重试，不会换成别的品种。
  resolveSymbol: (id) => api.symbol(id),

  // 按时间从早到晚；before 有值时取它之前的 K 线（用户往左拖时加载更早的数据），返回空数组表示没有更早的了。
  getBars: ({ symbol, interval, limit, before }) => api.klines(symbol, interval, limit, before),

  // 实时数据：有逐笔成交就给 trades，只有 K 线就给 bars（正在形成的那根变化时再给一次）。
  // 成交带上主动方 side（'buy' 吃卖单、'sell' 吃买单），成交量轨迹和订单流指标才能用。
  subscribe(symbol, interval, listener) {
    const socket = api.stream(symbol, (message) => listener.trades(message.trades));
    return () => socket.close();
  },

  // 可选：过去的成交，按分钟给（见下面的「过去的成交」），成交量轨迹、订单流指标和大单用它补出图打开以前的 K 线；
  // 没有它就没有订单流指标。
  getTradeMinutes: ({ symbol, from, to, parts, signal }) =>
    api.tradeMinutes(symbol, from, to, parts, signal), // { covered, tickSize, minutes }

  // 可选：订单簿，订单簿热力图要用。大约每秒推一次快照，每档 [价格, 数量]；刚订阅时可以先推最近一段的几张。
  subscribeBook(symbol, listener) {
    const socket = api.depth(symbol, (book) => listener([book])); // [{ time, bids: [[价格, 数量]], asks }]
    return () => socket.close();
  },

  // 可选：顶栏的品种搜索要用。type 是市场分类，exchange 是平台名，用户选了才有。
  searchSymbols: (query, type, exchange) => api.search(query, type, exchange), // [{ id: '600519.SH', name: '贵州茅台', description: '上交所' }]

  // 可选：品种所在的平台。有两个以上时，搜索窗口左边列出平台，可以只搜其中一个。
  exchanges: [{ name: '上交所', logo: '/icons/sse.svg' }, { name: '深交所' }]
};
```

- **周期**：`intervals` 是数据源有的 K 线周期，别的周期由图表从里面合成（`15m` 从 `1m`、`4h` 从 `1h`）。行情来源要等用户打开才有的页面（比如插件打开时才加进来），`intervals` 可以先给空的：这时页面给的周期全都显示，存过的周期也不改回默认，等品种自己说了周期（`SymbolInfo.intervals`）再按它来。
- **品种搜索**：数据源有 `searchSymbols` 时顶栏才有搜索；没有时品种由页面用 `setSymbol()` 切换。`features.symbolSearch` 设为 `true` 而数据源没有 `searchSymbols` 会报错。
- **品种信息** `SymbolInfo`：`id`、`name` 必填，`name` 是顶栏和列表里显示的名字，带斜杠的（`BTC/USDT`）斜杠后面的计价货币显示得淡一些；`market` 是怎么交易的（`spot` 现货、`perpetual` 永续合约），名字后面显示一个小标签（现货、永续），`inverse: true` 的合约用交易的那个币做保证金和结算（币本位），标签写币本位，不给 `market` 就没有标签；`description` 是搜索结果里的第二行（可以按语言给 `{ en, zh, ja, ko }`，`en` 必填，没给的语言显示 `en`）；`type` 是市场分类（`forex`、`metal`、`energy`、`crypto`、`stock`、`etf`、`other`），搜索按它筛选；`exchange` 是所在平台，搜全部平台时结果里显示平台的名字和图标（图标是数据源 `exchanges` 里同名平台的 `logo`）；`logos` 是图标，每个资产一项（外汇这样的一对给两项，基础货币在上），每项是一个地址或依次尝试的几个；没有图标或都加载失败时显示名称的首字母；`pricePrecision` 是价格小数位，不给就从 K 线里读；`tickSize` 是最小价格变动（如 `0.1`），成交量轨迹和时间价格机会的「每行 tick 数」按它算，不给时按小数位的最后一位；`intervals` 是这个品种自己的 K 线周期，和数据源的不同时给；`calendar` 是交易日历，周期合成按它切分，比如 A 股：

  ```ts
  { timeZone: 'Asia/Shanghai', sessions: ['09:30-11:30', '13:00-15:00'], weekdays: [1, 2, 3, 4, 5] }
  ```

  不给时按全天 24 小时、UTC 时区，和加密货币交易所一致。

- **过去的成交** `getTradeMinutes(request)`：给了才有订单流指标（VD、CVD、UDV）和按主动买卖拆分的成交量分布，成交量轨迹和大单才有图打开以前的。订单流用到的每一分钟只是这几样，所以按分钟要、按分钟给，不要逐笔成交：
  - 请求 `{ symbol, from, to, parts, signal }`：`[from, to)` 的每一分钟，`from`、`to` 都是整分钟（60000 的倍数），`to` 最晚到几秒前走完的那一分钟（走完 5 秒以后才要，平台晚一点才发布成交）。`parts` 是总量以外还要什么：`'levels'`（每个价位的量，成交量轨迹和按主动买卖拆分的成交量分布用）、`'large'`（成交额最大的几笔，大单用）；只要总量时是空的（VD、CVD、UDV 只要总量）。只要总量的一次最多 3 天（30 天的 CVD 在日线上是 10 个请求），带 `levels` 或 `large` 的一次最多 6 小时；最新的先要，最多两个请求同时在路上。图不再需要时 `signal` 中止。
  - 回答 `{ covered, tickSize, minutes }`：`minutes` 是 `covered` 里有成交的分钟，旧的在前，没有成交的分钟不写；每一分钟 `{ time, buy, sell, count, levels?, large? }`：`time` 是这一分钟的开始；`buy`、`sell` 是主动买入、主动卖出的量（基础资产，和成交的数量一样）；`count` 是成交笔数；要了 `levels` 时 `levels` 是 `[价格, 买入量, 卖出量, 价格, …]`，价格从低到高、每个价格一次、在 `tickSize` 的网格上；要了 `large` 时 `large` 是这一分钟成交额（价格 × 数量）最大的最多 32 笔 `[时间, 价格, 数量, 方向, …]`，方向 `1` 是主动买入、`-1` 是主动卖出，大的在前，一样大的早的在前，一分钟不到 32 笔时全给。
  - `covered` 是 `[from, to)` 里成交是全的几段 `[[开始, 结束], …]`：全都有时是 `[[from, to]]`，一分钟也没有时是 `[]`；平台（或你的服务器）在某一段时间没有成交、没有收全（那时没在收、断过线、已经不留了）时，把它前后的分成几段，旧的在前。整个落在某一段里的分钟才算全的，其中没写的分钟算没有成交；不在任何一段里的分钟算「无成交数据」，以后也不再问。**一分钟只有它的每一笔成交都在时才能放进 `covered`**，否则图上会画出错的数；中间断过的那几分钟不放进去，前后全的照样放，只有断了的那几根 K 线写「无成交数据」。
  - `tickSize` 是 `levels` 的价格按多大的步长：品种的最小价格变动，或者 `0`（原样的价格）。图表把每个价位放到品种的 `tickSize` 上（落在同一格的加在一起），所以要和品种的一样细或更细。
  - 取不到时返回的 Promise 拒绝：图表 5 秒后再问，每次等加倍，最多 80 秒，这期间那些 K 线写「加载失败」。暂时给不了、知道什么时候能给时（比如你的服务器还在从逐笔成交算这些分钟），拒绝的错误带上 `retryAfter`（毫秒）：这不算失败，那些 K 线写「加载中」，图表到时候再问同一段，等多久不加长，绝不当作没有成交。
  - 手上是逐笔成交的，用 `tradeMinutes(trades, tickSize, parts)` 合成分钟（成交带 `side`），和图表从推送的成交里自己存的完全一样：

    ```ts
    import { tradeMinutes } from '@kumo-charts/pro-chart';

    getTradeMinutes: async ({ symbol, from, to, parts, signal }) => {
      const trades = await api.trades(symbol, from, to, signal); // [{ time, price, size, side }]
      return { covered: [[from, to]], tickSize: 0.1, minutes: tradeMinutes(trades, 0.1, parts) };
    };
    ```

- **订单簿** `subscribeBook(symbol, listener)`：给了才有订单簿热力图（指标窗口「订单流」组的 BOOKHEATMAP）。`listener` 收到一组快照 `{ time, bids, asks }`：`time` 是毫秒，`bids`、`asks` 是 `[价格, 数量]` 的档（数量按基础资产，顺序随意）。一边的深度到给的最深一档为止，数量是 0 的档表示那里没有挂单、到那里都知道；只给有挂单的档时，最深一档以外当作不知道，不画。图表按秒存（一秒里有几张只留最后一张），同一个品种的几张图共用一份订单簿和一个订阅，最后一张热力图关掉时退订。交易所不提供过去的订单簿，所以热力图从订阅开始才有；刚订阅时先推服务器留着的最近一段（比如最近 2 分钟），页面刷新以后就不是空的。
- 图表订阅当前显示的品种和周期，切换时会退订旧的；有提醒的品种也订阅，见[「提醒」](alerts.md)。同一个品种和周期只订阅一次，图和提醒共用。
- 图表先订阅、再请求最新的 K 线（所以 `subscribe()` 在 `getBars()` 之前调用）：K 线还在路上时推来的成交和 K 线先存着，K 线到了以后按收到的顺序接上，正在走的那根不缺成交，这期间走完的那根也是最终值。只推成交的数据源分不出哪几笔已经算在返回的最后一根里，这段时间里的几笔成交量可能多算一次。

专业图表不附带交易所或别的平台的数据源：嵌入的页面都有自己的行情，照上面的接口接上就行。
