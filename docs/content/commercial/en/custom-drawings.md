# Custom drawing tools

How a drawing tool draws is a drawing definition of the library (as `chart.drawings.register()` takes, see "Custom drawings" in the library's docs), which the pro chart registers on every chart (including charts made later) and puts in the drawing toolbar; users draw with it, select, drag and restyle its drawings and put alerts on them as with the built-in tools, and the state keeps them:

```ts
import { DRAWING_GROUP_IDS, type CustomDrawing } from '@kumo-charts/pro-chart';
import { fibRetracement } from '@kumo-charts/core/drawings';

const RULER: CustomDrawing = {
  name: { en: 'R ruler', zh: 'R 尺', ja: 'R 定規', ko: 'R 자' }, // the name in the drawing toolbar and in menus; en is required
  icon: 'M5 19L19 5M5 19h4M19 5v4', // an SVG path on a 24×24 grid, stroked like the built-in icons; or the name of a built-in icon
  group: 'fibonacci', // the group it goes in, one of DRAWING_GROUP_IDS
  after: 'fib-retracement', // after this tool; last in its group without it
  definition: { ...fibRetracement, type: 'r-ruler' } // the type cannot be that of a built-in tool or of another tool of the page
};

const chart = createProChart(container, { datafeed, symbol: 'BTCUSDT', customDrawings: [RULER] });
```

When the definition of a tool comes later, register it with `chart.registerDrawing(RULER)`; when a part of the page turns off (a plugin that gives tools, say), take it down with `chart.unregisterDrawing('r-ruler')`: the drawing toolbar no longer has it, such drawings on the chart are no longer drawn and their alerts stop, but they stay in the chart's state in the same order, and are drawn as they were when registered again. A tool of the page the user put in favorites is not shown in the favorite drawing tools while it is down, and shows again once registered again.
