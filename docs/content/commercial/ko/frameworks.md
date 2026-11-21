# Vue와 React

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

- 컴포넌트 이름은 `KumoProChart`이며, 오픈 소스 버전의 `KumoChart`에 대응합니다. `createProChart()`가 돌려주는 차트 객체의 타입은 `ProChart`입니다.
- `options` 가운데 `applyOptions()`로 바꿀 수 있는 것(테마, 언어, 색, 화면 문구, 기능 토글, 버튼과 메뉴, 관심 종목 목록, 그리기 도구 모음……)은 따라 바뀝니다. 새 객체를 넘기면(Vue에서는 반응형 객체의 키를 바꿔도 마찬가지) 바뀐 것을 `applyOptions()`로 반영하고, 뺀 것은 기본값으로 돌아갑니다. `features`, `messages`, `themes`는 `applyOptions()`처럼 키별로 합칩니다. `datafeed`, `storage`, `customIndicators` 같은 것은 마운트할 때 한 번만 읽습니다. React에서는 `useMemo` 등으로 바뀌지 않았을 때 객체를 같은 것으로 유지하고, 렌더링할 때마다 새로 만들지 마세요. 그 밖의 조작은 `created`가 넘겨주는 차트 객체로 합니다.
- `symbol`, `timeframe`은 속성으로 바인딩할 수 있습니다. 속성이 바뀌면 차트도 따라 바뀝니다. `symbol`, `timeframe`을 바인딩하면 페이지가 정하며, 열 때도 그 값을 쓰고 사용자가 마지막으로 본 것을 복원하지 않습니다. Vue에서는 `v-model:symbol`, `v-model:timeframe`으로 양방향 바인딩하고, React에서는 `onSymbolChange`, `onTimeframeChange`와 함께 씁니다. `symbol`을 바인딩했다면 `options`에는 쓰지 않아도 됩니다.
- 페이지가 준 것을 차트가 받아들이지 않으면(데이터 피드에서 찾을 수 없는 종목, 제공하지 않는 주기, 잘못 쓴 옵션 등) 차트는 그대로이고, Vue의 `@prop-error`, React의 `onPropError`가 `{ prop, value, error }`를 받습니다. `prop`은 `symbol`, `timeframe`, `options` 중 하나, `value`는 페이지가 준 값(`options`일 때는 바뀐 옵션들), `error`는 해당 메서드(`setSymbol()`, `setTimeframe()`, `applyOptions()`)가 거부한 오류입니다. 리스너가 없으면 오류는 아무도 처리하지 않은 Promise 거부로 던져지며, 브라우저 콘솔에서 볼 수 있습니다. 컴포넌트가 언마운트될 때 아직 차례가 오지 않은 속성은 알리지 않습니다.
- 모든 이벤트를 바로 들을 수 있습니다. Vue에서는 `@symbol-change`, `@indicators-change`, `@crosshair-move`……, React에서는 `onSymbolChange`, `onIndicatorsChange`, `onCrosshairMove`……이며, 늘 가장 최근 렌더링이 준 함수를 호출합니다. `created`(React에서는 `onCreated`)는 컴포넌트가 마운트될 때 차트 객체를 넘겨주며, 첫 차트가 만들어지기를 기다리지 않습니다. `ready`는 다른 이벤트처럼 첫 차트가 만들어지면 내보냅니다.
- React는 18과 19를 지원하며, StrictMode도 포함합니다.
