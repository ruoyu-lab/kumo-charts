# 주문선과 체결 표시

<!-- code-prelude
declare const order: { id: string };
declare const fill: { id: string; time: number; price: number };
declare const openOrders: import('@kumo-charts/core/trading').OrderInput[];
declare const entry: { time: number; price: number };
declare const exit: { time: number; price: number };
declare const exchange: {
  modifyOrder(id: string, price: number): Promise<void>;
  cancelOrder(id: string): void;
  setStopLoss(price: number): void;
};
-->

트레이딩 화면에서 자주 쓰는 두 가지입니다. 대기 중인 주문을 드래그할 수 있는 가격선으로 그리고, 봉 위에 매수·매도 체결을 표시합니다. 두 개의 모듈이며 모두 `@kumo-charts/core/trading`에 들어 있고, 그중 하나만 불러올 수도 있습니다.

```ts live height=360
import { createChart } from '@kumo-charts/core';
import { orders, markers } from '@kumo-charts/core/trading';
import { loadBars } from '@docs/data';

const chart = createChart(document.getElementById('chart')!, {
  modules: [orders(), markers()]
});

chart.data.set(await loadBars(), { interval: '1m' });
chart.data.setTimeframe('15m');

const bars = chart.data.toArray();
const last = bars.at(-1)!;
chart.orders.add({
  id: 'o1',
  side: 'buy',
  price: last.close * 0.99,
  label: { text: 'LIMIT', quantity: 0.5 }
});
chart.orders.add({
  id: 'o2',
  side: 'sell',
  price: last.close * 1.015,
  label: { text: 'TP', quantity: 0.5 }
});

const entry = bars.at(-40)!;
chart.markers.add({
  id: 'f1',
  time: entry.time,
  position: 'below',
  shape: 'arrow-up',
  text: '매수'
});
```

## 주문선

```ts
import { orders } from '@kumo-charts/core/trading';

createChart(container, { modules: [orders()] });

chart.orders.add({
  id: order.id, // 보통 거래소나 증권사의 주문 번호
  side: 'buy', // 'buy' 또는 'sell'. 기본 색을 결정합니다
  price: 95000,
  label: {
    text: 'LIMIT', // 라벨 글자. 기본값은 BUY / SELL
    quantity: 0.25 // 라벨 뒤에 표시
  }
});

chart.orders.update(order.id, { price: 94800 });
chart.orders.remove(order.id);
chart.orders.set(openOrders); // 최신 미체결 주문으로 한꺼번에 교체
```

`id`를 생략하면 차트가 `order-1`부터 번호를 매기고 `add()`가 그 id를 반환합니다. `clear()`는 모든 주문을 제거합니다.

선이 플롯 위나 아래에 있으면 라벨이 화살표와 함께 위쪽 또는 아래쪽 가장자리에 고정되고, 여러 선의 라벨은 선의 순서대로 쌓입니다. 라벨을 클릭하면 그 선이 보이는 범위로 옵니다. 끌 수 있는 선이면 라벨을 끄는 것이 선 자체를 끄는 것과 같습니다. 알림의 선도 같습니다. `priceScale.pinLabels: false`로 두면 라벨이 선과 함께 화면 밖에 있습니다.

라벨은 기본적으로 플롯 오른쪽에 있습니다. `label.position`은 선 위 라벨의 위치로, 0(왼쪽 끝)부터 1(오른쪽 끝, 기본값)까지이며 `0.5`는 가운데입니다. 위아래로 비켜 두는 것은 좌우 위치가 겹치는 라벨끼리만입니다. `label.draggable: true`로 두면 사용자가 라벨을 선을 따라 좌우로 드래그할 수 있습니다. 라벨은 포인터를 따라가고 놓은 자리에 머무르며, 단계별로 `orderLabelDrag`(`{ id, phase, position, initialPosition }`)가 발생합니다. `position`을 저장해 두었다가 다음 `orders.set()`에 넘기세요. 선 자체도 드래그할 수 있으면, 라벨에서 가로로 드래그하면 라벨이, 세로로 드래그하면 선이 움직입니다. `showOnAxis: false`로 두면 가격 축에 그 선의 가격을 표시하지 않습니다. 라벨에 가격을 적어 둘 때 씁니다. `tooltip`은 선이나 라벨에 포인터를 잠시 올려 두면 나오는 안내 문구로, 라벨에 없는 청산 가격 같은 것을 보여 줍니다.

주문 상태는 거래소가 기준입니다. 가장 간단한 방법은 미체결 주문에 변화가 생길 때마다 `set()`으로 전체 미체결 주문을 다시 설정하는 것입니다.

### 드래그해서 주문 수정

사용자는 주문선을 위아래로 드래그할 수 있습니다. 드래그하는 동안 선이 따라 움직이고, 손을 떼면 새 가격에 머무르며, 단계별로 `orderDrag`가 발생합니다:

```ts
chart.on('orderDrag', async ({ id, phase, price, initialPrice }) => {
  if (phase !== 'end') return;

  try {
    await exchange.modifyOrder(id, price);
  } catch {
    chart.orders.update(id, { price: initialPrice }); // 주문 수정에 실패하면 원래 가격으로 되돌립니다
  }
});
```

드래그 중에 Esc를 누르면 취소되어 선이 원래 자리로 돌아가고, `phase: 'cancel'`이 발생합니다. 어떤 주문을 드래그하지 못하게 하려면 `draggable: false`를 설정하세요.

### 선에서 가격 끌어내기

`pull: true`인 선은 드래그해도 움직이지 않습니다. 포지션 선에서 손절을 끌어내는 것과 같습니다. `orderDrag`는 단계마다 포인터 위치의 가격을 알려 주므로, 끌어낸 선은 앱이 그리고(이벤트에 맞춰 주문선을 놓는 식으로) 놓았을 때(`phase: 'end'`)의 가격으로 주문하거나 수정합니다.

```ts
chart.orders.add({
  id: 'position',
  side: 'buy',
  price: 95000,
  label: { text: 'LONG' },
  pull: true
});

chart.on('orderDrag', ({ id, phase, price }) => {
  if (id !== 'position') return;

  if (phase === 'move') {
    if (chart.orders.get('pulled')) chart.orders.update('pulled', { price });
    else chart.orders.add({ id: 'pulled', side: 'sell', price, label: { text: 'SL' } });
  } else if (chart.orders.get('pulled')) {
    chart.orders.remove('pulled');
    if (phase === 'end') exchange.setStopLoss(price);
  }
});
```

### 라벨의 버튼

```ts
chart.orders.add({
  id: order.id,
  side: 'sell',
  price: 98000,
  buttons: [{ id: 'cancel', text: '✕' }]
});

chart.on('buttonClick', ({ kind, id, buttonId }) => {
  if (kind === 'order' && buttonId === 'cancel') exchange.cancelOrder(id);
});
```

버튼은 글자(`text`)일 수도 있고, 아이콘(`icon`, 24 × 24 SVG 경로)일 수도 있습니다.

## 체결 표시

```ts
import { markers } from '@kumo-charts/core/trading';

createChart(container, { modules: [markers()] });

chart.markers.add({
  id: fill.id,
  time: fill.time, // 이 시간이 속한 봉에 표시
  position: 'below', // 'above'는 고가 위, 'below'는 저가 아래, 'price'는 특정 가격 위치
  shape: 'arrow-up',
  text: '매수 0.25'
});
```

모양은 `arrow-up`, `arrow-down`, `triangle-up`, `triangle-down`, `circle`, `square`가 있습니다. 색은 기본적으로 위를 향한 모양은 테마의 `buy`, 아래를 향한 모양은 `sell`, 원과 사각형은 글자 색을 씁니다. `color`로 직접 지정할 수도 있고, `size`로 크기를 바꿀 수 있습니다(기본값 8픽셀). `outline`을 지정하면 모양 둘레에 1픽셀 테두리(예: 검정)가 그려지고, 그 마커에 연결된 점선의 양옆에도 그려져 봉 위에 겹쳐도 잘 보입니다.

특정 가격에 표시하기:

```ts
chart.markers.add({
  id: 'f2',
  time: fill.time,
  position: 'price',
  price: fill.price,
  shape: 'circle'
});
```

마찬가지로 `update()`, `remove()`, `set()`, `clear()`, `list()`, `get()`이 있습니다. `id`를 생략하면 `marker-1`부터 번호를 매깁니다.

### 진입과 청산 잇기

`link`에 다른 마커의 `id`를 쓰면 둘 사이에 점선이 그려지고, 색은 연결된 쪽 마커의 색입니다. 한 번의 거래를 진입부터 청산까지 잇는 식입니다:

```ts
chart.markers.set([
  { id: 'in', time: entry.time, position: 'price', price: entry.price, shape: 'arrow-up' },
  {
    id: 'out',
    time: exit.time,
    position: 'price',
    price: exit.price,
    shape: 'arrow-down',
    link: 'in'
  }
]);
```

두 마커가 모두 데이터 안에 있을 때만 그려집니다. 한쪽이 화면 밖으로 스크롤되어도 그 봉까지 선이 이어집니다.

마지막 봉보다 늦고 그 봉의 주기도 지난 표시는 그 시각의 봉이 올 때까지 그리지 않고, 봉이 오면 그 위에 그립니다. 렌코처럼 시간을 따르지 않는 봉에서는 마지막 봉보다 늦은 표시를 모두 마지막 봉에 그립니다. 보이는 표시만 처리하므로 백테스트 체결이 수만 개여도 스크롤과 확대·축소가 느려지지 않습니다.

## 선택

주문선과 체결 표시는 모두 클릭해서 선택할 수 있습니다. 선택되면 `selectionChange`가 발생하며, `selection.kind`는 `'order'` 또는 `'marker'`입니다. [조작](interaction.md#객체-선택)을 참고하세요.

주문과 체결 표시는 `saveState()`에 들어가지 않습니다. 이들은 여러분의 거래 데이터이므로 매번 거래소에서 받아 옵니다.
