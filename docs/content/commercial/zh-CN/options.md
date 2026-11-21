# 选项

| 选项                     | 说明                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `datafeed`               | 行情数据，必填                                                                                                                                                                                                          |
| `symbol`                 | 首次打开时显示的品种，必填；之后是用户上次看的品种                                                                                                                                                                      |
| `timeframe`              | 首次打开时的周期，默认 `15m`，提供的周期里没有 `15m` 时用第一个                                                                                                                                                         |
| `timeframes`             | 提供的周期，默认 `1m 3m 5m 15m 30m 1h 2h 4h 6h 12h 1D 1W 1M`（`DEFAULT_TIMEFRAMES`），第一次打开时顶栏上直接显示 `5m 30m 4h 1D`、其余在周期菜单里；数据源合成不了的会自动去掉                                           |
| `indicators`             | 首次打开时的指标，默认 `MA`、`VOL`                                                                                                                                                                                      |
| `theme`                  | `light`（默认）或 `dark`，由页面决定                                                                                                                                                                                    |
| `language`               | `zh`（默认）、`en`、`ja` 或 `ko`，由页面决定（`LANGUAGES` 列出它们和各自的名字，`isLanguage(value)` 检查一个值是不是其中之一）；日期和数字按 `zh-CN`、`en-US`、`ja-JP`、`ko-KR` 的习惯写（`LOCALES`）                   |
| `upColor`                | `red` 为红涨绿跌，默认 `green`                                                                                                                                                                                          |
| `accentColor`            | 按钮、选中状态的主色，比如品牌色                                                                                                                                                                                        |
| `timeZone`               | 用户自己选时区之前显示时间用的时区：如 `Asia/Shanghai`，或 `exchange`（每个品种按它交易日历的时区）；默认是浏览器的时区。用户在时间轴右下角选过以后，按用户的选择（存在状态里）                                         |
| `brand`                  | `{ name, logo, href }`：左上角的名称、logo 图片地址和点击后去的地址；只给 `name` 时只显示名称，`name` 和 `logo` 都不给时显示 KumoChart 的标志，不给 `brand` 时左上角什么也不显示                                        |
| `features`               | 关掉不需要的部分，见下表                                                                                                                                                                                                |
| `lockedLinks`            | 页面固定的联动方式，如 `{ symbol: true }` 让一个布局里的图永远显示同一个品种：被固定的联动不随存下来的状态和 `setLinks()` 变，布局菜单里也不再出现它；默认都不固定                                                      |
| `messages`               | 替换界面文字：`{ zh: { indicators: '技术指标' } }`                                                                                                                                                                      |
| `themes`                 | 每个主题的颜色：界面的设计变量和图本身的颜色，见[「颜色和字体」](appearance.md)                                                                                                                                         |
| `fontFamily`             | 界面和坐标轴的字体，CSS 的 `font-family` 写法                                                                                                                                                                           |
| `buttons`                | 页面自己的按钮，放在顶栏或画线栏，见[「自己的按钮」](page-items.md)                                                                                                                                                     |
| `contextMenu`            | 页面自己的右键菜单项，见[「右键菜单」](page-items.md)                                                                                                                                                                   |
| `crosshairLines`         | 十字线在价格轴上的价格标签下面再加几行文字，比如与最新价的差：参数是 `{ chart, symbol, price }`（指针在 K 线区的价格），返回文字的列表；指针一动就调，要快                                                              |
| `watchlist`              | 页面自选列表里的品种 id：品种搜索给它们点亮星标，用户点星标时发出 `watchlistStar`，见[「自选」](page-items.md)；默认 `null`，没有星标                                                                                   |
| `drawingTools`           | 画线栏里有哪些工具、什么顺序，见[「画线工具」](drawings.md)                                                                                                                                                             |
| `drawingStyles`          | 页面给画线工具的样式，比如斐波那契的档位从哪头数；用户自己改过的样式盖在它上面，见[「画线工具」](drawings.md)                                                                                                           |
| `drawingBarItems`        | 选中画线时浮出来的那条里放什么、什么顺序：自带的项、样式开关（如 `{ field: 'extendRight' }`）、页面自己的按钮，见[「改两条栏」](drawings.md)                                                                            |
| `drawingToolbarControls` | 画线栏里除了工具以外的按钮（十字线、磁铁、连续画、收藏、隐藏、删除全部）留哪些，见[「改两条栏」](drawings.md)                                                                                                           |
| `customDrawings`         | 页面自己的画线工具，和自带的一起放在画线栏里，见[「自定义画线工具」](custom-drawings.md)                                                                                                                                |
| `customIndicators`       | 页面自己的指标（自己写算法，或者用公式），和自带的一起列在指标窗口里，见[「自定义指标」](custom-indicators.md)                                                                                                          |
| `storage`                | 用户的布局、每张图、画线和提醒存在哪里：默认存在浏览器的 `localStorage`（键名 `kumochart-pro-chart`），`browserStorage(key)` 换一个键名，也可以是自己的存储（见[「保存到自己的服务器」](storage.md)）；传 `null` 不保存 |
| `licenseKey`             | 商业授权码，包括图里的成交量轨迹、时间价格机会、订单流指标、大单、订单簿热力图、信息驱动 K 线和公式指标；没有授权码时图表左下角显示「未授权」水印，只有本机开发不需要（见[「授权」](license.md)）                       |
| `appId`                  | 桌面、手机应用的应用标识，反向域名格式，如 `com.acme.charts`，和 `licenseKey` 一起给：没有域名的页面按它授权，网站只按域名（见[「授权」](license.md)）                                                                  |

`features` 里的开关：`topBar`（顶栏，见下）、`symbolSearch`（品种搜索，数据源能搜索时默认打开）、`compare`（比较品种，同样要数据源能搜索）、`chartTypes`（图表类型）、`indicators`（指标）、`volumeProfile`（成交量分布）、`drawings`（画线）、`replay`（回放）、`alerts`（价格、指标和画线提醒）、`history`（画线的撤销重做）、`screenshot`（截图：下载或复制图片）、`dataExport`（导出图表数据）、`multiChart`（多图布局）、`shortcuts`（快捷键，见[「快捷键」](shortcuts.md)），除了品种搜索、比较品种和导出图表数据都默认打开。开关只管界面（`alerts` 例外，关了连已有的提醒也不画、不监控，见[「提醒」](alerts.md)）：比如关了 `indicators`，用户看不到指标按钮，页面仍然可以用 `addIndicator()` 加指标；关了 `compare`，页面仍然可以用 `addComparison()` 比较品种。

画线还有两个小开关：`drawingToolbar`（左边的画线栏）和 `drawingBar`（选中画线时浮出来的那条），默认都开；关掉以后画线功能照常，页面用 `chart.drawingTools` 放自己的，见[「自己做画线栏」](drawings.md)。

**顶栏**：`topBar` 关掉，整条顶栏（品种、周期、图表类型、指标、布局、回放、页面的按钮）都不显示，图表占满容器，页面放自己的栏，用接口操作：`setSymbol()`、`setTimeframe()`、`setChartType()`、`setLayout()`、`openDialog('symbolSearch')`、`openDialog('indicators')` 等，状态的变化从事件里读（`symbolChange`、`timeframeChange`、`layoutChange`……）。快捷键、右键菜单和各个窗口照常。

选项写错时（比如选项或 `features` 里的开关名拼错、`messages` 里没有的文字、按钮没有文字也没有图标、画线工具名拼错、颜色变量名不存在、`timeframe` 不在提供的周期里、`indicators` 里没有的指标），`createProChart()` 直接抛出错误，说明哪里不对、可以写什么。没写类型的页面拼错一个字段，不会悄悄不起作用。

## 显示后再改：applyOptions

主题、语言、颜色、字体、界面文字、功能开关、自己的按钮和菜单、自选列表、画线工具、两条画线栏里放什么，图表显示以后都能改：

```ts
chart.applyOptions({ theme: 'dark', upColor: 'red' });
chart.applyOptions({ features: { replay: false } }); // 只改给出的开关
chart.applyOptions({ accentColor: null }); // null 恢复默认
```

`features`、`messages`、`themes` 按键合并到原来的上面，其他的整个替换；传 `null` 恢复默认。`timeZone` 是默认值：只影响还没自己选过时区的用户。`datafeed`、`symbol`、`storage` 这类只在创建时读一次的选项不能改，传了会报错。切换主题、语言也是它：`applyOptions({ theme: 'dark' })`、`applyOptions({ language: 'en' })`。
