# 버튼, 메뉴와 관심 종목

## 자체 버튼

`buttons`는 페이지의 버튼을 차트 안에 넣으며, 모양은 기본 제공 버튼과 같습니다:

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  buttons: [
    // 상단 바 왼쪽, 기본 제공 도구 뒤.
    { id: 'trade', text: '주문', icon: 'plus', onClick: () => openOrderTicket() },
    // 상단 바 오른쪽, 메뉴 포함.
    {
      id: 'share',
      icon: 'more',
      text: '공유',
      placement: 'end',
      items: [
        { id: 'link', label: '링크 복사', onClick: copyLink },
        { type: 'separator' },
        { id: 'image', label: '이미지 저장', icon: 'camera', onClick: saveImage }
      ]
    },
    // 그리기 도구 모음 맨 아래. 아이콘만 표시하고, 텍스트는 툴팁.
    {
      id: 'ruler',
      icon: 'M4 18L18 4M7 15l2 2M11 11l2 2M15 7l2 2',
      text: '자',
      placement: 'drawings'
    }
  ]
});
```

| 필드        | 설명                                                                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | 필수. 버튼마다 다르며, `buttonClick` 이벤트에서 씁니다                                                                                                                             |
| `text`      | 버튼의 글자. 아이콘이 있으면 툴팁 문구이기도 합니다(좁을 때는 아이콘만 표시). 언어별로 `{ en, zh, ja, ko }`로 줄 수 있으며, `en`은 필수이고 주지 않은 언어에서는 `en`을 표시합니다 |
| `icon`      | 기본 제공 아이콘의 이름(`bell`, `star`, `camera`, `plus`, `more` 등), 또는 24×24 격자 위의 SVG 경로(기본 제공 아이콘처럼 선으로 그림)                                              |
| `placement` | `start`(기본값, 상단 바 왼쪽), `end`(상단 바 오른쪽, 레이아웃 버튼 앞), `drawings`(그리기 도구 모음 맨 아래, 아이콘 필수)                                                          |
| `active`    | 눌린 모양. 리플레이 중의 리플레이 버튼처럼                                                                                                                                         |
| `disabled`  | 누를 수 없음                                                                                                                                                                       |
| `items`     | 메뉴 항목. 버튼을 누르면 메뉴가 열립니다                                                                                                                                           |
| `onClick`   | 누를 때 호출합니다                                                                                                                                                                 |

누르면 먼저 `onClick`을 호출하고, 그다음 `buttonClick` 이벤트(`{ id, item }`)를 내보냅니다. Vue, React에서는 이벤트를 듣는 편이 더 편하며, 함수를 옵션에 쓰지 않아도 됩니다. 버튼의 상태를 바꾸려면(예: `active` 전환) `applyOptions({ buttons })`로 새 버튼 목록을 줍니다.

메뉴 항목: `id`, `label`(필수), `icon`, `checked`(체크 표시, `true` 또는 `false`), `disabled`, `danger`(삭제 같은 동작), `tone`(글자를 상승이나 하락 색으로: `up`, `down`. 매수와 매도 등), `field`(항목 안의 숫자 입력란. 예를 들어 수량: `value`, `step`(방향키 한 번에 더하고 빼는 양), `min`, `onChange`. 이 항목을 고르면 `onClick`은 평소대로 실행되며, 그 안에서 `onChange`가 기록한 값을 읽습니다. 글자와 입력란은 마우스 쪽으로 붙으므로, 메뉴가 마우스 오른쪽에 열리면 글자가 왼쪽에 옵니다), `items`(하위 메뉴), `onClick`. 구분선은 `{ type: 'separator' }`, 항목 묶음 위의 작은 제목(고를 수 없음)은 `{ type: 'heading', label }`으로 씁니다. 한 줄에 작은 버튼 여러 개는 `{ type: 'buttons', id, buttons, tone, caption, captionHint }`로 씁니다. `buttons`의 각 버튼에는 `id`, `label`, `disabled`, `hint`(포인터를 올렸을 때의 툴팁. 왜 누를 수 없는지 등), `caption`(포인터가 그 위에 있는 동안 이 줄의 글자 자리에 표시할 내용), `onClick`이 있으며, 어느 것을 눌러도 메뉴 항목 하나를 고른 것과 같습니다(메뉴가 닫히고, `contextMenuClick`이 그 `id`를 전함). `caption`은 이 줄의 글자(예: 수량)로 버튼의 반대쪽에 있으며(`field`가 있는 항목처럼 마우스 쪽으로 붙음), `captionHint`는 그 툴팁입니다. 골라도 되고 안 골라도 되는 선택지 줄은 `{ type: 'chips', id, options, value, onChange }`로 씁니다. `options`의 각 요소에는 `value`(문자열)와 `label`이 있고, `value`는 선택된 것(`null`이면 아무것도 선택 안 됨)입니다. 하나를 누르면 그것이 선택되고, 다시 누르면 아무것도 선택되지 않으며, `onChange`가 새 값을 받습니다. 메뉴는 닫히지 않고, 바로 `contextMenu`를 다시 호출해 새 메뉴 항목으로 바꾸므로, 다른 항목이 그것을 고른 뒤의 모습을 보여 줄 수 있습니다(메뉴의 숫자 입력란을 바꿨을 때도 마찬가지). 이 두 종류의 줄은 포인터로만 누를 수 있으며, 방향키는 건너뜁니다. 사용자는 차트 설정 "조작"의 "오른쪽 클릭 메뉴 편집"에서 차트 기본 제공 항목 일부의 체크를 해제할 수 있습니다(차트 설정 `hiddenMenu`에 저장). 페이지의 항목과 차트 설정 항목은 항상 표시됩니다.

## 우클릭 메뉴

`contextMenu`는 함수로, 차트에서 우클릭할 때마다 호출되며, 돌려준 메뉴 항목은 우클릭 메뉴 맨 위에 들어갑니다. 메뉴가 열려 있는 동안 함수가 읽은 Vue 반응형 데이터(예: 시세)가 바뀌면 다시 호출해 새 메뉴 항목으로 바꾸므로, 수량처럼 가격에 따라 바뀌는 숫자가 실시간으로 갱신됩니다. 읽는 것이 Vue 반응형 데이터가 아니면(React나 순수 JS 페이지 등) 데이터가 바뀔 때 `chart.refreshContextMenu()`를 호출하면, 열려 있는 메뉴가 메뉴 항목을 다시 가져옵니다. 메뉴가 열려 있지 않으면 아무것도 하지 않습니다. 인수는 누른 위치입니다: `chart`(몇 번째 차트), `symbol`, `time`(포인터 아래 봉의 시간), `price`(포인터 위치의 가격. 종목의 소수 자릿수로 반올림. 메인 창이 아니면 `null`).

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  contextMenu: ({ symbol, price }) =>
    price === null
      ? []
      : [
          { id: 'buy', label: `지정가 매수 ${price}`, onClick: () => order(symbol, 'buy', price) },
          { id: 'sell', label: `지정가 매도 ${price}`, onClick: () => order(symbol, 'sell', price) }
        ]
});
```

고르면 먼저 메뉴 항목의 `onClick`을 호출하고, 그다음 `contextMenuClick` 이벤트(`{ id, chart, symbol, time, price }`. 주문선 위에서 누르면 `order`도 있음)를 내보냅니다. 그리기 영역의 우클릭 메뉴에만 더해지며, 그리기, 알림선, 축의 우클릭 메뉴는 바뀌지 않습니다. 메뉴가 닫히면(또는 다른 메뉴로 바뀌면) `contextMenuClose` 이벤트를 내보내며, 인수는 열 때 `contextMenu`에 준 것과 같습니다. 예를 들어 메뉴가 열려 있는 동안 누른 가격에 선을 그렸다면 이때 치웁니다.

**주문선의 우클릭 메뉴**: 페이지가 직접 그린 주문선(`chart.orders`) 위에서 우클릭하면 인수에 `order`(그 선의 `id`)가 더해지고, 이때 메뉴는 그 선의 것입니다. 페이지가 돌려준 항목만 있고 차트 자체의 항목은 붙지 않습니다. `order`에 따라 그 선에 의미 있는 동작(주문 취소, 손절 해제 등)을 주세요. 빈 배열을 돌려주면 그 선 위의 우클릭 메뉴는 차트의 원래 메뉴 그대로입니다. 주문선이 아닌 곳을 누르면 `order`가 없으며, 이전과 같습니다.

## 관심 종목

관심 종목 목록은 페이지 자체의 것이며(어디에 저장하고 어떻게 표시할지는 페이지가 정함), 차트는 종목 검색에서 그 별표를 켜 줄 뿐입니다. 목록에 있는 종목 id를 `watchlist`에 주고, 사용자가 별표를 누르면 차트가 `watchlistStar`를 내보내며, 페이지는 목록을 바꾼 뒤 다시 줍니다:

```ts
const chart = createProChart(container, { datafeed, symbol: 'BTCUSDT', watchlist: myList.ids() });

chart.on('watchlistStar', ({ symbol, starred }) => {
  if (starred) {
    myList.add(symbol);
  } else {
    myList.remove(symbol);
  }

  chart.applyOptions({ watchlist: myList.ids() });
});
```

별표는 포인터를 행에 올렸을 때 나타나며, 이미 관심 종목에 있는 것은 늘 켜져 있습니다. `watchlist`를 주지 않으면(또는 `null`을 주면) 별표가 없습니다.
