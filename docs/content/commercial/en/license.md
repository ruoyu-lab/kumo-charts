# License

The rule of the commercial edition is that **only development on your own computer is free of a license**: use it as you like on a development server on your own computer, and put it on a production website or app with a commercial license key. Licenses are sold at [kumocharts.com](https://kumocharts.com/en/#pricing), personal and company, and the license key comes right after payment.

## What the commercial license includes

- All the components of the commercial edition: the pro chart, with its order flow, information-driven bars and formula indicators.
- **No attribution needed**: the open-source edition asks its users to credit Kumo Charts on the page, and a commercial license does not; the top left corner of the chart carries your own name and logo (the `brand` option).
- New versions released during the update period can all be upgraded to; once the update period is over, the versions already released stay usable forever.
- The personal and company licenses have the same components; they differ in how many domains and apps they can be used on.

## Giving the chart its license key

```ts
import { createProChart } from '@kumo-charts/pro-chart';

// A website
createProChart(container, { datafeed, symbol: '600519.SH', licenseKey: 'KCS1.…' });

// A desktop or mobile app: give the app's id too, as a reverse domain name
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  licenseKey: 'KCS1.…',
  appId: 'com.acme.charts'
});
```

The Vue and React components take them in `options`. The license key is checked offline in the browser, without contacting a server. With no license key, or one that does not cover the page, the chart shows "Kumo Charts Commercial · unlicensed, for evaluation only" in its bottom left corner (in Chinese, Japanese or Korean when the interface is in that language); nothing shows during the moment of checking.

## Which pages need a license

- **Development on your own computer**: pages on your own computer (`localhost`, `*.localhost`, `127.*.*.*`, `0.0.0.0`, `::1`) on a port development servers use need no license and show no watermark. These are the ports such as Vite's 5173, webpack's 8080, Next.js's 3000 and Angular's 4200, and the next few they move on to when one is taken: `1234`, `1313`, `3000`–`3010`, `4000`–`4010`, `4173`–`4180`, `4200`–`4210`, `4321`–`4330`, `5000`–`5010`, `5173`–`5199`, `5500`–`5510`, `6006`–`6010`, `8000`–`8010`, `8080`–`8090`, `8100`–`8110`, `8787`, `8888`–`8890`, `19006`. Pages on a test domain, `*.test`, on any port, count too.
- **Websites**: a page with a domain name (including `*.local` on a local network) is licensed by its domain, and counts only when the domains of the license key cover it. `acme.com` includes `www.acme.com`; `*.acme.com` is every subdomain. Which domain a page counts as is that of its origin: an `<iframe srcdoc>`, `about:blank` or `blob:` page counts as the website that made it. A website that gives an `appId` is still counted by its domain only.
- **Pages without a domain name** are licensed by the app's id: pages opened from a file (`file:`, as in a desktop app), on the app's own scheme (as `capacitor://localhost` in an iOS app, or a scheme registered by a desktop app such as one built on CEF), sandboxed iframes and `data:` pages, and **pages on your own computer on any other port**: an app's own server, such as an Android hybrid app's `https://localhost`, a Tauri app's `http://tauri.localhost` on Windows, or a port an Electron app opens on the computer. They count when an `appId` is given and the license key's apps include it. An `appId` is a reverse domain name (a part starting with a letter, then more parts separated by `.`, made of letters, digits, `-` and `_`, regardless of case); `createProChart()` throws right away when it is not.

One license key can have both domains and app ids.

## A production website needs HTTPS

Browsers give `crypto.subtle`, which checks the signature, only on secure pages (HTTPS and `localhost`). Opened over http or by a local network IP, a license key cannot be checked even when it is valid, and the chart shows the watermark. Pages in an app need `crypto.subtle` too (WebView and CEF usually have it).

## Update period

A license key carries an **updates-until date**, which is not an expiry date: versions released on or before that day work with the license key forever; versions released after it are not covered, and upgrading to them takes a renewal and a new license key. What is compared is the release date of the code, not the clock of the visitor's computer.

## When the check fails, look at the console

When the license key does not cover the page, the browser console says why, once for each domain or app and each component, starting with `Kumo Charts Commercial:`: the domain is not the right one, the app id is missing or does not match, the version was released after the update period, the license key was altered, or the page is not on HTTPS.
