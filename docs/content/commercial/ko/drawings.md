# 그리기 도구

`drawingTools`는 그리기 도구 모음에 둘 도구를 고르고 순서를 정합니다. 도구는 그룹별로 접혀 있으며(선, 피보나치 및 간, 패턴, 예측 및 측정, 도형 및 브러시, 텍스트 및 메모), 각 그룹의 위치는 목록에서 그 그룹 첫 도구의 위치를 따르고, 그룹 안의 도구는 목록 순서를 따르며, 도구가 없는 그룹은 표시하지 않습니다.

차트가 낮아 그리기 도구 모음에 다 들어가지 않으면 도구를 위아래로 스크롤할 수 있고(휠, 터치패드), 도구가 더 있는 쪽에 작은 화살표가 생겨 누르면 한 구간씩 스크롤합니다. 각 그룹 오른쪽 아래의 작은 삼각형은 그 그룹의 도구 목록을 엽니다. 차트 유형 메뉴와 같은 모양이며, 같은 종류의 도구가 모여 있고 종류 사이에 구분선이 있습니다(예를 들어 선 그룹은 선, 채널, 피치포크 세 종류로 나뉩니다). 행마다 도구의 아이콘과 이름이 있고, 행 끝에 그 단축키, 그 뒤에 별표가 있습니다. 별표를 단 것은 늘 보이고, 달지 않은 것은 마우스를 올린 행에만 나타납니다. 키보드로도 쓸 수 있습니다: Enter로 열고, 위아래 키로 고르고(끝에 가면 반대쪽으로 돌아감), Enter로 선택하고 작은 삼각형으로 돌아가며, Tab으로 별표까지 갈 수 있고, Esc로 닫고 작은 삼각형으로 돌아갑니다.

별표를 단 도구는 차트 영역 위쪽의 즐겨찾는 그리기 도구 바에(그리기 도구 모음의 순서로) 표시되며, 한 번 누르면 그 도구를 쓰고 다시 누르면 내려놓습니다. 왼쪽 손잡이를 잡고 차트 영역 어디로든 끌 수 있고, 손잡이를 더블클릭하면 원래 자리(위쪽 가운데)로 돌아갑니다. 그리기 도구 모음 아래의 별 모양 버튼은 이 바를 숨기거나 표시하며, 새 도구에 별표를 달면 자동으로 표시됩니다. 별표를 단 도구가 없으면 이 바는 표시되지 않고, 별 모양 버튼을 누르면 즐겨찾기에 넣는 방법을 알려 줍니다. 별표를 단 도구, 바의 위치와 표시 여부는 레이아웃에 속합니다. 한 레이아웃의 여러 차트가 함께 쓰며, 레이아웃 첫 차트의 상태(`ChartView`)의 `favoriteDrawingTools`, `favoriteToolsBar`, `favoriteToolsShown`에 저장되므로, 어느 차트에서 별표를 달거나 옮기든 레이아웃의 차트가 모두 같아집니다. 리플레이 조작 창의 위치 `replayWindow`와 선택한 그리기의 플로팅 툴바 위치 `drawingBar`도 마찬가지입니다. 멀티 차트 레이아웃에서 플로팅 툴바는 차트 영역 전체에 하나뿐이며, 현재 차트에서 선택한 그리기를 따라가고, 다른 차트에서 그리기를 누르면 다른 차트에서 선택된 그리기는 선택이 풀립니다. 다른 곳으로 끌면 거기에 머물고, 위치는 차트 영역 전체에 대한 비율로 저장되며, 손잡이를 더블클릭하면 그리기 옆으로 돌아갑니다. 메서드는 `setFavoriteDrawingTools(types)`이며, 현재 차트가 있는 레이아웃에 적용됩니다. 상단 바의 즐겨찾는 주기, 차트 유형, 지표는 작업 공간 전체가 함께 씁니다.

그리기 도구 모음은 위에서 아래로 몇 구획으로 나뉘며, 구획 사이에 구분선이 있습니다: 커서. 그리기 도구의 각 그룹. 자석과 연속 그리기. 페이지 자체의 버튼. 즐겨찾는 그리기 도구의 별 모양 버튼, 그리기 숨기기, 그리기 삭제는 그리기 도구 모음 맨 아래에 고정되어, 위의 도구를 스크롤해도 움직이지 않습니다. 도구 아이콘의 그림 방식은 통일되어 있습니다. 사용자가 점을 놓는 위치에 작은 원(앵커)을 그리고, 선은 앵커 사이에 그립니다. 바깥으로 뻗는 선은 아이콘 가장자리까지 그리므로, 추세선(두 앵커 사이), 레이(두 번째 앵커를 지나 한쪽으로 뻗음), 연장선(양쪽으로 뻗음)을 한눈에 구별할 수 있습니다. 아이콘은 그리기 도구 모음에서 22픽셀, 메뉴에서 20픽셀이고, 모든 아이콘의 선은 크기와 상관없이 1픽셀 폭입니다. 차트 유형마다 아이콘도 있으며, 음봉이나 영역 같은 부분은 채우거나 옅은 색으로 칠합니다.

```ts
drawingTools: ['horizontal-line', 'trend-line', 'rectangle', 'fib-retracement', 'text'];
```

도구(모두 52가지, 그리기 도구 모음 순서):

- 선: `trend-line`(추세선), `ray`(레이), `extended-line`(연장선), `trend-angle`(추세 각도), `info-line`(정보 라인), `horizontal-line`(수평선), `horizontal-ray`(수평 레이), `vertical-line`(수직선), `cross-line`(교차선), `parallel-channel`(평행 채널), `regression-trend`(회귀 추세), `pitchfork`(피치포크), `schiff-pitchfork`(쉬프 피치포크), `modified-schiff-pitchfork`(수정 쉬프 피치포크)
- 피보나치 및 간: `fib-retracement`(피보나치 되돌림), `fib-extension`(피보나치 확장), `fib-channel`(피보나치 채널), `fib-time-zone`(피보나치 타임존), `fib-speed-fan`(피보나치 스피드 저항 팬), `gann-box`(간 박스), `gann-fan`(간 팬), `cyclic-lines`(사이클 라인)
- 패턴: `xabcd-pattern`(XABCD 패턴), `abcd-pattern`(ABCD 패턴), `head-and-shoulders`(헤드 앤 숄더), `elliott-impulse`(엘리엇 충격파 12345), `elliott-correction`(엘리엇 조정파 ABC), `elliott-triangle`(엘리엇 삼각파 ABCDE), `elliott-double-combo`(엘리엇 이중 조합파 WXY), `elliott-triple-combo`(엘리엇 삼중 조합파 WXYXZ)
- 예측 및 측정: `long-position`(롱 포지션), `short-position`(숏 포지션), `anchored-vwap`(앵커드 VWAP), `fixed-range-volume-profile`(매물대 (고정 범위)), `price-range`(가격 범위), `date-range`(날짜 범위), `date-price-range`(날짜 및 가격 범위)
- 도형 및 브러시: `brush`(브러시. 누른 채 끌어서 손으로 그림), `highlighter`(형광펜. 누른 채 끌며, 넓고 반투명), `arrow`(화살표), `rectangle`(사각형), `rotated-rectangle`(회전 사각형. 두 점 사이의 중심선을 따라 양쪽으로 같은 폭. 양 끝의 중점과 네 모서리를 모두 끌 수 있음), `path`(경로), `circle`(원), `ellipse`(타원. 비스듬하게도 그릴 수 있음), `triangle`(삼각형)
- 텍스트 및 메모: `text`(텍스트), `callout`(말풍선), `price-label`(가격 라벨), `flag-mark`(플래그 마크), `arrow-mark-up`(위쪽 화살표), `arrow-mark-down`(아래쪽 화살표)

주지 않으면 전부이며, 페이지 자체의 도구(`customDrawings`)는 각자 `after`가 가리키는 도구 뒤에, `after`가 없으면 그 그룹의 맨 끝에 놓입니다. 목록을 주면 페이지 자체의 도구도 목록에 (그 `type`을) 써야 나타납니다. 목록에 없는 기본 제공 도구는 숨겨지므로, 예를 들어 페이지가 자체 도구로 피보나치 되돌림을 바꾸려면 목록에서 `fib-retracement`를 빼고 자체 도구를 넣습니다. `drawingToolTypes(customDrawings)`는 목록을 주지 않을 때의 모든 도구를(그리기 도구 모음 순서로) 돌려주므로, 거기서 필요 없는 것을 빼는 것이 가장 편합니다. `DRAWING_GROUP_IDS`는 각 그룹의 이름으로 `lines`, `fibonacci`, `patterns`, `measure`, `shapes`, `annotation`입니다. 숨긴 도구로 이미 차트에 그린 그리기는 그대로 표시되고 선택하고 바꿀 수도 있으며, 그리기 도구 모음에 그 도구가 없어 새로 그릴 수 없을 뿐입니다.

```ts
const tools = drawingToolTypes([RULER]).filter((type) => type !== 'fib-retracement');
chart.applyOptions({ drawingTools: tools }); // 자체 자로 피보나치 되돌림을 바꿉니다
chart.applyOptions({ drawingTools: null }); // 전부로 되돌립니다
```

그리기를 통째로 없애려면 `features: { drawings: false }`를 씁니다.

## 눈금: 레벨을 어느 쪽부터 셀지

피보나치 되돌림, 확장, 채널, 스피드 저항 팬, 간 박스처럼 레벨이 있는 도구는 앵커마다 값이 하나 있고, 레벨은 이 두 값으로 셉니다. 값은 스타일의 `levelRange`(시간 방향의 레벨은 `timeLevelRange`)에 저장되며, 기본값은 `{ start: 1, end: 0 }`입니다. 첫 번째 앵커가 1, 두 번째가 0이고, 레벨 0.618은 두 번째 앵커에서 전체 길이의 0.618만큼 떨어져 있습니다. 설정 창의 "눈금"에서 기본값, 반대로(`{ start: 0, end: 1 }`), 배수(R)(`{ start: 0, end: -1 }`: 첫 번째 앵커가 0이고 두 번째 앵커 쪽은 음수, 반대쪽은 1, 2, 3……. 예를 들어 진입가에서 손절가로 끌면 1이 바로 1R), 사용자 지정(두 앵커에 각각 값을 씀)을 고를 수 있습니다. 레벨의 글자(`levelLabel`)에는 접두사와 접미사를 붙일 수 있으며, 예를 들어 접미사에 `R`을 쓰면 `2R`로 표시합니다.

페이지는 `drawingStyles`로 도구에 스타일을 주어 그 도구의 기본값으로 삼을 수 있습니다. 사용자가 새로 그릴 때 그것을 쓰고, 사용자가 직접 바꾼 스타일은 그 위에 덮이며, 설정 창의 "스타일 초기화"는 그것으로 되돌립니다. 스타일을 잘못 쓰면(없는 필드, 범위를 벗어난 선 두께 등) 오류가 나며, 차트 라이브러리의 `checkDrawingStyle()`과 같은 방식으로 검사합니다. 표시한 뒤에도 `applyOptions`로 바꿀 수 있습니다:

```ts
chart.applyOptions({
  drawingStyles: {
    'fib-retracement': {
      levelRange: { start: 0, end: -1 },
      levelLabel: { level: true, format: 'ratio', prefix: '', suffix: 'R', price: true }
    }
  }
});
```

이 도구들의 그림 방식, 기본 레벨과 라벨: 피보나치 되돌림은 24레벨이 있고, 기본으로 0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618, 3.618, 4.236을 표시하며, 나머지 13레벨(1.272, 1.414, 2, 2.272……4.764)은 설정 창에서 켭니다. 피보나치 타임존은 0, 1, 2, 3, 5, 8, 13…… 단위 위치에 세로선을 긋습니다. 스피드 저항 팬과 간 박스의 가격 레벨과 시간 레벨은 기본 0, 0.25, 0.382, 0.5, 0.618, 0.75, 1입니다. 회귀 추세는 두 앵커 사이 각 봉의 종가로 선형 회귀를 하고, 위아래로 표준편차 2배의 선을 하나씩 그으며, 피어슨 상관계수를 표시합니다. 앵커드 VWAP은 앵커가 있는 봉부터 계산하며(기본 (고가 + 저가 + 종가) / 3), 표준편차 1배의 밴드가 붙습니다. 엘리엇 파동은 파동 등급별로 라벨을 붙이며, 기본은 중간 등급의 (1)……(5), (A)(B)(C)입니다. 헤드 앤 숄더의 "왼쪽 어깨, 머리, 오른쪽 어깨"는 화면 언어로 표시합니다. 엘리엇 삼각파는 A부터 E까지, 조합파는 W, X, Y(삼중은 다시 X, Z)로 라벨을 붙입니다. 정보 라인은 선분 가운데 옆의 상자에 등락과 퍼센트, 봉 개수와 기간, 각도를 씁니다. 쉬프 피치포크의 중심선은 손잡이의 절반 높이에서 시작하며(수정판은 시간도 절반을 취함), 너무 가파른 추세에 알맞습니다. 간 팬은 첫 번째 앵커에서 8×1부터 1×8까지의 각도로 레이를 그리고, 1×1은 두 번째 앵커를 지나며, 선마다 알림을 걸 수 있습니다. 사이클 라인은 두 앵커의 간격으로 오른쪽으로 계속 세로선을 긋습니다. ABCD 패턴은 BC, CD의 되돌림 비율을 표시합니다. 위쪽·아래쪽 화살표는 상승·하락 색을 쓰며, 한마디 텍스트를 붙일 수 있습니다. 회귀 추세와 앵커드 VWAP은 봉으로 계산하므로 앵커의 시간만 의미가 있고, 핸들은 선 위에 있으며 좌우로만 끌 수 있습니다.

그리기 설정 창은 도구마다 설정할 수 있는 항목을 표시합니다. 추세선에는 연장, 화살표, 텍스트가, 사각형에는 채우기, 연장, 상자 안 텍스트가, 채널에는 채우기와 연장이, 피보나치에는 각 레벨이, 간 박스와 스피드 저항 팬에는 가격 레벨과 시간 레벨이, 간 팬에는 각 각도(가격/시간, 2는 2×1)가, 형광펜에는 6~20픽셀의 선 두께가, 회귀 추세에는 계산 가격과 편차(기본 표준편차의 +2, 0, −2배)가, 앵커드 VWAP에는 계산 가격과 밴드가, 피보나치 타임존에는 배수로 된 각 레벨(레벨을 더하면 피보나치 수열이 이어짐)이, 엘리엇 파동에는 파동 등급이, 가격 라벨과 패턴에는 라벨 색과 글자 크기가, 원과 타원에는 상자 안 텍스트가, 텍스트와 말풍선에는 배경이 있습니다. 수평선은 가격 좌표만, 수직선은 시간 좌표만, 회귀 추세와 앵커드 VWAP은 시간 좌표만 있습니다. 사용자가 툴바나 설정 창에서 스타일을 바꾸면 그 도구로 그 뒤에 새로 그리는 그리기가 그 스타일을 쓰며, 상태의 `drawingStyles`에 저장됩니다. 설정 창의 "스타일 초기화"는 그 그리기와 그 도구를 모두 기본값으로 되돌립니다.

## 두 바 바꾸기: 플로팅 바와 그리기 도구 모음

그리기를 선택하면 떠오르는 바(색, 선 두께 변경, 잠금, 삭제)에 무엇을 어떤 순서로 둘지는 `drawingBarItems`로 정합니다. 목록에는 세 가지를 쓸 수 있습니다:

- **기본 제공 항목**(`DRAWING_BAR_PARTS`): `color`, `lineWidth`, `lineStyle`, `separator`(구분선, 여러 번 쓸 수 있음), `text`(텍스트 쓰기), `settings`, `duplicate`, `lock`, `remove`.
- **스타일 토글** `{ field }`: 그리기 스타일에 있는 토글을 버튼으로 만듭니다. 한 번 누르면 켜지고 다시 누르면 꺼지며, 설정 창에서 바꾼 것과 같습니다(실행 취소할 수 있고, 그 도구의 기본값도 됩니다). 쓸 수 있는 토글은 `DRAWING_BAR_SWITCHES`에 있으며 `fill`, `bold`, `italic`, `extendLeft`, `extendRight`, `startArrow`, `endArrow`입니다. `label`(툴팁 문구)과 `icon`을 더 주어 기본 것을 바꿀 수 있습니다.
- **페이지 자체의 버튼** `{ id, label, icon, types? }`: 누르면 그 그리기를 담아 `drawingBarClick` 이벤트를 내보냅니다. `types`를 쓰면 그 종류의 그리기에만 나타납니다.

각 항목은 그 그리기에 쓸모 있을 때만 나타납니다. 추세선에는 `extendRight`가 있지만 사각형에는 없으므로, 사각형의 플로팅 바에는 이 버튼이 나오지 않습니다. 양 끝이나 연달아 있는 구분선은 자동으로 빠집니다. `drawingBarItems`를 주지 않으면 기본 제공 항목이 전부 들어갑니다.

```ts
const chart = createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  drawingBarItems: [
    'color',
    'lineWidth',
    'lineStyle',
    'separator',
    { field: 'extendRight' }, // "오른쪽으로 연장"을 플로팅 바에 둡니다
    { field: 'extendLeft' },
    'separator',
    { id: 'share', label: { en: 'Share', zh: '分享' }, icon: 'M12 5v10M8 9l4-4 4 4M5 19h14' },
    'settings',
    'lock',
    'remove'
  ]
});

chart.on('drawingBarClick', ({ id, symbol, drawing }) => {
  if (id === 'share') {
    share(symbol, drawing); // drawing은 그 그리기: id, type, points, style……
  }
});
```

왼쪽 그리기 도구 모음에서 도구 외의 버튼 중 무엇을 남길지는 `drawingToolbarControls`(`DRAWING_TOOLBAR_CONTROLS`)로 정합니다: `cursor`(십자선), `magnet`(자석), `continuous`(연속 그리기), `favorites`(즐겨찾는 도구 바), `hide`(그리기 숨기기), `clear`(모두 삭제). 나열한 것만 표시되며 위치는 바뀌지 않습니다. 도구 자체는 `drawingTools`가 맡고, 페이지 자체의 버튼은 ["자체 버튼"](page-items.md)을 참고하세요.

```ts
chart.applyOptions({ drawingToolbarControls: ['cursor', 'magnet', 'hide'] }); // 연속 그리기, 즐겨찾기, 모두 삭제는 빼기
chart.applyOptions({ drawingBarItems: null, drawingToolbarControls: null }); // 기본값으로 되돌리기
```

## 직접 만드는 그리기 도구 모음: chart.drawingTools

위의 두 옵션으로 부족하면 기본 제공 바를 끄고 `chart.drawingTools`로 직접 만들 수 있습니다. 기본 제공 두 바가 읽는 것, 하는 일이 모두 여기 있으며, 어떤 프레임워크로 써도 됩니다.

```ts
const chart = createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  features: { drawingToolbar: false, drawingBar: false } // 기본 제공 그리기 도구 모음과 플로팅 바를 끕니다. 그리기 기능은 그대로
});
```

두 토글은 하나만 끌 수도 있습니다. 둘 다 끄지 않아도 `chart.drawingTools`를 쓸 수 있으므로, 예를 들어 페이지의 다른 곳에 자주 쓰는 도구 버튼을 몇 개 더 둘 수 있습니다.

| 메서드                      | 설명                                                                                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list()`                    | 지금 제공하는 도구. 그리기 도구 모음의 그룹과 순서로: `[{ id, name, tools: [{ type, name, icon, keys }] }]`. 이름은 현재 언어이고, `icon`은 24×24 격자 위의 SVG 경로, `keys`는 그 단축키입니다                                          |
| `getState()`                | `{ active, magnet, continuous, hidden, favorites, favoritesShown }`: 쓰고 있는 도구(없으면 `null`), 자석(`off`, `weak`, `strong`), 연속 그리기, 그리기를 숨겼는지, 사용자가 즐겨찾기에 넣은 도구, 즐겨찾는 그리기 도구 바가 열려 있는지 |
| `start(type)`, `cancel()`   | 도구를 집어 듭니다(다음에 사용자가 차트를 누르면 그 도구로 그림). 내려놓습니다                                                                                                                                                          |
| `setMagnet(mode)`           | 자석                                                                                                                                                                                                                                    |
| `setContinuous(on)`         | 연속 그리기: 하나를 다 그리면 이어서 다음을 그림                                                                                                                                                                                        |
| `setHidden(hidden)`         | 모든 그리기를 숨기거나 표시합니다                                                                                                                                                                                                       |
| `setFavoritesShown(shown)`  | 즐겨찾는 그리기 도구 바를 열고 닫습니다. 그리기 도구 모음 아래의 별 모양 버튼과 같아서, 열려 있어도 즐겨찾는 도구가 있을 때만 표시합니다                                                                                                |
| `clear()`                   | 현재 차트의 그리기를 모두 삭제합니다. 한 단계로 실행 취소할 수 있습니다                                                                                                                                                                 |
| `undo()`, `redo()`          | 현재 차트 그리기의 직전 변경을 실행 취소하거나 다시 실행합니다                                                                                                                                                                          |
| `getSelected()`             | 현재 차트에서 선택된 그리기: `{ chart, symbol, drawing, style, fields, editableText, bounds }`. 없으면 `null`                                                                                                                           |
| `select(id, target?)`       | 그리기를 선택합니다. 누르는 것과 같습니다. `null`이면 선택을 풉니다                                                                                                                                                                     |
| `duplicate(id, target?)`    | 그리기를 복제하고, 복제한 것을 선택하며, 그 id를 돌려줍니다                                                                                                                                                                             |
| `openSettings(id, target?)` | 그 그리기의 설정 창을 엽니다                                                                                                                                                                                                            |

그리기를 바꿀 때는 "메서드로 그리기"의 `updateDrawing()`, `removeDrawing()`을 씁니다. `getSelected()`가 주는 `style`은 그 그리기가 실제로 쓰는 스타일(직접 바꾼 것이 그 도구의 기본값 위에 덮인 것)이고, `fields`는 그런 그리기에 있는 스타일 항목(`lineWidth`가 없는 그리기는 선 두께를 표시하면 안 됨), `editableText`는 텍스트를 쓸 수 있는지, `bounds`는 창 안에서의 위치(`getBoundingClientRect()`와 같은 좌표)이며, 보이는 범위에 없으면 `null`입니다.

즐겨찾는 그리기 도구 바는 `drawingToolbar`를 따라 꺼지지 않습니다. 사용자가 도구를 즐겨찾기에 넣었다면 여전히 차트 위에 떠 있으며, 페이지 자체의 그리기 도구 모음에서 `setFavoritesShown()`으로 열고 닫거나, 끄고 `getState().favorites`로 즐겨찾는 도구를 직접 표시합니다.

상태가 바뀌면 이벤트 세 가지가 있습니다: `drawingToolChange`(내용은 `getState()`와 같음), `drawingSelectionChange`(`{ selected }`. 선택이 바뀔 때, 선택을 풀 때, 선택된 그리기가 바뀔 때 내보냄), `drawingBoundsChange`(`{ chart, id, bounds }`. 선택된 그리기가 창 안에서 위치를 옮겼을 때로, 차트를 스크롤하거나 확대·축소하거나 그리기를 끌 때 생깁니다. 페이지가 이것을 들을 때만 매 프레임 잽니다).

```ts
// 자체 그리기 도구 모음: 도구를 나열하고, 누르면 집어 들고, 쓰는 중인 것을 강조합니다.
const groups = await chart.drawingTools.list();
toolbar.render(groups, (type) => chart.drawingTools.start(type));
chart.on('drawingToolChange', ({ active, magnet }) => {
  toolbar.highlight(active);
  toolbar.showMagnet(magnet);
});

// 자체 플로팅 바: 선택된 그리기를 따라가며, 그 그리기에 있는 스타일 항목대로 버튼을 표시합니다.
chart.on('drawingSelectionChange', ({ selected }) => {
  if (!selected) {
    bar.hide();
    return;
  }

  bar.show({
    color: selected.fields.includes('color') ? selected.style.color : null,
    extendRight: selected.fields.includes('extendRight') ? selected.style.extendRight : null,
    onColor: (color) => chart.updateDrawing(selected.drawing.id, { style: { color } }),
    onRemove: () => chart.removeDrawing(selected.drawing.id)
  });
});
chart.on('drawingBoundsChange', ({ bounds }) => {
  bar.moveTo(bounds); // bounds가 null이면 그리기가 보이는 범위에 없습니다
});
```
