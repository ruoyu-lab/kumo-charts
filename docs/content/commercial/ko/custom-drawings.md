# 사용자 그리기 도구

그리기 도구가 그리는 방식에는 차트 라이브러리의 그리기 정의(`chart.drawings.register()`와 같은 것. 차트 라이브러리의 "사용자 정의 그리기 도구" 참고)를 씁니다. 프로 차트는 그것을 모든 차트(나중에 새로 만드는 차트 포함)에 등록해 그리기 바에 넣으며, 사용자는 기본 제공 도구처럼 그리고, 선택하고, 끌고, 스타일을 바꾸고, 알림을 걸 수 있고, 상태에도 저장됩니다:

```ts
import { DRAWING_GROUP_IDS, type CustomDrawing } from '@kumo-charts/pro-chart';
import { fibRetracement } from '@kumo-charts/core/drawings';

const RULER: CustomDrawing = {
  name: { en: 'R ruler', zh: 'R 尺', ja: 'R 定規', ko: 'R 자' }, // 그리기 바와 메뉴에 나오는 이름. en은 필수
  icon: 'M5 19L19 5M5 19h4M19 5v4', // 24×24 격자 위의 SVG 경로로, 기본 제공 아이콘처럼 선으로 그림. 기본 제공 아이콘의 이름이어도 됨
  group: 'fibonacci', // 어느 그룹에 넣을지. DRAWING_GROUP_IDS 중 하나
  after: 'fib-retracement', // 이 도구 뒤에 둠. 주지 않으면 그룹의 맨 끝
  definition: { ...fibRetracement, type: 'r-ruler' } // 유형은 기본 제공 도구나 페이지의 다른 도구와 같은 이름일 수 없음
};

const chart = createProChart(container, { datafeed, symbol: 'BTCUSDT', customDrawings: [RULER] });
```

도구 정의를 나중에야 얻는다면 `chart.registerDrawing(RULER)`로 등록합니다. 페이지의 일부가 꺼질 때(예를 들어 도구를 제공하는 플러그인)는 `chart.unregisterDrawing('r-ruler')`로 내립니다. 그리기 바에서 없어지고, 차트의 그 그리기는 그려지지 않으며 그 알림도 멈추지만, 차트 상태에는 순서도 그대로 남고, 다시 등록하면 그대로 그려집니다. 사용자가 즐겨찾기에 넣은 페이지의 도구는 내려가 있는 동안 즐겨찾는 그리기 도구에 표시되지 않고, 다시 등록하면 다시 표시됩니다.
