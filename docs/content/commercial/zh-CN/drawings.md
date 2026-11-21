# 画线工具

`drawingTools` 选出画线栏里的工具，并决定顺序。工具按组折叠（线条、斐波那契与江恩、形态、预测与测量、形状与笔刷、文字与标注）：每组的位置按它第一个工具在列表里的位置，组里的工具按列表顺序，没有工具的组不显示。

图表矮、画线栏放不下时，工具可以上下滚动（滚轮、触控板），哪一头还有工具，那一头就有个小箭头，点一下滚一段。每组右下角的小三角打开这组的工具列表，和图表类型的菜单一个样子，同一类的工具排在一起、类与类之间一条分割线（比如线条组里分线条、通道、音叉三类）：每行是工具的图标和名字，行尾是它的快捷键，再后面是星标：点亮的一直显示，没点亮的鼠标经过这一行时才出现。键盘也能用：回车打开，上下键选（到头绕回），回车选中并回到小三角，Tab 能走到星标，Esc 关上并回到小三角。

点亮星标的工具显示在图表区上方一条常用画线栏里（按画线栏的顺序），点一下就用这个工具、再点一下放下；按住左边的把手能拖到图表区的任何地方，双击把手放回原处（上方正中）。画线栏下方的星形按钮隐藏或显示这条栏，点亮新的工具时它自动显示；没有点亮的工具时这条栏不显示，点星形按钮会提示怎么收藏。点亮的工具、栏的位置和显示与否都属于布局：一个布局里的几张图共用，存在布局第一张图的状态（`ChartView`）的 `favoriteDrawingTools`、`favoriteToolsBar`、`favoriteToolsShown` 里，在哪张图上收藏、挪动，布局里的图都一样；回放控制的位置 `replayWindow` 和选中画线的浮动工具栏的位置 `drawingBar` 也一样：多图布局里，浮动工具栏整个图表区只有一条，跟着当前图选中的那条画线走，在另一张图上点画线时，别的图上选中的画线会放开；拖到别处就留在那里，位置按整个图表区的比例存，双击把手让它回到画线旁边。接口是 `setFavoriteDrawingTools(types)`，作用在当前图所在的布局上。顶栏的常用周期、图表类型和指标是整个工作区共用的。

画线栏从上到下分成几段，段与段之间一条分割线：光标；各组画线工具；磁铁和连续画线；页面自己的按钮。常用画线栏的星形按钮、隐藏画线、删除画线固定在画线栏最下面，上面的工具滚动时它们不动。工具的图标画法统一：用户放点的位置画一个小圆圈（锚点），线画在锚点之间；会延伸出去的线画到图标边上，所以趋势线（两个锚点之间）、射线（过第二个锚点往一边延伸）、延长线（往两边延伸）一眼能分开。画线栏的图标是 22 像素、菜单里的是 20 像素，所有图标的线条不论大小都是 1 像素宽；每种图表类型也有自己的图标，阴线、面积这类部分用实心或浅色填充。

```ts
drawingTools: ['horizontal-line', 'trend-line', 'rectangle', 'fib-retracement', 'text'];
```

工具（共 52 种，按画线栏的顺序）：

- 线条：`trend-line`（趋势线）、`ray`（射线）、`extended-line`（延长线）、`trend-angle`（趋势角度）、`info-line`（信息线）、`horizontal-line`（水平线）、`horizontal-ray`（水平射线）、`vertical-line`（垂直线）、`cross-line`（交叉线）、`parallel-channel`（平行通道）、`regression-trend`（回归趋势）、`pitchfork`（安德鲁音叉）、`schiff-pitchfork`（希夫音叉）、`modified-schiff-pitchfork`（改良希夫音叉）；
- 斐波那契与江恩：`fib-retracement`（斐波那契回撤）、`fib-extension`（斐波那契扩展）、`fib-channel`（斐波那契通道）、`fib-time-zone`（斐波那契时区）、`fib-speed-fan`（斐波那契速度阻力扇）、`gann-box`（江恩箱）、`gann-fan`（江恩扇形）、`cyclic-lines`（周期线）；
- 形态：`xabcd-pattern`（XABCD 形态）、`abcd-pattern`（ABCD 形态）、`head-and-shoulders`（头肩形态）、`elliott-impulse`（艾略特推动浪 12345）、`elliott-correction`（艾略特调整浪 ABC）、`elliott-triangle`（艾略特三角浪 ABCDE）、`elliott-double-combo`（艾略特双重组合浪 WXY）、`elliott-triple-combo`（艾略特三重组合浪 WXYXZ）；
- 预测与测量：`long-position`（多头仓位）、`short-position`（空头仓位）、`anchored-vwap`（锚定 VWAP）、`fixed-range-volume-profile`（固定范围成交量分布）、`price-range`（价格区间）、`date-range`（日期区间）、`date-price-range`（日期价格区间）；
- 形状与笔刷：`brush`（笔刷，按住拖动手绘）、`highlighter`（荧光笔，按住拖动，宽而半透明）、`arrow`（箭头）、`rectangle`（矩形）、`rotated-rectangle`（旋转矩形，沿两点之间的中线，向两边一样宽；两端中点和四个角都能拖）、`path`（折线）、`circle`（圆形）、`ellipse`（椭圆形，可以斜着画）、`triangle`（三角形）；
- 文字与标注：`text`（文字）、`callout`（标注）、`price-label`（价格标签）、`flag-mark`（旗标）、`arrow-mark-up`（向上箭头）、`arrow-mark-down`（向下箭头）。

不给时是全部，页面自己的工具（`customDrawings`）各自放在它 `after` 说的工具后面、没有 `after` 的放在它那一组最后。给了列表时，页面自己的工具也写在列表里（写它的 `type`）才出现；不在列表里的自带工具就藏起来了，比如页面用自己的工具换掉斐波那契回撤，把 `fib-retracement` 从列表里拿掉、换上自己的。`drawingToolTypes(customDrawings)` 给出不给列表时的全部工具（按画线栏的顺序），从里面去掉不要的最方便；`DRAWING_GROUP_IDS` 是各组的名字：`lines`、`fibonacci`、`patterns`、`measure`、`shapes`、`annotation`。藏起来的工具已经画在图上的线照样显示、能选能改，只是画线栏里没有它，不能画新的了。

```ts
const tools = drawingToolTypes([RULER]).filter((type) => type !== 'fib-retracement');
chart.applyOptions({ drawingTools: tools }); // 用自己的尺子换掉斐波那契回撤
chart.applyOptions({ drawingTools: null }); // 恢复全部
```

要整个去掉画线，用 `features: { drawings: false }`。

## 刻度：档位从哪头数

斐波那契回撤、扩展、通道、速度阻力扇、江恩箱这些带档位的工具，每个锚点带一个值，档位按这两个值来数，存在样式的 `levelRange` 里（时间方向的档位是 `timeLevelRange`），默认 `{ start: 1, end: 0 }`：第一个锚点是 1、第二个是 0，档位 0.618 离第二个锚点 0.618 个全长。设置窗口的「刻度」里能选默认、反过来（`{ start: 0, end: 1 }`）、按倍数（R）（`{ start: 0, end: -1 }`：第一个锚点是 0，往第二个锚点那边是负的，另一边 1、2、3……，比如从开仓价拖到止损价，1 就是 1R）和自定义（两个锚点各写一个值）。档位的文字（`levelLabel`）可以加前后缀，比如后缀写 `R` 时显示 `2R`。

页面可以用 `drawingStyles` 给工具一个样式，当作这个工具的默认：用户画新线时用它，用户自己改过的样式盖在它上面，设置窗口的「恢复默认样式」恢复成它。样式写错（比如没有的字段、线宽超出范围）时报错，和图表库的 `checkDrawingStyle()` 检查的一样；能在显示以后用 `applyOptions` 改：

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

这些工具的画法、默认档位和标签：斐波那契回撤有 24 档，默认显示 0、0.236、0.382、0.5、0.618、0.786、1、1.618、2.618、3.618、4.236，另外 13 档（1.272、1.414、2、2.272……4.764）在设置窗口里打开；斐波那契时区在 0、1、2、3、5、8、13…… 个单位处画竖线；速度阻力扇和江恩箱的价格档、时间档默认 0、0.25、0.382、0.5、0.618、0.75、1；回归趋势用两个锚点之间每根 K 线的收盘价做线性回归，上下各一条 2 倍标准差的线，标出皮尔逊相关系数；锚定 VWAP 从锚点那根 K 线起算（默认 (高 + 低 + 收) / 3），带 1 倍标准差的通道带；艾略特波浪按浪级标注，默认中型浪 (1)……(5)、(A)(B)(C)；头肩形态的「左肩、头部、右肩」按界面语言显示；艾略特三角浪标 A 到 E，组合浪标 W、X、Y（三重的再接 X、Z）。信息线在线段中间旁边的框里写涨跌和百分比、K 线根数和时长、角度；希夫音叉的中线从柄的一半高处开始（改良的在时间上也取一半），适合太陡的趋势；江恩扇形从第一个锚点按 8×1 到 1×8 的角度画射线，1×1 过第二个锚点，每条线都能设提醒；周期线按两个锚点的间隔一直往右画竖线；ABCD 形态标出 BC、CD 的回撤比例；向上、向下箭头用涨、跌的颜色，可以带一句文字。回归趋势和锚定 VWAP 由 K 线算出，只有锚点的时间有用，控制点在线上、只能左右拖。

画线设置窗口按工具显示它能设的项：趋势线有延伸、箭头和文字，矩形有填充、延伸和框内文字，通道有填充和延伸，斐波那契有各档，江恩箱和速度阻力扇有价格档和时间档，江恩扇形有各个角度（价格/时间，2 是 2×1），荧光笔的线宽从 6 到 20 像素，回归趋势有计算价格和偏差（默认 +2、0、−2 倍标准差），锚定 VWAP 有计算价格和通道带，斐波那契时区的各档是倍数（加一档时接着斐波那契数列），艾略特波浪有浪级，价格标签、形态有标签颜色和字号，圆形和椭圆形有框内文字，文字和标注有背景，水平线只有价格坐标、垂直线只有时间坐标，回归趋势和锚定 VWAP 只有时间坐标。用户在工具栏或设置窗口里改了样式，这种工具之后新画的线就用这个样式，存在状态的 `drawingStyles` 里；设置窗口的「恢复默认样式」把这条线和这种工具都恢复成默认。

## 改两条栏：浮动条和画线栏

选中一条画线时浮出来的那条（改颜色、线宽、锁定、删除）由 `drawingBarItems` 决定放什么、什么顺序。列表里可以写三种东西：

- **自带的项**（`DRAWING_BAR_PARTS`）：`color`、`lineWidth`、`lineStyle`、`separator`（分隔线，可以写多次）、`text`（写文字）、`settings`、`duplicate`、`lock`、`remove`。
- **样式开关** `{ field }`：把画线样式里的一个开关做成按钮，按一下开、再按一下关，改动和在设置窗口里改一样（能撤销，也成为这种工具的默认）。能用的开关在 `DRAWING_BAR_SWITCHES` 里：`fill`、`bold`、`italic`、`extendLeft`、`extendRight`、`startArrow`、`endArrow`。可以再给 `label`（提示文字）和 `icon` 换掉默认的。
- **页面自己的按钮** `{ id, label, icon, types? }`：点了发出 `drawingBarClick` 事件，带着这条画线；`types` 写了就只在这几种画线上出现。

每一项只在这条画线用得上时才出现：趋势线有 `extendRight`，矩形没有，矩形的浮动条里就不会有这个按钮；两头或连着的分隔线自动去掉。不给 `drawingBarItems` 时是全部自带的项。

```ts
const chart = createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  drawingBarItems: [
    'color',
    'lineWidth',
    'lineStyle',
    'separator',
    { field: 'extendRight' }, // 把「向右延伸」放到浮动条上
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
    share(symbol, drawing); // drawing 是这条画线：id、type、points、style……
  }
});
```

左边画线栏里除了工具以外的按钮由 `drawingToolbarControls` 决定留哪些（`DRAWING_TOOLBAR_CONTROLS`）：`cursor`（十字线）、`magnet`（磁铁）、`continuous`（连续画）、`favorites`（收藏工具条）、`hide`（隐藏画线）、`clear`（删除全部）。列出来的才显示，位置不变；工具本身由 `drawingTools` 管，页面自己的按钮见[「自己的按钮」](page-items.md)。

```ts
chart.applyOptions({ drawingToolbarControls: ['cursor', 'magnet', 'hide'] }); // 不要连续画、收藏和删除全部
chart.applyOptions({ drawingBarItems: null, drawingToolbarControls: null }); // 恢复默认
```

## 自己做画线栏：chart.drawingTools

上面两个选项不够用时，可以把自带的栏关掉，用 `chart.drawingTools` 自己做：自带的两条栏读什么、做什么，这里都有，用什么框架写都行。

```ts
const chart = createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  features: { drawingToolbar: false, drawingBar: false } // 关掉自带的画线栏和浮动条，画线功能照常
});
```

两个开关可以只关一个；都不关也能用 `chart.drawingTools`，比如在页面别处再放几个常用工具的按钮。

| 方法                        | 说明                                                                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list()`                    | 现在提供的工具，按画线栏的分组和顺序：`[{ id, name, tools: [{ type, name, icon, keys }] }]`，名字是当前语言的，`icon` 是 24×24 网格上的 SVG 路径，`keys` 是它的快捷键                         |
| `getState()`                | `{ active, magnet, continuous, hidden, favorites, favoritesShown }`：正在用的工具（没有是 `null`）、磁铁（`off`、`weak`、`strong`）、连续画、是否隐藏了画线、用户收藏的工具、常用画线栏开没开 |
| `start(type)`、`cancel()`   | 拿起一个工具（接下来用户在图上点就是用它画）、放下                                                                                                                                            |
| `setMagnet(mode)`           | 磁铁                                                                                                                                                                                          |
| `setContinuous(on)`         | 连续画：画完一条接着画下一条                                                                                                                                                                  |
| `setHidden(hidden)`         | 隐藏、显示全部画线                                                                                                                                                                            |
| `setFavoritesShown(shown)`  | 开、关常用画线栏，和画线栏底下的星形按钮一样：开着时有收藏的工具才显示                                                                                                                        |
| `clear()`                   | 删除当前图的全部画线，一步能撤销                                                                                                                                                              |
| `undo()`、`redo()`          | 撤销、重做当前图上画线的上一步改动                                                                                                                                                            |
| `getSelected()`             | 当前图上选中的画线：`{ chart, symbol, drawing, style, fields, editableText, bounds }`，没有是 `null`                                                                                          |
| `select(id, target?)`       | 选中一条画线，和点它一样；`null` 取消选中                                                                                                                                                     |
| `duplicate(id, target?)`    | 复制一条画线，选中复制出来的那条，返回它的 id                                                                                                                                                 |
| `openSettings(id, target?)` | 打开这条画线的设置窗口                                                                                                                                                                        |

改一条画线用「用接口画线」里的 `updateDrawing()`、`removeDrawing()`。`getSelected()` 给的 `style` 是这条线实际用的样式（自己改过的盖在这种工具默认的上面），`fields` 是这种线有哪些样式项（没有 `lineWidth` 的线就不该显示线宽），`editableText` 是它能不能写文字，`bounds` 是它在窗口里的位置（和 `getBoundingClientRect()` 一个坐标），不在可见范围里时是 `null`。

常用画线栏不跟着 `drawingToolbar` 关：用户收藏过工具的话它照样浮在图上，页面自己的画线栏用 `setFavoritesShown()` 开关它，或者关掉它、按 `getState().favorites` 自己显示收藏的工具。

状态变了有三个事件：`drawingToolChange`（内容和 `getState()` 一样）、`drawingSelectionChange`（`{ selected }`，换了选中的、取消选中、选中的那条变了都发）、`drawingBoundsChange`（`{ chart, id, bounds }`，选中的线在窗口里挪了位置，图表滚动、缩放、拖线时都会；只在页面监听它的时候才每帧去量）。

```ts
// 自己的画线栏：列出工具，点了就拿起来，正在用的高亮。
const groups = await chart.drawingTools.list();
toolbar.render(groups, (type) => chart.drawingTools.start(type));
chart.on('drawingToolChange', ({ active, magnet }) => {
  toolbar.highlight(active);
  toolbar.showMagnet(magnet);
});

// 自己的浮动条：跟着选中的线走，按它有的样式项显示按钮。
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
  bar.moveTo(bounds); // bounds 是 null 时线不在可见范围里
});
```
