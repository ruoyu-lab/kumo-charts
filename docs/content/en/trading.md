# Orders and fills

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

Two things trading screens need: open orders as price lines the user can drag, and fills marked on the bars. They are two modules, both in `@kumo-charts/core/trading`; load either one alone if you like.

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
  label: { text: 'LIMIT', quantity: 0.5 }
});
chart.orders.add({
  id: 'o2',
  side: 'sell',
  price: last.close * 1.015,
  label: { text: 'TP', quantity: 0.5 }
});

const entry = bars.at(-40)!;
chart.markers.add({
  id: 'f1',
  time: entry.time,
  position: 'below',
  shape: 'arrow-up',
  text: 'Buy'
});
```

## Order lines

```ts
import { orders } from '@kumo-charts/core/trading';

createChart(container, { modules: [orders()] });

chart.orders.add({
  id: order.id, // usually the order id of the exchange or broker
  side: 'buy', // 'buy' or 'sell', which sets the default color
  price: 95000,
  label: {
    text: 'LIMIT', // the label's text, BUY or SELL by default
    quantity: 0.25 // shown after the label
  }
});

chart.orders.update(order.id, { price: 94800 });
chart.orders.remove(order.id);
chart.orders.set(openOrders); // replaces them with the latest open orders
```

Without an `id` the chart numbers the order, `order-1` on, and `add()` returns it; `clear()` removes every order.

A line above or below the plot has its label kept at the top or bottom edge, with an arrow, labels of several lines stacked in the order of their lines; a click on it brings the line into view, and a drag moves a draggable line as the line itself does. Alerts' lines go by the same rule. `priceScale.pinLabels: false` leaves them out of sight with their lines.

A label is at the right of the plot; `label.position` puts it elsewhere along the line, from 0 at the left to 1 at the right (the default), such as `0.5` in the middle. Labels are moved apart only from those they would overlap. With `label.draggable: true` users drag the label along its line: it follows and stays where it is let go, and `orderLabelDrag` reports each phase (`{ id, phase, position, initialPosition }`), for you to keep `position` and give it in the next `orders.set()`. Where the line is draggable too, a drag from the label that starts across the plot moves the label, one that starts up or down moves the line. `showOnAxis: false` leaves the order's price off the price axis, as where its label says it. `tooltip` is a short text shown after a moment while the pointer rests on its line or label, such as what the label does not say.

The exchange knows the state of an order: the simplest is to `set()` every open order whenever they change.

### Dragging to modify

Users drag order lines up and down. The line follows, stays at the new price when they let go, and `orderDrag` reports each phase:

```ts
chart.on('orderDrag', async ({ id, phase, price, initialPrice }) => {
  if (phase !== 'end') return;

  try {
    await exchange.modifyOrder(id, price);
  } catch {
    chart.orders.update(id, { price: initialPrice }); // modifying failed: back where it was
  }
});
```

Esc during a drag cancels it: the line goes back and the phase is `cancel`. For an order that must not be dragged, set `draggable: false`.

### Pulling a price out of a line

A line with `pull: true` stays where it is as it is dragged, as a stop loss pulled out of a position: `orderDrag` still tells the price under the pointer at each phase, you draw what is pulled (such as an order line following the events), and act on the price where it is let go (`phase: 'end'`).

```ts
chart.orders.add({
  id: 'position',
  side: 'buy',
  price: 95000,
  label: { text: 'LONG' },
  pull: true
});

chart.on('orderDrag', ({ id, phase, price }) => {
  if (id !== 'position') return;

  if (phase === 'move') {
    if (chart.orders.get('pulled')) chart.orders.update('pulled', { price });
    else chart.orders.add({ id: 'pulled', side: 'sell', price, label: { text: 'SL' } });
  } else if (chart.orders.get('pulled')) {
    chart.orders.remove('pulled');
    if (phase === 'end') exchange.setStopLoss(price);
  }
});
```

### Buttons on the label

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

A button shows `text`, or an `icon` given as SVG path data in a 24 × 24 box.

## Fill markers

```ts
import { markers } from '@kumo-charts/core/trading';

createChart(container, { modules: [markers()] });

chart.markers.add({
  id: fill.id,
  time: fill.time, // on the bar this time falls in
  position: 'below', // 'above' the high, 'below' the low, or at a 'price'
  shape: 'arrow-up',
  text: 'Buy 0.25'
});
```

The shapes are `arrow-up`, `arrow-down`, `triangle-up`, `triangle-down`, `circle` and `square`. Upward shapes take the theme's `buy` color, downward ones its `sell` color, circles and squares the text color; `color` sets another, `size` the size (8 pixels by default). `outline` draws a line of 1px around the shape, a black one for instance, and along each side of the dashed line of a marker linked to it, so that they stand out of the bars they lie on.

At a price:

```ts
chart.markers.add({
  id: 'f2',
  time: fill.time,
  position: 'price',
  price: fill.price,
  shape: 'circle'
});
```

Markers have `update()`, `remove()`, `set()`, `clear()`, `list()` and `get()` too; without an `id` they are numbered `marker-1` on.

### Joining an entry to its exit

`link` names another marker by its `id`: a dashed line joins the two, in that one's color, as a trade from its entry to its exit:

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

The line shows while both are in the data; with one scrolled out of view, it still runs to that one's bar.

A marker later than the period of the latest bar is not drawn until its bar comes, and then sits on it; on bars that take no time, such as Renko bricks, every marker after the latest one sits on it. Only the markers in view are worked on, so tens of thousands of fills of a backtest do not slow down scrolling and zooming.

## Selecting

Order lines and markers can be clicked, which emits `selectionChange` with `selection.kind` `'order'` or `'marker'`; see [Interaction](interaction.md#selecting-objects).

Orders and markers are not part of `saveState()`: they are your trading data, fetched from the exchange each time.
