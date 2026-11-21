# 사용자 지표

지표의 알고리즘에는 차트 라이브러리의 지표 정의(`chart.indicators.register()`와 같은 것)를 씁니다. 프로 차트는 그것을 모든 차트(나중에 새로 만드는 차트 포함)에 등록하고 지표 창에 나열하며, 사용자는 기본 제공 지표처럼 추가하고 파라미터와 선을 바꿀 수 있고, 상태에도 저장됩니다:

```ts
import type { CustomIndicator } from '@kumo-charts/pro-chart';

const MID: CustomIndicator = {
  name: { en: 'Mid price', zh: '中间价', ja: '中値', ko: '중간가' }, // 코드 뒤에 나오는 이름. en은 필수
  group: 'trend', // 어느 그룹에 나열할지: trend, bands, oscillators, volume, volatility, other(기본값). plugins는 맨 끝의 따로 떨어진 "플러그인" 그룹
  // origin: { en: 'My plugin', zh: '我的插件' }, // 대화 상자에서 이름 옆에 출처를 씁니다. 예를 들어 제공하는 플러그인
  definition: {
    type: 'MID', // 코드. 지표 창과 범례에 표시되며, 기본 제공 지표와 같은 이름일 수 없음
    name: 'MID',
    pane: 'main', // 메인 창에 겹쳐 그림. 'new'는 따로 보조 창
    precision: 'price',
    params: { period: { default: 5, min: 1, max: 200, integer: true, label: 'Period' } },
    outputs: () => [{ key: 'mid', label: 'MID', plot: { kind: 'line' } }],
    lookback: ({ period }) => period as number,
    // bars는 최근 lookback개의 봉이며, 오래된 것부터.
    compute: (bars) => {
      let sum = 0;

      for (let index = 0; index < bars.length; index += 1) {
        sum += (bars.bar(index).high + bars.bar(index).low) / 2;
      }

      return [sum / bars.length];
    }
  }
};

const chart = createProChart(container, { datafeed, symbol: 'BTCUSDT', customIndicators: [MID] });
chart.addIndicator('MID', { params: { period: 10 } });
```

지표 정의를 나중에야 얻는다면 `chart.registerIndicator(MID)`로 등록합니다. 사용자가 저장한 사용자 지표는 등록하면 표시되고, `customIndicators`에 넣어 두면 열자마자 표시됩니다. 코드는 기본 제공 지표와 같은 이름일 수 없습니다. 페이지의 일부가 꺼질 때(예를 들어 지표를 제공하는 플러그인)는 `chart.unregisterIndicator('MID')`로 내립니다. 지표 대화 상자에 더 이상 나오지 않고, 차트의 그 지표는 그려지지 않으며 그것을 읽는 알림도 멈추지만, 차트 상태에는 남고 파라미터도 잃지 않으며, 다시 등록하면 그대로 그려집니다.

## 수식으로 쓰기

알고리즘을 쓰고 싶지 않다면 중국 시세 소프트웨어의 수식을 쓸 수 있습니다. `definition` 대신 `formula`를 써서, 예를 들어 `{ formula: { type: 'MYMACD', name: 'MYMACD', formula: 'DIF:EMA(C,12)-EMA(C,26); …' } }`처럼 씁니다. 문법, 함수, 옵션은 [수식](formula.md)을 참고하세요.
