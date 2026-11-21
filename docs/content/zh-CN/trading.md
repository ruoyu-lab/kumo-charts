# 委托单线和成交标记

<!-- code-prelude
declare const order: { id: string };
declare const fill: { id: string; time: number; price: number };
declare const openOrders: import('@kumo-charts/core/trading').OrderInput[];
declare const entry: { time: number; price: number };
declare const exit: { time: number; price: number };
declare const exchange: {
  modifyOrder(id: string, price: number): Promise<void>;
  cancelOrder(id: string): void;
  setStopLoss(price: number): void;
};
-->

交易界面常用的两样：把挂着的委托单画成一条可以拖动的价格线，在 K 线上标出买卖成交。它们是两个模块，都在 `@kumo-charts/core/trading` 里，可以只载入其中一个。

```ts live height=360
import { createChart } from '@kumo-charts/core';
import { orders, markers } from '@kumo-charts/core/trading';
import { loadBars } from '@docs/data';

const chart = createChart(document.getElementById('chart')!, {
  modules: [orders(), markers()]
});

chart.data.set(await loadBars(), { interval: '1m' });
chart.data.setTimeframe('15m');

const bars = chart.data.toArray();
const last = bars.at(-1)!;
chart.orders.add({
  id: 'o1',
  side: 'buy',
  price: last.close * 0.99,
  label: 'LIMIT',
  quantity: 0.5
});
chart.orders.add({ id: 'o2', side: 'sell', price: last.close * 1.015, label: 'TP', quantity: 0.5 });

const entry = bars.at(-40)!;
chart.markers.add({ id: 'f1', time: entry.time, position: 'below', shape: 'arrow-up', text: '买' });
```

## 委托单线

```ts
import { orders } from '@kumo-charts/core/trading';

createChart(container, { modules: [orders()] });

chart.orders.add({
  id: order.id, // 通常就是交易所或券商的委托单号
  side: 'buy', // 'buy' 或 'sell'，决定默认颜色
  price: 95000,
  label: 'LIMIT', // 标签文字，默认 BUY / SELL
  quantity: 0.25 // 显示在标签后面
});

chart.orders.update(order.id, { price: 94800 });
chart.orders.remove(order.id);
chart.orders.set(openOrders); // 用最新的挂单整批替换
```

`id` 不给的话图表从 `order-1` 起编号，`add()` 返回它；`clear()` 去掉全部委托单。

线在绘图区上方或下方时，标签带箭头固定在上边或下边，几条线的标签按线的顺序叠在一起；点一下标签，画面回到那条线；能拖的线，拖它的标签和拖线本身一样。提醒的线同样处理。`priceScale.pinLabels: false` 关掉后，标签和线一起在画面外。

标签默认在绘图区右侧。`labelPosition` 是标签沿线的位置，从 0（最左）到 1（最右，默认），比如 `0.5` 在中间。只有左右位置重叠的标签才会上下错开。设了 `labelDraggable: true`，用户可以把标签沿线左右拖动：图表让标签跟着走、留在松手的地方，并按阶段发出 `orderLabelDrag`（`{ id, phase, position, initialPosition }`），你把 `position` 存下来，下次 `orders.set()` 时带上。线本身也能拖时，从标签开始横着拖移动标签，竖着拖移动线。`axisLabel: false` 不在价格轴上标这条线的价格，适合标签里已经写了价格的时候。`tooltip` 是鼠标在线或标签上停一会儿时显示的提示文字，比如标签里没写的平仓价。

委托单的状态以交易所为准：最简单的做法是每次收到挂单变化，都用 `set()` 把全部挂单设一遍。

### 拖动改单

用户可以上下拖动委托单线。拖的时候线跟着走，松手时留在新的价格，并按阶段发出 `orderDrag`：

```ts
chart.on('orderDrag', async ({ id, phase, price, initialPrice }) => {
  if (phase !== 'end') return;

  try {
    await exchange.modifyOrder(id, price);
  } catch {
    chart.orders.update(id, { price: initialPrice }); // 改单失败，放回原来的价格
  }
});
```

拖动中按 Esc 会取消，线回到原位，发出 `phase: 'cancel'`。不想让某条单被拖动，设 `draggable: false`。

### 从线上拉出价格

设了 `pull: true` 的线，拖的时候它自己不动，像从持仓线上拉出止损：`orderDrag` 照样按阶段发出指针所在的价格，拉出来的那条由你来画（比如跟着事件放一条委托单线），松手（`phase: 'end'`）时按那个价格下单或改单。

```ts
chart.orders.add({ id: 'position', side: 'buy', price: 95000, label: 'LONG', pull: true });

chart.on('orderDrag', ({ id, phase, price }) => {
  if (id !== 'position') return;

  if (phase === 'move') {
    if (chart.orders.get('pulled')) chart.orders.update('pulled', { price });
    else chart.orders.add({ id: 'pulled', side: 'sell', price, label: 'SL' });
  } else if (chart.orders.get('pulled')) {
    chart.orders.remove('pulled');
    if (phase === 'end') exchange.setStopLoss(price);
  }
});
```

### 标签上的按钮

```ts
chart.orders.add({
  id: order.id,
  side: 'sell',
  price: 98000,
  buttons: [{ id: 'cancel', text: '✕' }]
});

chart.on('buttonClick', ({ kind, id, buttonId }) => {
  if (kind === 'order' && buttonId === 'cancel') exchange.cancelOrder(id);
});
```

按钮可以是文字（`text`），也可以是图标（`icon`，24 × 24 的 SVG 路径）。

## 成交标记

```ts
import { markers } from '@kumo-charts/core/trading';

createChart(container, { modules: [markers()] });

chart.markers.add({
  id: fill.id,
  time: fill.time, // 标在这个时间所在的那根 K 线上
  position: 'below', // 'above' 最高价上方、'below' 最低价下方、'price' 在某个价格上
  shape: 'arrow-up',
  text: '买 0.25'
});
```

形状有 `arrow-up`、`arrow-down`、`triangle-up`、`triangle-down`、`circle`、`square`。颜色默认向上的用主题的 `buy`，向下的用 `sell`，圆和方块用文字颜色；也可以用 `color` 自己指定，`size` 改大小（默认 8 像素）。`outline` 给形状描一圈 1 像素的边（比如黑色），连到它的虚线两边也描上，压在 K 线上也看得清。

标在具体价格上：

```ts
chart.markers.add({
  id: 'f2',
  time: fill.time,
  position: 'price',
  price: fill.price,
  shape: 'circle'
});
```

同样有 `update()`、`remove()`、`set()`、`clear()`、`list()`、`get()`；`id` 不给的话从 `marker-1` 起编号。

### 连起一次开平

`link` 写另一个标记的 `id`，两者之间画一条虚线，颜色用被连的那个的，像一笔交易从开仓连到平仓：

```ts
chart.markers.set([
  { id: 'in', time: entry.time, position: 'price', price: entry.price, shape: 'arrow-up' },
  {
    id: 'out',
    time: exit.time,
    position: 'price',
    price: exit.price,
    shape: 'arrow-down',
    link: 'in'
  }
]);
```

两头都在数据里时才画；一头滚出了视野，线照样画到它那根 K 线上。

比最后一根 K 线还晚、已经过了它那个周期的标记先不画，等它那根 K 线来了再画在上面；砖形图这类不按时间的 K 线，比最后一根晚的标记都画在最后一根上。标记再多也只处理看得见的那些，几万个回测成交也不会拖慢拖动和缩放。

## 选中

委托单线和成交标记都能被点中，点中时发出 `selectionChange`，`selection.kind` 是 `'order'` 或 `'marker'`，见[交互](interaction.md#选中对象)。

委托单、成交标记不在 `saveState()` 里，它们属于你的交易数据，每次从交易所拿。
