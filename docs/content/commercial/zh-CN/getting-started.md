# 快速开始

用 npm 安装：

```bash
npm install @kumo-charts/pro-chart
```

在自己电脑的开发服务器上不用授权码；放到正式网站或应用里要有授权码，见[「授权」](license.md)。

```ts
import { createProChart } from '@kumo-charts/pro-chart';

const chart = createProChart(document.getElementById('chart')!, {
  datafeed: myDatafeed, // 见下面的「接入行情」
  symbol: '600519.SH'
});
```

图表会填满容器，所以要给容器设好高度。它放在自己的 Shadow DOM 里：网页的样式影响不到图表，图表的样式也不会影响网页；一个页面可以放多个。

常用的再加几项：

```ts
const chart = createProChart(container, {
  datafeed: myDatafeed,
  symbol: '600519.SH',
  upColor: 'red', // 红涨绿跌
  accentColor: '#c2410c', // 品牌色
  brand: { name: '某某证券', logo: '/logo.svg', href: '/' },
  licenseKey: 'KCS1.…'
});

// 页面上自己的品种列表、按钮等，用接口切换图表。
watchlist.on('select', (id) => chart.setSymbol(id));

// 提醒触发时，由页面自己推送。
chart.on('alert', (event) => {
  push(event.title, event.body); // 如「提醒」「贵州茅台 上穿 1,688.00」
});
```

再往下是定制：加自己的按钮和右键菜单（比如「下单」），注册自己的指标，按网站配色，用接口操作指标、布局、回放，把整个图表状态存到自己的服务器。都在后面的页面里。

## 普通网页

不用 Vue、React、也没有打包工具的页面，从 CDN 引用包里打包好的单文件 ES 模块 `dist/browser/pro-chart.js`：图表、Vue 运行时和商业版组件都在里面，不依赖任何框架，压缩后约 1.3MB，gzip 约 420KB。正式网站在地址里写上版本号（`@kumo-charts/pro-chart@版本号/…`），免得新版本发布时跟着变。

```html
<div id="chart" style="height: 600px"></div>
<script type="module">
  import { createProChart } from 'https://cdn.jsdelivr.net/npm/@kumo-charts/pro-chart/dist/browser/pro-chart.js';

  createProChart(document.getElementById('chart'), { datafeed, symbol: 'BTCUSDT' });
</script>
```

图表放在自己的 Shadow DOM 里，页面上改按钮、边框、字号的样式影响不到它。Vue 和 React 用组件，见[「Vue 和 React」](frameworks.md)。

## 不包含

下单交易（接券商账户、委托、持仓）、行情数据本身、自选列表本身和侧边面板（页面上通常有自己的，自选可以接到品种搜索的星标上）、用户账号和后台。下单入口可以用[自己的按钮和右键菜单](page-items.md)接到页面自己的交易界面。
