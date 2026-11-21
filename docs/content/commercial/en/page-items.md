# Buttons, menus and watchlist

## Your own buttons

`buttons` puts the page's buttons into the chart, looking like the built-in ones:

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  buttons: [
    // On the left of the top bar, after the built-in tools.
    { id: 'trade', text: 'Place order', icon: 'plus', onClick: () => openOrderTicket() },
    // On the right of the top bar, with a menu.
    {
      id: 'share',
      icon: 'more',
      text: 'Share',
      placement: 'end',
      items: [
        { id: 'link', label: 'Copy link', onClick: copyLink },
        { type: 'separator' },
        { id: 'image', label: 'Save image', icon: 'camera', onClick: saveImage }
      ]
    },
    // At the bottom of the drawing toolbar, an icon only, with the text as its tooltip.
    {
      id: 'ruler',
      icon: 'M4 18L18 4M7 15l2 2M11 11l2 2M15 7l2 2',
      text: 'Ruler',
      placement: 'drawings'
    }
  ]
});
```

| Field       | Description                                                                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | Required, different for each button, and used in the `buttonClick` event                                                                                                                                |
| `text`      | The text on the button; with an icon, the tooltip too (only the icon shows when narrow). It can be given per language as `{ en, zh, ja, ko }`, with `en` required and shown for the languages not given |
| `icon`      | The name of a built-in icon (as `bell`, `star`, `camera`, `plus`, `more`), or an SVG path on a 24×24 grid (stroked like the built-in icons)                                                             |
| `placement` | `start` (the default, on the left of the top bar), `end` (on the right of the top bar, before the layout button) or `drawings` (at the bottom of the drawing toolbar, with an icon required)            |
| `active`    | Looks pressed, as the replay button during a replay                                                                                                                                                     |
| `disabled`  | Cannot be clicked                                                                                                                                                                                       |
| `items`     | Menu items, a menu opening when the button is clicked                                                                                                                                                   |
| `onClick`   | Called on a click                                                                                                                                                                                       |

A click calls `onClick` first and then emits the `buttonClick` event (`{ id, item }`). In Vue and React, listening to the event is handier, without functions in the options. To change the state of a button (toggling `active`, say), give a new list of buttons with `applyOptions({ buttons })`.

Menu items: `id`, `label` (required), `icon`, `checked` (a check mark, `true` or `false`), `disabled`, `danger` (for actions such as removing), `tone` (text in the up or down color: `up`, `down`, as for buy and sell), `field` (a number field in the item, as a quantity: `value`, `step` (how much each arrow key adds or takes away), `min` and `onChange`; picking the item still runs `onClick`, which reads the value `onChange` noted; the text and the field lean toward the mouse, so the text is on the left when the menu opens right of the mouse), `items` (a submenu) and `onClick`; a divider is `{ type: 'separator' }`, and a small heading above a group of items (which cannot be picked) is `{ type: 'heading', label }`. A row of small buttons is `{ type: 'buttons', id, buttons, tone, caption, captionHint }`: each of `buttons` has `id`, `label`, `disabled`, `hint` (the tooltip while the pointer rests on it, as why it cannot be clicked), `caption` (what the text of the row shows while the pointer is over it) and `onClick`, and clicking one is like picking a menu item (the menu closes, and `contextMenuClick` carries its `id`); `caption` is the text of the row (as a quantity), on the other side of the buttons (leaning toward the mouse, as for an item with a `field`), and `captionHint` its tooltip. A row of choices that can be picked or not is `{ type: 'chips', id, options, value, onChange }`: each of `options` has a `value` (a string) and a `label`, and `value` is the one picked (`null` for none); clicking one picks it and clicking it again picks none, `onChange` receives the new value, the menu stays open, and `contextMenu` is called again right away for new menu items, so that other items can show what picking it changes (as when a number field of the menu changes). These two kinds of rows can only be clicked with the pointer, and the arrow keys skip them. Users can untick some of the chart's built-in items by clicking "Edit the context menu" under "Controls" in the chart settings (kept in the chart's settings, `hiddenMenu`); the page's items and the chart settings item always show.

## Context menu

`contextMenu` is a function called on each right-click on the chart, and the menu items it returns go at the top of the context menu. While the menu is open, when Vue reactive data it read (as a quote) changes, it is called again for new menu items, so that numbers that follow the price, as quantities, stay live; when what it reads is not Vue reactive data (in React or plain JS pages), call `chart.refreshContextMenu()` when the data changes, and an open menu fetches its items again, while nothing happens when no menu is open. The argument is where the click was: `chart` (which chart), `symbol`, `time` (the time of the bar under the pointer) and `price` (the price at the pointer, rounded to the symbol's decimals; `null` when not on the main pane).

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  contextMenu: ({ symbol, price }) =>
    price === null
      ? []
      : [
          { id: 'buy', label: `Limit buy ${price}`, onClick: () => order(symbol, 'buy', price) },
          { id: 'sell', label: `Limit sell ${price}`, onClick: () => order(symbol, 'sell', price) }
        ]
});
```

Picking one calls the menu item's `onClick` first and then emits the `contextMenuClick` event (`{ id, chart, symbol, time, price }`, with `order` too for a click on an order line). Items are added only to the context menu of the plot area; the context menus of drawings, alert lines and the scales stay as they are. When the menu closes (or gives way to another menu), the `contextMenuClose` event is emitted with the arguments given to `contextMenu` when it opened: a line drawn at the clicked price while the menu was open, say, is taken away then.

**The context menu of order lines**: on a right-click on an order line the page drew itself (`chart.orders`), the argument has one more field, `order` (the `id` of the line), and the menu is then the line's own: only the items the page returns, without the chart's own items. Give the actions that make sense for the line by its `order` (cancelling the order, removing the stop, say); an empty array leaves the chart's usual menu on the line. A click not on an order line has no `order`, as before.

## Watchlist

The watchlist is the page's own (where it is kept and how it shows is up to the page); the chart only lights up its stars in the symbol search. Give the ids of the symbols in the list to `watchlist`; when the user clicks a star, the chart emits `watchlistStar`, and the page changes the list and gives it again:

```ts
const chart = createProChart(container, { datafeed, symbol: 'BTCUSDT', watchlist: myList.ids() });

chart.on('watchlistStar', ({ symbol, starred }) => {
  if (starred) {
    myList.add(symbol);
  } else {
    myList.remove(symbol);
  }

  chart.applyOptions({ watchlist: myList.ids() });
});
```

The star shows when the pointer is over a row, and stays lit for symbols already in the watchlist. Without `watchlist` (or with `null`), there are no stars.
