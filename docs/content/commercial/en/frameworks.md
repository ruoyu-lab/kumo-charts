# Vue and React

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

- The component is `KumoProChart`, the counterpart of the open-source `KumoChart`; the chart object `createProChart()` returns is of the type `ProChart`.
- What `applyOptions()` can change in `options` (the theme, the language, colors, texts of the interface, feature toggles, buttons and menus, the watchlist, the drawing toolbar, …) follows along: pass a new object (in Vue, changing a key of a reactive object counts too), and what changed is applied with `applyOptions()`, while what was taken out goes back to the default; `features`, `messages` and `themes` are merged key by key as with `applyOptions()`. Options such as `datafeed`, `storage` and `customIndicators` are read only once, when mounting. In React, keep the object the same while it has not changed, with `useMemo` or the like, rather than making a new one on every render. Everything else goes through the chart object handed over by `created`.
- `symbol` and `timeframe` can be bound as props: when a prop changes, the chart follows. Bound, `symbol` and `timeframe` are decided by the page, on opening too, rather than restoring what the user looked at last; Vue binds them both ways with `v-model:symbol` and `v-model:timeframe`, and React pairs them with `onSymbolChange` and `onTimeframeChange`. With `symbol` bound, `options` can leave it out.
- When the chart does not accept what the page gives (a symbol the datafeed cannot find, a timeframe not offered, a wrong option, …), it stays as it was, and `@prop-error` in Vue and `onPropError` in React receive `{ prop, value, error }`: `prop` is `symbol`, `timeframe` or `options`, `value` the value the page gave (for `options`, the options that changed), and `error` the error of the method that rejected it (`setSymbol()`, `setTimeframe()`, `applyOptions()`). Without a listener, the error is thrown as an unhandled Promise rejection, seen in the browser console. Props whose turn had not come yet when the component unmounts are not reported.
- Every event can be listened to directly: in Vue `@symbol-change`, `@indicators-change`, `@crosshair-move`, …, in React `onSymbolChange`, `onIndicatorsChange`, `onCrosshairMove`, …, always calling the function given by the latest render. `created` (`onCreated` in React) hands over the chart object when the component mounts, without waiting for the first chart to be made; `ready`, like other events, is emitted once the first chart is made.
- React 18 and 19 are supported, StrictMode included.
