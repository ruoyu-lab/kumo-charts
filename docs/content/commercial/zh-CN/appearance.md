# 颜色和字体

`upColor`、`accentColor` 够用时用它们就行。要和网站配色一致，用 `themes` 给每个主题改颜色：`tokens` 是界面的设计变量（CSS 自定义属性，不带 `--`），`chart` 是图本身的颜色（图表库的 `Theme`）。

```ts
createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  theme: 'dark',
  fontFamily: '"HarmonyOS Sans", system-ui, sans-serif',
  themes: {
    dark: {
      tokens: {
        'app-bg': '#0b0e11',
        panel: '#161a1e',
        border: '#2b3139',
        accent: '#f0b90b',
        'accent-text': '#0b0e11'
      },
      chart: { background: '#161a1e', up: '#0ecb81', down: '#f6465d' }
    }
  }
});
```

主要的设计变量：`app-bg`（最外面的底色）、`panel`（顶栏、画线栏的底色）、`panel-raised`（菜单、窗口）、`border`（分隔线）、`text`、`muted`（次要文字）、`faint`（更淡的文字）、`accent`、`accent-strong`、`accent-text`（主色和主色上的文字）、`up`、`down`（界面里的涨跌色）、`hover`、`selected-bg`、`selected-text`（悬停、选中）、`radius`（圆角）。全部在 `THEME_TOKENS` 里。图的颜色：`background`、`grid`、`text`、`up`、`down`、`volumeUp`、`volumeDown`、`accent`、`crosshair`、`palette`（指标线依次用的颜色）等。

`upColor: 'red'` 先交换涨跌色，`themes` 里给的颜色再盖在上面。用户在图表设置里改的颜色（每张图的背景、网格、K 线颜色）优先。

## 用 CSS 改样式

图表在 Shadow DOM 里，网页的样式进不去，但这几个部分可以用 `::part()` 选中：`topbar`（顶栏）、`drawing-toolbar`（画线栏）、`chart-area`（所有图的区域）、`chart`（每张图）、`custom-button`（页面自己的按钮）。

```css
kumo-pro-chart::part(topbar) {
  border-bottom-width: 2px;
}

kumo-pro-chart::part(custom-button) {
  font-weight: 600;
}
```

`kumo-pro-chart` 元素本身（容器里的那个）可以直接加边框、圆角等。颜色用 `themes` 改，不用 CSS：它也会改图本身的颜色，切换主题时跟着换。
