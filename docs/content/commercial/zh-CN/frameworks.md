# Vue 和 React

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { KumoProChart } from '@kumo-charts/pro-chart/vue';

const symbol = ref('600519.SH');
const theme = ref<'light' | 'dark'>('light');
</script>

<template>
  <div style="height: 600px">
    <KumoProChart
      :options="{ datafeed, upColor: 'red', theme }"
      v-model:symbol="symbol"
      @indicators-change="save"
      @button-click="({ id }) => id === 'trade' && openTicket()"
      @created="(c) => (chart = c)"
    />
  </div>
</template>
```

```tsx
import { KumoProChart } from '@kumo-charts/pro-chart/react';

const options = useMemo(() => ({ datafeed, upColor: 'red', theme }), [theme]);

<div style={{ height: 600 }}>
  <KumoProChart
    options={options}
    symbol={symbol}
    onSymbolChange={(event) => setSymbol(event.symbol)}
    onIndicatorsChange={save}
    onCreated={setChart}
  />
</div>;
```

- 组件叫 `KumoProChart`，和开源版的 `KumoChart` 对应；`createProChart()` 返回的图表对象类型是 `ProChart`。
- `options` 里 `applyOptions()` 能改的（主题、语言、颜色、界面文字、功能开关、按钮和菜单、自选列表、画线栏……）跟着变：传一个新对象（Vue 里改响应式对象的某个键也算），变了的那些就用 `applyOptions()` 改上，去掉的回到默认；`features`、`messages`、`themes` 和 `applyOptions()` 一样按键合并。`datafeed`、`storage`、`customIndicators` 这类只在挂载时读一次。React 里用 `useMemo` 之类让对象在没变时保持同一个，别每次渲染都新建。其他操作通过 `created` 交出的图表对象。
- `symbol`、`timeframe` 可以作为属性绑定：属性变了图表跟着变。绑定了 `symbol`、`timeframe` 时由页面决定，打开时也用它，不恢复用户上次看的；Vue 里用 `v-model:symbol`、`v-model:timeframe` 双向绑定，React 里配合 `onSymbolChange`、`onTimeframeChange`。绑定了 `symbol` 时 `options` 里可以不写。
- 页面给的图表不接受时（数据源找不到的品种、没提供的周期、写错的选项等），图表保持原样，Vue 里的 `@prop-error`、React 里的 `onPropError` 收到 `{ prop, value, error }`：`prop` 是 `symbol`、`timeframe` 或 `options`，`value` 是页面给的值（`options` 时是变了的那些选项），`error` 是对应的方法（`setSymbol()`、`setTimeframe()`、`applyOptions()`）拒绝的错误。没有监听时，错误作为没人处理的 Promise 拒绝抛出，浏览器控制台里看得到。组件卸载时还没轮到的属性不报。
- 每个事件都能直接监听：Vue 里是 `@symbol-change`、`@indicators-change`、`@crosshair-move`……，React 里是 `onSymbolChange`、`onIndicatorsChange`、`onCrosshairMove`……，总是调用最新一次渲染给的函数。`created`（React 里是 `onCreated`）在组件挂载时交出图表对象，不等第一张图建好；`ready` 和其他事件一样，在第一张图建好时发出。
- React 支持 18 和 19，包括 StrictMode。
