# 按钮、菜单和自选

## 自己的按钮

`buttons` 把页面的按钮放进图表，样子和自带的一样：

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  buttons: [
    // 顶栏左边，自带工具的后面。
    { id: 'trade', text: '下单', icon: 'plus', onClick: () => openOrderTicket() },
    // 顶栏右边，带菜单。
    {
      id: 'share',
      icon: 'more',
      text: '分享',
      placement: 'end',
      items: [
        { id: 'link', label: '复制链接', onClick: copyLink },
        { type: 'separator' },
        { id: 'image', label: '保存图片', icon: 'camera', onClick: saveImage }
      ]
    },
    // 画线栏最下面，只显示图标，文字是提示。
    {
      id: 'ruler',
      icon: 'M4 18L18 4M7 15l2 2M11 11l2 2M15 7l2 2',
      text: '量尺',
      placement: 'drawings'
    }
  ]
});
```

| 字段        | 说明                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `id`        | 必填，各按钮不同，`buttonClick` 事件里用它                                                                                  |
| `text`      | 按钮上的文字；有图标时也是提示文字（窄的时候只显示图标）。可以按语言给 `{ en, zh, ja, ko }`，`en` 必填，没给的语言显示 `en` |
| `icon`      | 自带图标的名字（如 `bell`、`star`、`camera`、`plus`、`more`），或 24×24 网格上的 SVG 路径（和自带图标一样描线）             |
| `placement` | `start`（默认，顶栏左边）、`end`（顶栏右边，布局按钮前面）、`drawings`（画线栏最下面，必须有图标）                          |
| `active`    | 按下的样子，像回放中的回放按钮                                                                                              |
| `disabled`  | 不能点                                                                                                                      |
| `items`     | 菜单项，点按钮时打开菜单                                                                                                    |
| `onClick`   | 点击时调用                                                                                                                  |

点击时先调用 `onClick`，再发出 `buttonClick` 事件（`{ id, item }`）。在 Vue、React 里监听事件更方便，不用把函数写进选项。要改按钮的状态（比如切换 `active`），用 `applyOptions({ buttons })` 给出新的按钮列表。

菜单项：`id`、`label`（必填）、`icon`、`checked`（打勾，`true` 或 `false`）、`disabled`、`danger`（删除一类的操作）、`tone`（文字用涨或跌的颜色：`up`、`down`，如买和卖）、`field`（项里的数字输入框，如数量：`value`、`step`（方向键每次加减多少）、`min`、`onChange`；选中这一项时 `onClick` 照常运行，在里面读 `onChange` 记下的值；文字和输入框靠向鼠标那边，菜单开在鼠标右边时文字在左）、`items`（子菜单）、`onClick`；分隔线写 `{ type: 'separator' }`；一组项上面的小标题（不能选）写 `{ type: 'heading', label }`。一行几个小按钮写 `{ type: 'buttons', id, buttons, tone, caption, captionHint }`：`buttons` 每个有 `id`、`label`、`disabled`、`hint`（指针停在上面时的提示，如为什么不能点）、`caption`（指针在它上面时这一行文字处显示的内容）、`onClick`，点哪个就像选了一个菜单项（菜单关上，`contextMenuClick` 带它的 `id`）；`caption` 是这一行的文字（如数量），在按钮的另一边（和带 `field` 的项一样靠向鼠标那边），`captionHint` 是它的提示。一行可选可不选的选项写 `{ type: 'chips', id, options, value, onChange }`：`options` 每个有 `value`（字符串）和 `label`，`value` 是选中的那个（`null` 是都没选）；点一个就选上它，再点一次就都不选，`onChange` 收到新值，菜单不关，并且马上再调一次 `contextMenu` 换上新的菜单项，好让别的项显示选了它之后的样子（菜单里的数字输入框改了也会这样）。这两种行只能用指针点，方向键会跳过。用户在图表设置的「操作」里点「编辑右键菜单」，可以勾掉图表自带的某些项（存在图表的设置里，`hiddenMenu`）；页面的项和图表设置项总是显示。

## 右键菜单

`contextMenu` 是一个函数，每次在图上点右键时调用，返回的菜单项放在右键菜单最上面。菜单开着的时候，它读到的 Vue 响应式数据（如报价）一变，就再调一次换上新的菜单项，好让数量这类随价格变的数字实时更新；读的不是 Vue 响应式数据时（如 React 或纯 JS 页面），数据变了调 `chart.refreshContextMenu()`，开着的菜单就重新取一次菜单项，没开菜单时什么也不做。参数是点在哪里：`chart`（第几张图）、`symbol`、`time`（指针下那根 K 线的时间）、`price`（指针处的价格，按品种的小数位取整；不在主图上时为 `null`）。

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  contextMenu: ({ symbol, price }) =>
    price === null
      ? []
      : [
          { id: 'buy', label: `限价买入 ${price}`, onClick: () => order(symbol, 'buy', price) },
          { id: 'sell', label: `限价卖出 ${price}`, onClick: () => order(symbol, 'sell', price) }
        ]
});
```

选中时先调用菜单项的 `onClick`，再发出 `contextMenuClick` 事件（`{ id, chart, symbol, time, price }`，在订单线上点的还有 `order`）。只在绘图区的右键菜单里加；画线、提醒线、坐标轴上的右键菜单不变。菜单关上（或换成另一个菜单）时发出 `contextMenuClose` 事件，参数和打开时给 `contextMenu` 的一样，比如菜单开着时在点的价位画了一条线，就在这时收掉。

**订单线的右键菜单**：页面自己画的订单线（`chart.orders`）上点右键时，参数里多一个 `order`（这条线的 `id`），这时菜单就是这条线的：只有页面返回的项，不带图表自己的项。按 `order` 给出对这条线有意义的操作（比如撤单、移除止损）；返回空数组，这条线上的右键菜单还是图表原来的菜单。不在订单线上点时没有 `order`，和以前一样。

## 自选

自选列表是页面自己的（存在哪、怎么显示都由页面定），图表只在品种搜索里给它点星标。把列表里的品种 id 给 `watchlist`，用户点星标时图表发出 `watchlistStar`，页面改了列表再给一次：

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

星标在指针移到一行上时显示，已经在自选里的一直亮着。不给 `watchlist`（或给 `null`）时没有星标。
