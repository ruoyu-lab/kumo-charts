# 사용자 정의 그리기 도구

<!-- code-prelude
declare const priceZone: import('@kumo-charts/core/drawings').DrawingTypeDefinition;
declare const zoneId: string;
-->

직접 만든 그리기 도구도 내장 도구와 똑같이 동작합니다. 사용자가 그리고, 드래그하고, 선택하고, 실행 취소할 수 있으며, 레이아웃에 저장되고 알림으로 감시할 수도 있습니다.

그리기 유형은 차트에 세 가지를 알려 줘야 합니다. 앵커가 몇 개인지, 어떻게 그리는지(`paint`), 마우스가 어디에 있을 때 이것을 클릭한 것으로 볼지(`hitTest`)입니다. 아래에서는 '가격대 밴드'를 만듭니다. 앵커 두 개로 위아래 가격선 두 개를 정하고, 이 선들은 첫 번째 앵커에서 차트 오른쪽 끝까지 이어집니다.

```ts live height=400
import { createChart, withAlpha } from '@kumo-charts/core';
import {
  drawings,
  type Anchors,
  type DrawingTypeDefinition,
  type Positions
} from '@kumo-charts/core/drawings';
import { loadBars } from '@docs/data';

const priceZone: DrawingTypeDefinition<Anchors<2>> = {
  type: 'price-zone',
  points: 2,
  // 설정 패널에서 바꿀 수 있는 스타일
  fields: ['color', 'fillColor', 'lineWidth', 'lineStyle'],
  defaultStyle: (theme) => ({ color: theme.accent, fillColor: withAlpha(theme.accent, 0.12) }),

  paint: ({ ctx, geometry, selected }) => {
    const { box } = zone(geometry.points);
    const { style, width } = geometry;
    ctx.fillStyle = style.fillColor;
    ctx.fillRect(box.left, box.top, width - box.left, box.bottom - box.top);
    ctx.strokeStyle = style.color;
    ctx.lineWidth = selected ? style.lineWidth + 1 : style.lineWidth;
    ctx.beginPath();
    ctx.moveTo(box.left, box.top);
    ctx.lineTo(width, box.top);
    ctx.moveTo(box.left, box.bottom);
    ctx.lineTo(width, box.bottom);
    ctx.stroke();
  },

  hitTest: (geometry, point, tolerance) => {
    const { box } = zone(geometry.points);
    if (point.x < box.left - tolerance) return null;
    const edge = Math.min(Math.abs(point.y - box.top), Math.abs(point.y - box.bottom));
    if (edge <= tolerance) return { part: 'line', distance: edge };
    return null;
  }
};

/** 두 앵커가 둘러싼 범위, 픽셀 좌표 */
function zone([a, b]: Positions<Anchors<2>>) {
  return {
    box: { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y) }
  };
}

const chart = createChart(document.getElementById('chart')!, {
  modules: [drawings([priceZone])]
});

chart.data.set(await loadBars(), { interval: '1m' });
chart.data.setTimeframe('1h');
chart.drawings.startTool('price-zone'); // 차트를 두 번 클릭해 보세요
```

## 좌표

`paint`와 `hitTest`가 받는 `geometry`에는 다음이 들어 있습니다.

- `points`: 앵커의 픽셀 좌표. 창의 플롯 영역 왼쪽 위를 기준으로 하며, 놓은 순서대로입니다.
- `anchors`: 앵커의 시간과 가격.
- `width`, `height`: 플롯 영역의 크기.
- `style`: 이 그리기의 최종 스타일(기본값 위에 자체 스타일을 더한 것).
- `valueToY`, `yToValue`, `timeToX`: 가격·시간과 픽셀 사이의 변환. 추가로 선을 그릴 때 씁니다.
- `bars`: 표시되는 봉. 예를 들어 앵커 이후의 최고가를 찾을 때 씁니다.
- `formatValue`: 가격을 축의 형식대로 표시. 라벨을 그릴 때 씁니다.
- `theme`, `textFont`, `measureText`: 텍스트를 그릴 때 씁니다.

`DrawingTypeDefinition<Anchors<2>>`처럼 앵커 수로 타입을 쓰면 `points`와 `anchors`는 정확히 두 개짜리가 되어, 있는지 확인하지 않고 꺼내 쓸 수 있습니다. 차트는 `points`와 같은 수의 앵커를 넘겨 줍니다.

`paint`의 `ctx`는 이미 플롯 영역으로 잘려 있고 좌표도 옮겨져 있으므로 CSS 픽셀 단위로 바로 그리면 됩니다. 고해상도 화면의 배율은 차트가 처리합니다. `hovered`, `selected`는 마우스가 그 위에 있는지, 선택되었는지를 알려 주므로 이때 더 눈에 띄게 그릴 수 있습니다. 점선은 드로잉의 선 스타일대로 그립니다. `dashPattern(style.lineStyle, style.lineWidth)`(`@kumo-charts/core`에서 가져옴)를 쓰면 기본 드로잉과 같은 점선이 됩니다.

## 클릭 판정

`hitTest`가 `null`을 반환하면 클릭되지 않은 것이고, 클릭되었으면 `part`와 거리를 반환합니다. `line`은 선 위, `body`는 글자, 레이블 상자, 채워서 그린 마크 같은 그리기의 내용입니다. 채우기 부분에서는 클릭된 것으로 반환하지 마세요. 채우기는 그리기의 배경이라서, 거기를 클릭하면 그 아래에 있는 것이 클릭되고 드래그하면 차트가 이동합니다. 그리기는 차트에 기본으로 있는 그리기처럼 선을 클릭해서 선택합니다. 그리기끼리, 또는 주문선이나 알림선과 겹쳐 있을 때는 선 위를 클릭한 것이 내용을 클릭한 것보다 우선합니다. 똑같이 선 위(또는 내용)를 클릭한 것 중에서는 가까운 것이, 거리가 같으면 위에 있는 것(나중에 그린 것)이 우선합니다. `tolerance`는 차트의 `interaction.hitTolerance`이며 기본값은 6픽셀입니다.

핸들(드래그해서 모양을 바꾸는 작은 점)은 차트가 처리합니다. 기본적으로 앵커마다 하나씩 있고, 드래그하면 그 앵커가 움직입니다. 다른 핸들이 필요하면 `handles()`와 `moveHandle()`을 작성합니다. `moveHandle()`의 네 번째 인자 `space`는 시간과 가격을 그리기에 쓰는 위치(봉 번호, 축 눈금상의 값)로 바꿔 줍니다. 이 공간에서 계산하면 로그 축에서도, 봉 사이에 공백이 있어도 핸들이 정확히 포인터 아래에 놓입니다. `unitHeight`는 눈금의 한 단위가 화면에서 봉 몇 개 너비만큼의 높이인지를 나타내며, 이것으로 계산하면 각도와 길이가 화면에 보이는 그대로입니다. 다섯 번째 인자는 그 그리기의 스타일입니다. 핸들의 `id`가 앵커 번호(`'0'`, `'1'`, …)라면 `moveHandle()`을 생략할 수 있고, 드래그하면 그 앵커가 움직입니다. `id`가 앵커 번호가 아닌데 `moveHandle()`이 없으면 핸들이 표시되는 즉시 오류가 납니다.

## 추가 옵션

| 옵션                  | 역할                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `points: 0`           | 앵커 수가 정해져 있지 않음, 더블클릭이나 Enter로 끝냄, 예: 경로                                                                                                                                   |
| `freehand`            | 누른 채 드래그해서 그림, 예: 브러시(`points: 0`과 함께 사용)                                                                                                                                      |
| `place`, `complete()` | 사용자는 앞의 몇 개 앵커만 놓고 나머지는 직접 계산, 예: 목표가를 대칭으로 뒤집어 손절가 계산. `complete()`는 `points`개의 앵커를 돌려줘야 하며, 그렇지 않으면 그 클릭으로는 놓이지 않고 오류가 남 |
| `mainPane`            | 메인 창의 봉으로 계산함(`geometry.bars`를 읽는 등). 메인 창에만 놓을 수 있음                                                                                                                      |
| `paintBelow()`        | 봉 아래에 그리는 부분, 예: 포지션의 손익 영역                                                                                                                                                     |
| `editableText`        | 놓은 직후와 더블클릭할 때 텍스트 편집 상자를 엶                                                                                                                                                   |
| `axisMarks()`         | 선택되었을 때 축에서 강조할 가격과 시간. 두 번째 인자는 스타일                                                                                                                                    |
| `bounds()`            | 그리기가 차지하는 범위(앵커 밖으로 뻗은 선과 라벨 포함), `chart.drawings.bounds()`가 이것을 반환. 아무것도 그리지 않으면 `null`이고, 사용자도 거기에는 놓을 수 없음. 생략하면 핸들을 둘러싼 범위  |
| `levels()`            | 알림이 감시할 수 있는 선                                                                                                                                                                          |

`bounds()`를 쓴 그리기는 그 범위가 화면 밖에 완전히 있으면 그려지지 않고, 포인터가 근처에 없으면 클릭 판정도 하지 않습니다. 그래서 `bounds()`는 그리는 것과 클릭될 수 있는 것을 모두 담아야 합니다. 쓰지 않은 그리기는 항상 그리고 판정합니다.

## 알림으로 감시할 수 있게 하기

```ts no-check
levels: ([a, b]) => {
  const top = Math.max(a.price, b.price);
  const bottom = Math.min(a.price, b.price);
  const time = Math.min(a.time, b.time);
  return [
    // 두 점의 시간이 같으면 수평선 하나, extend: 'end'는 오른쪽 끝까지 연장
    { key: 'top', from: { time, price: top }, to: { time, price: top }, extend: 'end' },
    { key: 'bottom', from: { time, price: bottom }, to: { time, price: bottom }, extend: 'end' }
  ];
};
```

그러면 '가격이 이 가격대 밴드에 진입'하는 알림을 설정할 수 있습니다.

```ts
chart.alerts.add({
  id: 'zone',
  trigger: 'enter-channel',
  value: [
    { kind: 'drawing', id: zoneId, level: 'top' },
    { kind: 'drawing', id: zoneId, level: 'bottom' }
  ]
});
```

## 사용하기

```ts
import { drawings, allDrawings } from '@kumo-charts/core/drawings';

createChart(container, { modules: [drawings([...allDrawings, priceZone])] });

// 또는 차트를 만든 뒤에
chart.drawings.register(priceZone);
```

새 버전의 정의로 바꾸려면(페이지가 이 드로잉을 그리는 방식을 바꾼 경우 등) `replace()`를 씁니다. 차트에 있는 이 종류의 드로잉은 남고 새 정의대로 다시 그려집니다. 이 도구를 쓰는 중이었다면 취소됩니다. 앵커 수가 바뀌면 먼저 차트에서 이 종류의 드로잉을 지워야 바꿀 수 있습니다. 더 이상 필요 없으면 `unregister()`로 제거합니다(차트에 이 종류의 드로잉이 있으면 오류가 납니다).

드로잉 밖의 데이터(페이지가 드로잉마다 계산한 값 등)를 읽어서 그린다면, 데이터가 바뀔 때 `refresh()`를 불러 다시 그리게 합니다. 차트는 데이터가 바뀐 것을 스스로 알 수 없습니다.

```ts
chart.drawings.replace({ ...priceZone, fields: ['color', 'fill', 'fillColor'] });
chart.drawings.refresh();
```

스타일을 차트가 받아들이는지 미리 확인하려면(사용자가 입력했거나 다른 곳에 저장해 둔 스타일 등) `checkDrawingStyle()`을 씁니다. 받아들일 수 없으면 무엇이 잘못됐는지 알려 주는 오류가 납니다.

```ts
import { checkDrawingStyle } from '@kumo-charts/core/drawings';

checkDrawingStyle({ lineWidth: 2, levelRange: { start: 0, end: -1 } });
```
