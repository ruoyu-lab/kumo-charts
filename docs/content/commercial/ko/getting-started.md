# 빠른 시작

npm으로 설치합니다.

```bash
npm install @kumo-charts/pro-chart
```

내 컴퓨터의 개발 서버에서는 라이선스 키가 필요 없고, 실제 웹사이트나 앱에서는 필요합니다. ["라이선스"](license.md)를 참고하세요.

```ts
import { createProChart } from '@kumo-charts/pro-chart';

const chart = createProChart(document.getElementById('chart')!, {
  datafeed: myDatafeed, // 아래 "시세 데이터" 참고
  symbol: '600519.SH'
});
```

차트는 컨테이너를 가득 채우므로 컨테이너에 높이를 지정하세요. 차트는 자체 Shadow DOM 안에 있어서 페이지의 스타일이 차트에 영향을 주지 않고, 차트의 스타일도 페이지에 영향을 주지 않습니다. 한 페이지에 여러 개를 넣을 수 있습니다.

자주 쓰는 것을 몇 가지 더하면:

```ts
const chart = createProChart(container, {
  datafeed: myDatafeed,
  symbol: '600519.SH',
  upColor: 'red', // 상승은 빨강, 하락은 초록
  accentColor: '#c2410c', // 브랜드 색
  brand: { name: 'Acme 증권', logo: '/logo.svg', href: '/' },
  licenseKey: 'KCS1.…'
});

// 페이지 자체의 종목 목록, 버튼 등에서 메서드로 차트를 바꿉니다.
watchlist.on('select', (id) => chart.setSymbol(id));

// 알림이 울리면 페이지가 직접 푸시를 보냅니다.
chart.on('alert', (event) => {
  push(event.title, event.body); // 예: "알림" "구이저우마오타이 상향 교차 1,688.00"
});
```

그다음은 맞춤 설정입니다. 자체 버튼과 우클릭 메뉴(예: "주문") 추가, 자체 지표 등록, 웹사이트 색에 맞추기, 메서드로 지표·레이아웃·리플레이 조작, 차트 상태 전체를 자체 서버에 저장하기. 모두 뒤의 페이지에 있습니다.

## 일반 웹 페이지

Vue, React, 번들러를 쓰지 않는 페이지는 패키지에 들어 있는, 하나의 파일로 묶은 ES 모듈 `dist/browser/pro-chart.js`를 CDN에서 불러옵니다. 차트, Vue 런타임, 상업용 컴포넌트가 모두 들어 있어 어떤 프레임워크에도 의존하지 않으며, 압축하면 약 1.3MB, gzip으로 약 420KB입니다. 실제 사이트에서는 새 버전이 나와도 바뀌지 않도록 주소에 버전을 적습니다(`@kumo-charts/pro-chart@버전/…`).

```html
<div id="chart" style="height: 600px"></div>
<script type="module">
  import { createProChart } from 'https://cdn.jsdelivr.net/npm/@kumo-charts/pro-chart/dist/browser/pro-chart.js';

  createProChart(document.getElementById('chart'), { datafeed, symbol: 'BTCUSDT' });
</script>
```

차트는 자체 Shadow DOM 안에 있으므로 페이지에서 버튼, 테두리, 글자 크기를 바꾸는 스타일은 차트에 영향을 주지 않습니다. Vue와 React는 컴포넌트를 씁니다. ["Vue와 React"](frameworks.md)를 참고하세요.

## 포함되지 않는 것

주문 거래(증권 계좌 연결, 주문, 보유 포지션), 시세 데이터 자체, 관심 종목 목록 자체와 사이드 패널(페이지에는 보통 자체의 것이 있고, 관심 종목은 종목 검색의 별표에 연결할 수 있습니다), 사용자 계정과 백엔드. 주문 진입점은 [자체 버튼과 우클릭 메뉴](page-items.md)로 페이지 자체의 거래 화면에 연결할 수 있습니다.
