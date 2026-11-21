# 授权

商业版的规则是**只有本机开发免授权**：在自己电脑的开发服务器上随便用，放到正式网站或应用里要有商业授权码。授权在 [kumochart.com](https://kumochart.com/components/) 购买，分个人和公司两档，付款后马上拿到授权码。

## 商业授权包括什么

- 商业版的全部组件：专业图表，以及它里面的订单流、信息驱动 K 线和公式指标。
- **不用注明出处**：开源版请使用者在页面上注明用了 Kumo Charts，商业授权不需要；图表左上角放你自己的名称和 logo（`brand` 选项）。
- 更新期内发布的新版本都能升级；更新期过了，已经发布的版本照样永久可用。
- 个人和公司两档的组件一样，区别是能用在几个域名和应用上。

## 给图表授权码

```ts
import { createProChart } from '@kumo-charts/pro-chart';

// 网站
createProChart(container, { datafeed, symbol: '600519.SH', licenseKey: 'KCS1.…' });

// 桌面、手机应用：再给应用标识，反向域名格式
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  licenseKey: 'KCS1.…',
  appId: 'com.acme.charts'
});
```

Vue、React 组件把它们写在 `options` 里。授权码在浏览器里离线校验，不连服务器。没有授权码、或者授权码不覆盖这个页面时，图表左下角显示「Kumo Charts 商业版 · 未授权，仅供试用」（界面是英、日、韩文时用对应的语言）；校验的那一下不显示。

## 哪些页面要授权

- **本机开发**：主机是 `localhost`、`127.*.*.*`、`0.0.0.0`、`::1`、`*.localhost`、`*.test` 的页面（http 或 https）不需要授权，也不显示水印。Android 混合应用的页面是 `https://localhost`，和本机开发分不开，也按这一条算。
- **网站**：有域名的页面（包括局域网里的 `*.local`）按域名授权，授权码的域名覆盖它才算。`acme.com` 包括 `www.acme.com`；`*.acme.com` 是所有子域名。页面算哪个域名看它的来源：`<iframe srcdoc>`、`about:blank`、`blob:` 页面算创建它们的网站。网站给了 `appId` 也只按域名算。
- **没有域名的页面**按应用标识授权：从文件打开的（`file:`，比如桌面应用）、应用自己的协议（比如 iOS 应用的 `capacitor://localhost`、CEF 这类桌面应用注册的协议）、沙箱 iframe 和 `data:` 页面。给了 `appId`、授权码的应用里有它才算。`appId` 是反向域名格式（字母开头的一段，再加 `.` 隔开的若干段，由字母、数字、`-`、`_` 组成，不分大小写），格式不对时 `createProChart()` 直接报错。

一个授权码可以同时有域名和应用标识。

## 正式网站要用 HTTPS

浏览器只在安全页面（HTTPS 和 `localhost`）上提供校验签名用的 `crypto.subtle`。用 http 或局域网 IP 打开时，授权码即使有效也校验不了，图表显示水印。应用里的页面也要能用 `crypto.subtle`（WebView、CEF 一般都有）。

## 更新期

授权码带一个**更新截止日**，不是停用日：在这天以前（含这天）发布的版本，这个授权码永远能用；之后发布的版本它不再覆盖，要续费拿新的授权码才能升级。比的是代码的发布日期，不看访问者电脑的时钟。

## 没通过时看控制台

授权码不覆盖当前页面时，浏览器控制台对每个域名或应用、每个组件提示一次原因，以 `Kumo Charts Commercial:` 开头：域名不对、应用标识没给或对不上、这个版本发布在更新期之后、授权码被改过，或者页面不是 HTTPS。
