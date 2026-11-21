# Custom drawings

<!-- code-prelude
declare const priceZone: import('@kumo-charts/core/drawings').DrawingTypeDefinition;
declare const zoneId: string;
-->

A drawing tool of your own works like those of the library: users draw it, drag it, select it and undo it, it is saved with the layout, and alerts can watch it.

A drawing type tells the chart three things: how many anchors it has, how to paint it (`paint`), and where the pointer hits it (`hitTest`). Here is a "price zone": two anchors set an upper and a lower price line, reaching from the first anchor to the right edge of the chart.

```ts live height=400
import { createChart, withAlpha } from '@kumo-charts/core';
import {
  drawings,
  type Anchors,
  type DrawingTypeDefinition,
  type Positions
} from '@kumo-charts/core/drawings';
import { loadBars } from '@docs/data';

const priceZone: DrawingTypeDefinition<Anchors<2>> = {
  type: 'price-zone',
  points: 2,
  // the styles a settings form offers
  fields: ['color', 'fillColor', 'lineWidth', 'lineStyle'],
  defaultStyle: (theme) => ({ color: theme.accent, fillColor: withAlpha(theme.accent, 0.12) }),

  paint: ({ ctx, geometry, selected }) => {
    const { box } = zone(geometry.points);
    const { style, width } = geometry;
    ctx.fillStyle = style.fillColor;
    ctx.fillRect(box.left, box.top, width - box.left, box.bottom - box.top);
    ctx.strokeStyle = style.color;
    ctx.lineWidth = selected ? style.lineWidth + 1 : style.lineWidth;
    ctx.beginPath();
    ctx.moveTo(box.left, box.top);
    ctx.lineTo(width, box.top);
    ctx.moveTo(box.left, box.bottom);
    ctx.lineTo(width, box.bottom);
    ctx.stroke();
  },

  hitTest: (geometry, point, tolerance) => {
    const { box } = zone(geometry.points);
    if (point.x < box.left - tolerance) return null;
    const edge = Math.min(Math.abs(point.y - box.top), Math.abs(point.y - box.bottom));
    if (edge <= tolerance) return { part: 'line', distance: edge };
    return null;
  }
};

/** The area between the two anchors, in pixels */
function zone([a, b]: Positions<Anchors<2>>) {
  return {
    box: { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y) }
  };
}

const chart = createChart(document.getElementById('chart')!, {
  modules: [drawings([priceZone])]
});

chart.data.set(await loadBars(), { interval: '1m' });
chart.data.setTimeframe('1h');
chart.drawings.startTool('price-zone'); // click twice on the chart
```

## Coordinates

The `geometry` that `paint` and `hitTest` receive holds:

- `points`: the anchors in pixels, from the top left of the pane's plot, in the order they were placed.
- `anchors`: the anchors' times and prices.
- `width`, `height`: the size of the plot.
- `style`: the drawing's style, its own over the defaults.
- `valueToY`, `yToValue`, `timeToX`: conversions between prices, times and pixels, for lines beyond the anchors.
- `bars`: the displayed bars, for example to find the highest price after an anchor.
- `formatValue`: a price as the axis writes it, for labels.
- `theme`, `textFont`, `measureText`: for text.

Typed by its anchors, as `DrawingTypeDefinition<Anchors<2>>`, a type gets `points` and `anchors` as pairs, none of them to check for: the chart gives it as many anchors as its `points` says.

`paint` gets a `ctx` already clipped to the plot and moved to its corner: paint in CSS pixels, and the chart takes care of dense screens. `hovered` and `selected` say whether the pointer is over it and whether it is selected, to draw it more prominently. Dashes follow the drawing's line style: `dashPattern(style.lineStyle, style.lineWidth)` (from `@kumo-charts/core/drawings`) gives the dashes the built-in drawings use.

## Hits

`hitTest` returns `null` for a miss; for a hit, the `part` and the distance: `line` on one of its lines, `body` on its content, as its text, the box of a label or a mark painted solid. Never return a hit inside a fill: a fill is the background of a drawing, a click there reaches what is under it and dragging there pans the chart, so a drawing is taken by its lines, as the drawings of the chart are. Among drawings on top of each other, and among order lines, alert lines and drawings, a hit on a line comes before a hit on content; of hits on lines (or on content), the nearer comes first, and the one on top, drawn last, at the same distance. `tolerance` is the chart's `interaction.hitTolerance`, 6 pixels by default.

The chart takes care of the handles, the dots that reshape a drawing: one per anchor by default, which moves its anchor. For other handles, write `handles()` and `moveHandle()`. Its fourth argument, `space`, turns times and prices into where they are drawn (bar positions, values on the pane's scale): computed there, a handle ends under the pointer on a logarithmic scale and across gaps between bars too, and its `unitHeight`, how tall a unit of the scale is in widths of a bar, keeps angles and lengths as the screen shows them; the fifth is the drawing's style. Handles whose `id` is an anchor's index (`'0'`, `'1'`, …) need no `moveHandle()`: dragging one moves its anchor. A handle with another `id` and no `moveHandle()` fails as soon as it shows.

## More options

| Option                | Effect                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `points: 0`           | Any number of anchors, finished with a double click or Enter, as a path                                                                                                                                                        |
| `freehand`            | Drawn by dragging, as a brush (with `points: 0`)                                                                                                                                                                               |
| `place`, `complete()` | Users place the first anchors and you work out the others, such as a stop mirrored from a target; `complete()` gives `points` anchors, or the click places nothing and fails                                                   |
| `mainPane`            | Computed from the bars of the main pane (reading `geometry.bars`, say): drawn on the main pane only                                                                                                                            |
| `paintBelow()`        | What is painted under the bars, such as the zones of a position                                                                                                                                                                |
| `editableText`        | Opens the text editor once placed, and on a double click                                                                                                                                                                       |
| `axisMarks()`         | The prices and times highlighted on the axes while it is selected; its second argument is the style                                                                                                                            |
| `bounds()`            | The area it covers, its lines past the anchors and its labels included, which `chart.drawings.bounds()` returns; `null` where it draws nothing, where the user cannot place it either. Without it, the area around the handles |
| `levels()`            | The lines alerts can watch                                                                                                                                                                                                     |

A type with `bounds()` is not painted while they lie wholly off the plot, nor hit-tested while the pointer is away from them, so they must hold everything it paints and can be hit on. A type without is always painted and hit-tested.

## Letting alerts watch it

```ts no-check
levels: ([a, b]) => {
  const top = Math.max(a.price, b.price);
  const bottom = Math.min(a.price, b.price);
  const time = Math.min(a.time, b.time);
  return [
    // two points at the same time make a horizontal line; extend: 'end' carries it on to the right
    { key: 'top', from: { time, price: top }, to: { time, price: top }, extend: 'end' },
    { key: 'bottom', from: { time, price: bottom }, to: { time, price: bottom }, extend: 'end' }
  ];
};
```

Then an alert for "the price enters the zone":

```ts
chart.alerts.add({
  id: 'zone',
  trigger: 'enter-channel',
  value: [
    { kind: 'drawing', id: zoneId, level: 'top' },
    { kind: 'drawing', id: zoneId, level: 'bottom' }
  ]
});
```

## Using it

```ts
import { drawings, allDrawings } from '@kumo-charts/core/drawings';

createChart(container, { modules: [drawings([...allDrawings, priceZone])] });

// or once the chart exists
chart.drawings.register(priceZone);
```

To put a newer version of the definition in place, as a page that draws the type differently now, use `replace()`: the drawings of the type stay and repaint as it defines them, and its tool, if active, is cancelled. A definition of another number of anchors replaces it only once no drawing of the type is on the chart. `unregister()` removes a type, and fails while drawings of it are on the chart.

When it paints what it reads besides the drawing, such as values the page computes for each drawing, call `refresh()` as that changes: the chart cannot tell.

```ts
chart.drawings.replace({ ...priceZone, fields: ['color', 'fill', 'fillColor'] });
chart.drawings.refresh();
```

To check a style before giving it, such as one a user typed or one stored elsewhere, use `checkDrawingStyle()`: it throws, saying what is wrong, where a chart would not take it:

```ts
import { checkDrawingStyle } from '@kumo-charts/core/drawings';

checkDrawingStyle({ lineWidth: 2, levelRange: { start: 0, end: -1 } });
```
