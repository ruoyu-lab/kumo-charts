# Drawing tools

`drawingTools` picks the tools of the drawing toolbar and their order. Tools are folded into groups (Lines, Fibonacci and Gann, Patterns, Forecast and measure, Shapes and brushes, Text and notes): each group is placed where its first tool is in the list, the tools of a group are in the order of the list, and a group without tools is not shown.

When the chart is short and the drawing toolbar does not fit, the tools scroll up and down (with the wheel or touchpad), and the end with more tools has a small arrow that scrolls a stretch when clicked. The small triangle at the bottom right of each group opens the list of the group's tools, which looks like the chart type menu, with the tools of a kind together and a divider between kinds (the Lines group is split into lines, channels and pitchforks, say): each row is the tool's icon and name, with its keyboard shortcut at the end of the row and then a star, always shown when it is starred and shown on the row under the pointer otherwise. It works from the keyboard too: Enter opens it, the up and down keys choose (wrapping around at the ends), Enter picks and goes back to the small triangle, Tab reaches the stars, and Esc closes it and goes back to the small triangle.

Starred tools are shown in a bar of favorite drawing tools above the chart area (in the order of the drawing toolbar): a click picks up the tool, and another click puts it down; holding the grip on its left drags it anywhere in the chart area, and double-clicking the grip puts it back (at the top center). The star button below the drawing toolbar hides or shows this bar, and starring a new tool shows it automatically; without starred tools the bar is not shown, and the star button tells how to add favorites. The starred tools, the position of the bar and whether it is shown belong to the layout: the charts of a layout share them, kept in `favoriteDrawingTools`, `favoriteToolsBar` and `favoriteToolsShown` in the state (`ChartView`) of the first chart of the layout, so starring and moving on any chart does the same for every chart of the layout. So do the position of the replay controls, `replayWindow`, and that of the floating toolbar of a selected drawing, `drawingBar`: in a multi-chart layout, the whole chart area has a single floating toolbar, which follows the drawing selected on the current chart, and clicking a drawing on another chart lets go of the drawing selected on the other charts; dragged elsewhere, it stays there, with its position kept in proportion to the whole chart area, and double-clicking its grip takes it back beside the drawing. The method is `setFavoriteDrawingTools(types)`, for the layout of the current chart. The favorite timeframes, chart types and indicators of the top bar are shared by the whole workspace.

The drawing toolbar is split from top to bottom into parts, with a divider between parts: the cursor; the groups of drawing tools; the magnet and keep drawing; the page's own buttons. The star button of the favorite drawing tools, hide drawings and remove drawings stay at the bottom of the drawing toolbar, still while the tools above scroll. The icons of the tools are drawn the same way: a small circle (an anchor) where the user puts a point, and lines between the anchors; a line that extends is drawn to the edge of the icon, so that a trend line (between two anchors), a ray (extending to one side past the second anchor) and an extended line (extending to both sides) tell apart at a glance. Icons are 22 pixels in the drawing toolbar and 20 in menus, and their lines are all 1 pixel wide whatever the size; each chart type has its own icon too, with parts such as falling candles and areas filled solid or light.

```ts
drawingTools: ['horizontal-line', 'trend-line', 'rectangle', 'fib-retracement', 'text'];
```

The tools (52 in all, in the order of the drawing toolbar):

- Lines: `trend-line` (Trend line), `ray` (Ray), `extended-line` (Extended line), `trend-angle` (Trend angle), `info-line` (Info line), `horizontal-line` (Horizontal line), `horizontal-ray` (Horizontal ray), `vertical-line` (Vertical line), `cross-line` (Cross line), `parallel-channel` (Parallel channel), `regression-trend` (Regression trend), `pitchfork` (Pitchfork), `schiff-pitchfork` (Schiff pitchfork), `modified-schiff-pitchfork` (Modified Schiff pitchfork);
- Fibonacci and Gann: `fib-retracement` (Fib retracement), `fib-extension` (Fib extension), `fib-channel` (Fib channel), `fib-time-zone` (Fib time zone), `fib-speed-fan` (Fib speed resistance fan), `gann-box` (Gann box), `gann-fan` (Gann fan), `cyclic-lines` (Cyclic lines);
- Patterns: `xabcd-pattern` (XABCD pattern), `abcd-pattern` (ABCD pattern), `head-and-shoulders` (Head and shoulders), `elliott-impulse` (Elliott impulse wave 12345), `elliott-correction` (Elliott correction wave ABC), `elliott-triangle` (Elliott triangle wave ABCDE), `elliott-double-combo` (Elliott double combo wave WXY), `elliott-triple-combo` (Elliott triple combo wave WXYXZ);
- Forecast and measure: `long-position` (Long position), `short-position` (Short position), `anchored-vwap` (Anchored VWAP), `fixed-range-volume-profile` (Fixed range volume profile), `price-range` (Price range), `date-range` (Date range), `date-price-range` (Date and price range);
- Shapes and brushes: `brush` (Brush, drawn by hand while dragging), `highlighter` (Highlighter, drawn while dragging, wide and translucent), `arrow` (Arrow), `rectangle` (Rectangle), `rotated-rectangle` (Rotated rectangle, along the center line between two points, as wide on both sides; its two end midpoints and four corners can all be dragged), `path` (Path), `circle` (Circle), `ellipse` (Ellipse, which can be drawn at a slant), `triangle` (Triangle);
- Text and notes: `text` (Text), `callout` (Callout), `price-label` (Price label), `flag-mark` (Flag mark), `arrow-mark-up` (Arrow up), `arrow-mark-down` (Arrow down).

Without it, all of them are there, and each of the page's own tools (`customDrawings`) goes after the tool its `after` names, or last in its group without `after`. With a list, the page's own tools appear only when they are in the list too (by their `type`); a built-in tool not in the list is hidden, so that a page replacing Fib retracement with a tool of its own, say, takes `fib-retracement` out of the list and puts its own in. `drawingToolTypes(customDrawings)` gives all the tools there are without a list (in the order of the drawing toolbar), from which taking out what is not wanted is easiest; `DRAWING_GROUP_IDS` are the names of the groups: `lines`, `fibonacci`, `patterns`, `measure`, `shapes` and `annotation`. Drawings of a hidden tool already on the chart still show, and can be selected and changed; only the drawing toolbar does not have the tool, so no new ones can be drawn.

```ts
const tools = drawingToolTypes([RULER]).filter((type) => type !== 'fib-retracement');
chart.applyOptions({ drawingTools: tools }); // our own ruler in place of Fib retracement
chart.applyOptions({ drawingTools: null }); // back to all of them
```

To take drawings away entirely, use `features: { drawings: false }`.

## Measured from: which end the levels count from

The tools with levels (Fib retracement, extension, channel, speed resistance fan, Gann box) have a value on each anchor, by which the levels are counted, kept in the style's `levelRange` (`timeLevelRange` for levels along time), `{ start: 1, end: 0 }` by default: the first anchor is 1 and the second 0, and the level 0.618 is 0.618 of the whole length from the second anchor. "Measured from" in the settings window chooses the default, reversed (`{ start: 0, end: 1 }`), multiples of the move (R) (`{ start: 0, end: -1 }`: the first anchor is 0, negative toward the second, and 1, 2, 3… the other way, so that dragging from the entry price to the stop makes 1 exactly 1R) or custom (a value of your own for each anchor). The text of the levels (`levelLabel`) can have a prefix and a suffix: with `R` as the suffix, it shows `2R`.

The page can give a tool a style with `drawingStyles`, which becomes the tool's default: new drawings of the user use it, the styles the user changed go on top of it, and "Reset style" in the settings window goes back to it. A wrong style (a field that does not exist, a line width out of range) is an error, checked as the library's `checkDrawingStyle()` checks it; it can be changed with `applyOptions` after the chart shows:

```ts
chart.applyOptions({
  drawingStyles: {
    'fib-retracement': {
      levelRange: { start: 0, end: -1 },
      levelLabel: { level: true, format: 'ratio', prefix: '', suffix: 'R', price: true }
    }
  }
});
```

How these tools draw, with their default levels and labels: Fib retracement has 24 levels, showing 0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618, 3.618 and 4.236 by default, with 13 more (1.272, 1.414, 2, 2.272 … 4.764) to turn on in the settings window; Fib time zone draws vertical lines at 0, 1, 2, 3, 5, 8, 13… units; the price and time levels of the speed resistance fan and the Gann box are 0, 0.25, 0.382, 0.5, 0.618, 0.75 and 1 by default; Regression trend fits a linear regression to the closes of every bar between its two anchors, with a line 2 standard deviations above and below, and marks the Pearson correlation coefficient; Anchored VWAP counts from the anchor's bar ((high + low + close) / 3 by default), with bands at 1 standard deviation; Elliott waves are labeled by degree, intermediate by default, (1)…(5) and (A)(B)(C); the "left shoulder, head, right shoulder" of Head and shoulders are shown in the interface's language; the Elliott triangle is labeled A to E, and the combos W, X, Y (with X and Z after them for the triple). Info line writes the change and its percentage, the number of bars and the time, and the angle, in a box beside the middle of the segment; the median line of the Schiff pitchfork starts halfway up the handle (the modified one takes half the time too), which suits trends that are too steep; Gann fan draws rays from the first anchor at angles from 8×1 to 1×8, 1×1 through the second anchor, and each line can have an alert; Cyclic lines draw vertical lines to the right at the interval of their two anchors; ABCD pattern marks the retracement ratios of BC and CD; Arrow up and Arrow down use the up and down colors and can carry a line of text. Regression trend and Anchored VWAP are computed from the bars, so only the times of their anchors matter, and their handles are on the line and can only be dragged left and right.

The drawing settings window shows what each tool can set: a trend line has extending, arrows and text, a rectangle a fill, extending and text inside, channels a fill and extending, Fibonacci tools their levels, the Gann box and the speed resistance fan price and time levels, the Gann fan its angles (price/time, with 2 for 2×1), the highlighter line widths from 6 to 20 pixels, Regression trend the price computed from and the deviations (+2, 0 and −2 standard deviations by default), Anchored VWAP the price computed from and its bands, Fib time zone its levels as multiples (an added level going on with the Fibonacci sequence), Elliott waves the degree, price labels and patterns the color and size of their labels, circles and ellipses text inside, text and callouts a background; a horizontal line has only a price coordinate and a vertical line only a time coordinate, and Regression trend and Anchored VWAP only time coordinates. When the user changes the style on the toolbar or in the settings window, the drawings of that tool drawn from then on use the style, kept in the state's `drawingStyles`; "Reset style" in the settings window resets both the drawing and the tool to the default.

## Changing the two bars: the floating bar and the drawing toolbar

What goes in the bar that floats up by a selected drawing (changing the color and line width, locking, removing), and in what order, is set by `drawingBarItems`. The list can have three kinds of items:

- **Built-in items** (`DRAWING_BAR_PARTS`): `color`, `lineWidth`, `lineStyle`, `separator` (a divider, which can be there several times), `text` (writing text), `settings`, `duplicate`, `lock` and `remove`.
- **Style toggles** `{ field }`: a toggle of the drawing's style as a button, on with one click and off with the next, changed just as in the settings window (it can be undone, and becomes the tool's default too). The toggles there are are in `DRAWING_BAR_SWITCHES`: `fill`, `bold`, `italic`, `extendLeft`, `extendRight`, `startArrow` and `endArrow`. A `label` (the tooltip) and an `icon` can replace the default ones.
- **The page's own buttons** `{ id, label, icon, types? }`: a click emits a `drawingBarClick` event with the drawing; with `types`, they appear only on those kinds of drawings.

Each item appears only when the drawing can use it: a trend line has `extendRight` and a rectangle does not, so the floating bar of a rectangle has no such button; dividers at either end or next to each other are dropped. Without `drawingBarItems`, all the built-in items are there.

```ts
const chart = createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  drawingBarItems: [
    'color',
    'lineWidth',
    'lineStyle',
    'separator',
    { field: 'extendRight' }, // "Extend right" on the floating bar
    { field: 'extendLeft' },
    'separator',
    { id: 'share', label: { en: 'Share', zh: '分享' }, icon: 'M12 5v10M8 9l4-4 4 4M5 19h14' },
    'settings',
    'lock',
    'remove'
  ]
});

chart.on('drawingBarClick', ({ id, symbol, drawing }) => {
  if (id === 'share') {
    share(symbol, drawing); // drawing is the drawing: id, type, points, style, …
  }
});
```

Which of the buttons of the drawing toolbar on the left other than tools stay is set by `drawingToolbarControls` (`DRAWING_TOOLBAR_CONTROLS`): `cursor` (crosshair), `magnet` (magnet), `continuous` (keep drawing), `favorites` (the bar of favorite tools), `hide` (hide drawings) and `clear` (remove all). Only those listed are shown, in their places; the tools themselves are set by `drawingTools`, and the page's own buttons are on ["Your own buttons"](page-items.md).

```ts
chart.applyOptions({ drawingToolbarControls: ['cursor', 'magnet', 'hide'] }); // without keep drawing, favorites and remove all
chart.applyOptions({ drawingBarItems: null, drawingToolbarControls: null }); // back to the defaults
```

## A drawing toolbar of your own: chart.drawingTools

When the two options above are not enough, the built-in bars can be turned off for bars of your own made with `chart.drawingTools`: everything the two built-in bars read and do is there, for writing in any framework.

```ts
const chart = createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  features: { drawingToolbar: false, drawingBar: false } // the built-in drawing toolbar and floating bar off; drawing works as before
});
```

Either toggle can be turned off alone; `chart.drawingTools` works with neither off as well, to put buttons for a few favorite tools elsewhere on the page, say.

| Method                      | Description                                                                                                                                                                                                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list()`                    | The tools offered now, in the groups and order of the drawing toolbar: `[{ id, name, tools: [{ type, name, icon, keys }] }]`, with names in the current language, `icon` an SVG path on a 24×24 grid and `keys` its keyboard shortcut                                       |
| `getState()`                | `{ active, magnet, continuous, hidden, favorites, favoritesShown }`: the tool in use (`null` without one), the magnet (`off`, `weak`, `strong`), keep drawing, whether drawings are hidden, the tools the user starred, and whether the bar of favorite drawing tools is on |
| `start(type)`, `cancel()`   | Picks up a tool (what the user clicks on the chart next draws with it), and puts it down                                                                                                                                                                                    |
| `setMagnet(mode)`           | The magnet                                                                                                                                                                                                                                                                  |
| `setContinuous(on)`         | Keep drawing: drawing one drawing after another                                                                                                                                                                                                                             |
| `setHidden(hidden)`         | Hides and shows all drawings                                                                                                                                                                                                                                                |
| `setFavoritesShown(shown)`  | Turns the bar of favorite drawing tools on and off, as the star button below the drawing toolbar does: on, it shows when there are starred tools                                                                                                                            |
| `clear()`                   | Removes all drawings of the current chart, in one step that can be undone                                                                                                                                                                                                   |
| `undo()`, `redo()`          | Undoes and redoes the last change to the drawings of the current chart                                                                                                                                                                                                      |
| `getSelected()`             | The drawing selected on the current chart: `{ chart, symbol, drawing, style, fields, editableText, bounds }`, or `null` without one                                                                                                                                         |
| `select(id, target?)`       | Selects a drawing, as clicking it does; `null` unselects                                                                                                                                                                                                                    |
| `duplicate(id, target?)`    | Copies a drawing, selects the copy and returns its id                                                                                                                                                                                                                       |
| `openSettings(id, target?)` | Opens the settings window of the drawing                                                                                                                                                                                                                                    |

A drawing is changed with `updateDrawing()` and `removeDrawing()` from "Drawing through methods". The `style` of `getSelected()` is the style the drawing actually uses (what was changed on it on top of the tool's default), `fields` are the style items such drawings have (a drawing without `lineWidth` should not show a line width), `editableText` is whether it can take text, and `bounds` is where it is in the window (in the coordinates of `getBoundingClientRect()`), or `null` when it is out of view.

The bar of favorite drawing tools does not go off with `drawingToolbar`: when the user starred tools, it still floats on the chart, and the page's own drawing toolbar turns it on and off with `setFavoritesShown()`, or turns it off and shows the starred tools itself from `getState().favorites`.

Three events tell of changes: `drawingToolChange` (the same content as `getState()`), `drawingSelectionChange` (`{ selected }`, emitted when another drawing is selected, when the selection is cleared and when the selected drawing changes) and `drawingBoundsChange` (`{ chart, id, bounds }`, when the selected drawing moved in the window, as on scrolling and zooming the chart and dragging the drawing; it is measured each frame only while the page listens to it).

```ts
// Your own drawing toolbar: list the tools, pick one up on a click, and highlight the one in use.
const groups = await chart.drawingTools.list();
toolbar.render(groups, (type) => chart.drawingTools.start(type));
chart.on('drawingToolChange', ({ active, magnet }) => {
  toolbar.highlight(active);
  toolbar.showMagnet(magnet);
});

// Your own floating bar: follow the selected drawing, with buttons for the style items it has.
chart.on('drawingSelectionChange', ({ selected }) => {
  if (!selected) {
    bar.hide();
    return;
  }

  bar.show({
    color: selected.fields.includes('color') ? selected.style.color : null,
    extendRight: selected.fields.includes('extendRight') ? selected.style.extendRight : null,
    onColor: (color) => chart.updateDrawing(selected.drawing.id, { style: { color } }),
    onRemove: () => chart.removeDrawing(selected.drawing.id)
  });
});
chart.on('drawingBoundsChange', ({ bounds }) => {
  bar.moveTo(bounds); // with bounds null, the drawing is out of view
});
```
