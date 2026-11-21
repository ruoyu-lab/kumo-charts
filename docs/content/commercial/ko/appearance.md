# 색과 글꼴

`upColor`, `accentColor`로 충분하면 그것을 쓰면 됩니다. 웹사이트 색에 맞추려면 `themes`로 테마마다 색을 바꿉니다. `tokens`는 화면의 디자인 변수(CSS 사용자 지정 속성, `--` 없이), `chart`는 차트 자체의 색(차트 라이브러리의 `Theme`)입니다.

```ts
createProChart(container, {
  datafeed,
  symbol: 'BTCUSDT',
  theme: 'dark',
  fontFamily: '"HarmonyOS Sans", system-ui, sans-serif',
  themes: {
    dark: {
      tokens: {
        'app-bg': '#0b0e11',
        panel: '#161a1e',
        border: '#2b3139',
        accent: '#f0b90b',
        'accent-text': '#0b0e11'
      },
      chart: { background: '#161a1e', up: '#0ecb81', down: '#f6465d' }
    }
  }
});
```

주요 디자인 변수: `app-bg`(가장 바깥의 배경색), `panel`(상단 바, 그리기 도구 모음의 배경색), `panel-raised`(메뉴, 창), `border`(구분선), `text`, `muted`(부차적인 글자), `faint`(더 흐린 글자), `accent`, `accent-strong`, `accent-text`(주 색상과 주 색상 위의 글자), `up`, `down`(화면의 상승·하락 색), `hover`, `selected-bg`, `selected-text`(마우스 오버, 선택), `radius`(모서리 둥글기). 모두 `THEME_TOKENS`에 있습니다. 차트의 색: `background`, `grid`, `text`, `up`, `down`, `volumeUp`, `volumeDown`, `accent`, `crosshair`, `palette`(지표 선이 차례로 쓰는 색) 등.

`upColor: 'red'`가 먼저 상승·하락 색을 맞바꾸고, `themes`에서 준 색이 그 위에 덮입니다. 사용자가 차트 설정에서 바꾼 색(각 차트의 배경, 격자, 봉 색)이 우선합니다.

## CSS로 스타일 바꾸기

차트는 Shadow DOM 안에 있어 페이지의 스타일이 들어가지 못하지만, 다음 부분은 `::part()`로 선택할 수 있습니다: `topbar`(상단 바), `drawing-toolbar`(그리기 도구 모음), `chart-area`(모든 차트의 영역), `chart`(각 차트), `custom-button`(페이지 자체의 버튼).

```css
kumochart-pro-chart::part(topbar) {
  border-bottom-width: 2px;
}

kumochart-pro-chart::part(custom-button) {
  font-weight: 600;
}
```

`kumochart-pro-chart` 요소 자체(컨테이너 안의 것)에는 테두리, 둥근 모서리 등을 바로 줄 수 있습니다. 색은 CSS가 아니라 `themes`로 바꾸세요. `themes`는 차트 자체의 색도 바꾸며, 테마를 바꿀 때 따라 바뀝니다.
