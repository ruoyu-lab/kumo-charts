# Market data

Four methods connect any market data server:

```ts
import type { Datafeed } from '@kumo-charts/pro-chart';

const myDatafeed: Datafeed = {
  // The bar timeframes the server gives. The chart builds the others: 5m and 15m from 1m, 1W and 1M from 1D.
  intervals: ['1m', '1D'],

  // Reject a symbol you do not know, or one you cannot get for now. On a rejection the chart keeps the symbol, shows that loading failed with a retry, and never switches to another symbol.
  resolveSymbol: (id) => api.symbol(id),

  // From earliest to latest; with a before, the bars before it (loading earlier data as the user drags to the left), and an empty array when there is nothing earlier.
  getBars: ({ symbol, interval, limit, before }) => api.klines(symbol, interval, limit, before),

  // Real-time data: trades when you have them, bars when you have only bars (again each time the bar in progress changes).
  // Trades with the aggressor's side ('buy' taking an ask, 'sell' taking a bid) let footprints and the order flow indicators work.
  subscribe(symbol, interval, listener) {
    const socket = api.stream(symbol, (message) => listener.trades(message.trades));
    return () => socket.close();
  },

  // Optional: past trades, by the minute (see "Past trades" below), with which footprints, the order flow indicators and large trades fill in the bars from before the chart opened;
  // without it there are no order flow indicators.
  getTradeMinutes: ({ symbol, from, to, parts, signal }) =>
    api.tradeMinutes(symbol, from, to, parts, signal), // { covered, tickSize, minutes }

  // Optional: the order book, for the order book heatmap. A snapshot about every second, each level as [price, size]; just after subscribing, a few from the latest stretch can come first.
  subscribeBook(symbol, listener) {
    const socket = api.depth(symbol, (book) => listener([book])); // [{ time, bids: [[price, size]], asks }]
    return () => socket.close();
  },

  // Optional: for the symbol search of the top bar. type is the market category and exchange the name of a platform, there only when the user picked them.
  searchSymbols: (query, type, exchange) => api.search(query, type, exchange), // [{ id: '600519.SH', name: 'Kweichow Moutai', description: 'Shanghai Stock Exchange' }]

  // Optional: the platforms of the symbols. With two or more, the search window lists them on its left, to search one of them only.
  exchanges: [{ name: 'SSE', logo: '/icons/sse.svg' }, { name: 'SZSE' }]
};
```

- **Timeframes**: `intervals` are the bar timeframes the datafeed has, and the chart builds the other timeframes from them (`15m` from `1m`, `4h` from `1h`). For a page whose source of market data comes only once the user opens it (added when a plugin opens, say), `intervals` can be empty at first: every timeframe the page gives is shown meanwhile, and a timeframe that was saved is not turned back to the default, until the symbol states its own timeframes (`SymbolInfo.intervals`) and they are followed.
- **Symbol search**: the top bar has a search only when the datafeed has `searchSymbols`; without it, the page switches symbols with `setSymbol()`. Setting `features.symbolSearch` to `true` when the datafeed has no `searchSymbols` is an error.
- **Symbol info** `SymbolInfo`: `id` and `name` are required. `name` is the name shown in the top bar and in lists; in one with a slash (`BTC/USDT`), the quote currency after the slash is shown fainter. `market` is how it trades (`spot`, `perpetual` for perpetual contracts), shown as a small tag after the name (Spot, Perpetual); a contract with `inverse: true` is margined and settled in the coin traded (coin-margined), and its tag says Coin-margined; without `market` there is no tag. `description` is the second line in the search results (it can be given per language as `{ en, zh, ja, ko }`, with `en` required and shown for the languages not given). `type` is the market category (`forex`, `metal`, `energy`, `crypto`, `stock`, `etf`, `other`), by which the search filters. `exchange` is the platform it is on; searching every platform shows the platform's name and icon in the results (the icon is the `logo` of the platform with that name in the datafeed's `exchanges`). `logos` are its icons, one for each asset (two for a pair such as forex, the base currency on top), each an address or several tried in turn; without icons, or when none loads, the first letter of the name is shown. `pricePrecision` is the number of decimals of prices, read from the bars when it is not given. `tickSize` is the smallest price change (as `0.1`), by which the "ticks per row" of footprints and of time price opportunity are counted; without it, the last decimal place is used. `intervals` are the symbol's own bar timeframes, given when they differ from the datafeed's. `calendar` is the trading calendar, by which timeframes are built, as for China A-shares:

  ```ts
  { timeZone: 'Asia/Shanghai', sessions: ['09:30-11:30', '13:00-15:00'], weekdays: [1, 2, 3, 4, 5] }
  ```

  Without it, trading is taken as 24 hours a day in UTC, as on cryptocurrency exchanges.

- **Past trades** `getTradeMinutes(request)`: given, it brings the order flow indicators (VD, CVD, UDV) and volume profiles split by the aggressor side, and footprints and large trades for the time before the chart opened. These few things are all that order flow needs of each minute, so they are asked for and given by the minute, rather than as trades one by one:
  - The request `{ symbol, from, to, parts, signal }`: every minute of `[from, to)`, with `from` and `to` on whole minutes (multiples of 60000), and `to` at the latest the minute that ended a few seconds ago (asked 5 seconds after it ends, since platforms publish trades a little late). `parts` is what is wanted besides the totals: `'levels'` (the volume at each price, for footprints and volume profiles split by the aggressor side) and `'large'` (the largest trades by value, for large trades); it is empty when only the totals are wanted (VD, CVD and UDV want only the totals). A request for totals only covers at most 3 days (a 30-day CVD on the daily timeframe is 10 requests), and one with `levels` or `large` at most 6 hours; the latest are asked for first, with at most two requests on the way at once. `signal` aborts when the chart no longer needs them.
  - The answer `{ covered, tickSize, minutes }`: `minutes` are the minutes in `covered` with trades, oldest first, leaving out the minutes without trades. Each minute is `{ time, buy, sell, count, levels?, large? }`: `time` is the start of the minute; `buy` and `sell` are the volumes bought and sold by aggressors (in the base asset, as the size of trades); `count` is the number of trades; when `levels` were asked for, `levels` is `[price, bought, sold, price, …]`, prices from low to high, each price once, on the grid of `tickSize`; when `large` was asked for, `large` is at most 32 trades of the minute with the largest value (price × size), `[time, price, size, side, …]`, side `1` for an aggressive buy and `-1` for an aggressive sell, largest first and the earlier first when equal, all of them when the minute has fewer than 32.
  - `covered` are the stretches of `[from, to)` whose trades are complete, `[[start, end], …]`: `[[from, to]]` when all are there, `[]` when not a single minute is. When the platform (or your server) has no trades for some time, or did not receive all of them (it was not receiving then, was disconnected, or no longer keeps them), split what is before and after it into stretches, oldest first. Only a minute entirely inside a stretch is complete, and a minute left out within it has no trades; a minute in no stretch is "No trades", and is not asked for again. **A minute can go into `covered` only when every one of its trades is there**, or the chart draws wrong numbers: leave out the minutes of a disconnection and keep the complete ones around them, and only the bars of the disconnection say "No trades".
  - `tickSize` is the step of the prices of `levels`: the symbol's smallest price change, or `0` (the prices as they are). The chart puts each price on the symbol's `tickSize` (adding up what falls in the same row), so it has to be as fine as the symbol's or finer.
  - When they cannot be had, the returned Promise rejects: the chart asks again after 5 seconds, waiting twice as long each time up to 80 seconds, and those bars say "Failed" meanwhile. When they cannot be given for now but you know when they can (your server is still working these minutes out from trades, say), give the rejected error a `retryAfter` (in milliseconds): this is not a failure; those bars say "Loading", the chart asks for the same stretch again at that time, without waiting longer each time, and never takes it as having no trades.
  - With trades at hand, `tradeMinutes(trades, tickSize, parts)` builds the minutes (the trades with their `side`), exactly as the chart keeps them itself from the trades streamed to it:

    ```ts
    import { tradeMinutes } from '@kumo-charts/pro-chart';

    getTradeMinutes: async ({ symbol, from, to, parts, signal }) => {
      const trades = await api.trades(symbol, from, to, signal); // [{ time, price, size, side }]
      return { covered: [[from, to]], tickSize: 0.1, minutes: tradeMinutes(trades, 0.1, parts) };
    };
    ```

- **Order book** `subscribeBook(symbol, listener)`: given, it brings the order book heatmap (BOOKHEATMAP in the "Order flow" group of the indicators window). `listener` receives a list of snapshots `{ time, bids, asks }`: `time` in milliseconds, `bids` and `asks` levels as `[price, size]` (sizes in the base asset, in any order). The depth of a side reaches the deepest level given, and a level with a size of 0 says that nothing is resting there and that everything up to there is known; when only levels with orders are given, what is beyond the deepest is taken as unknown and not drawn. The chart keeps one per second (the last when a second has several), the charts of one symbol share one order book and one subscription, and it unsubscribes when the last heatmap closes. Exchanges do not give past order books, so the heatmap starts with the subscription; pushing the latest stretch the server keeps (the last 2 minutes, say) just after subscribing keeps it from being empty after the page reloads.
- The chart subscribes to the symbol and timeframe shown, and unsubscribes from the old ones when they change; it subscribes to the symbols with alerts too, see ["Alerts"](alerts.md). A symbol and timeframe are subscribed to only once, shared by the charts and the alerts.
- The chart subscribes first and then asks for the latest bars (so `subscribe()` is called before `getBars()`): trades and bars streamed while the bars are on the way are kept, then joined in the order received once the bars arrive, so the bar in progress misses no trade, and a bar that ends meanwhile has its final values too. A datafeed that streams only trades cannot tell which trades are already counted in the last bar it returned, so the volume of a few trades in that time may be counted twice.

The pro chart comes with no datafeed for an exchange or any other platform: an embedding page has its own market data, and connects it through the methods above.
