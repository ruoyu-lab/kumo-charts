# 自定义画线工具

画线工具的画法用图表库的画线定义（和 `chart.drawings.register()` 一样，见图表库的「自定义画线」），专业图表把它注册到每张图上（包括之后新建的图），放进画线栏，用户可以像自带工具一样画、选、拖、改样式、设提醒，状态里也会保存：

```ts
import { DRAWING_GROUP_IDS, type CustomDrawing } from '@kumo-charts/pro-chart';
import { fibRetracement } from '@kumo-charts/core/drawings';

const RULER: CustomDrawing = {
  name: { en: 'R ruler', zh: 'R 尺', ja: 'R 定規', ko: 'R 자' }, // 画线栏和菜单里的名字，en 必填
  icon: 'M5 19L19 5M5 19h4M19 5v4', // 24×24 网格上的 SVG 路径，和自带图标一样描线；也可以是自带图标的名字
  group: 'fibonacci', // 放在哪一组，DRAWING_GROUP_IDS 之一
  after: 'fib-retracement', // 放在这个工具后面；不给是组里最后
  definition: { ...fibRetracement, type: 'r-ruler' } // 类型不能和自带工具或别的页面工具重名
};

const chart = createProChart(container, { datafeed, symbol: 'BTCUSDT', customDrawings: [RULER] });
```

工具定义晚一点才拿到时，用 `chart.registerDrawing(RULER)` 注册；页面的一部分关掉时（比如提供工具的插件），用 `chart.unregisterDrawing('r-ruler')` 撤下：画线栏不再有它，图上这种线不画了、它的提醒也停了，但留在图表状态里、顺序不变，再注册时原样画出来。用户收藏过的页面工具，撤下时常用画线栏里不显示它，再注册又显示出来。
