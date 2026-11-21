# 상태 저장

기본적으로 브라우저에 저장되므로 다른 기기에서는 사라집니다. 사용자 계정별로 동기화하려면 `storage`를 넘깁니다:

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  storage: {
    // 아직 저장한 적이 없으면 null. 읽을 수 없을 때(네트워크, 서버 오류)는 null이 아니라 오류를 던져야 합니다.
    load: async () => {
      const response = await fetch('/api/chart-state');

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`차트 상태를 읽지 못했습니다: ${response.status}`);
      }

      return response.json();
    },
    save: (state) => {
      void fetch('/api/chart-state', { method: 'PUT', body: JSON.stringify(state) });
    }
  }
});
```

`state`는 JSON 객체(`ChartState`)이며, 멀티 차트 레이아웃과 경계의 위치, 각 차트의 종목, 주기, 차트 유형(봉 유형마다의 설정 포함), 지표(각자의 파라미터와 선 설정 포함)와 비교 종목, 지표 템플릿, 가격축과 현재가 표시, 즐겨찾는 주기·차트 유형·그리기 도구·지표, 각 차트 자체의 그리기(그릴 때의 종목별로 나눠 저장), 종목별로 저장하는 알림, 그리기 도구마다 마지막으로 쓴 스타일, 리플레이 작은 창·그리기 플로팅 툴바·즐겨찾는 그리기 도구 바를 끌어다 놓은 위치, 즐겨찾는 그리기 도구 바를 표시할지, 사용자가 고른 시간대(`timeZone`: `exchange`, `local`, 시간대 이름. 고른 적이 없으면 `null`)를 담습니다. 차트는 변화가 멈추고 0.5초 뒤에 `save()`를 호출하며, 내용이 바뀌지 않았으면 호출하지 않고, 페이지를 닫을 때 아직 저장하지 않은 것을 저장합니다. `load()`가 오류를 던지거나 거부하면 차트는 기본 상태에서 시작하며, 이번에 열려 있는 동안에는 `save()`를 호출하지 않습니다. 읽지 못한 상태를 기본 상태로 덮어쓰지 않기 위해서입니다. `save()`가 실패하면 다음 변화 때 다시 저장합니다. 두 실패 모두 `storageError` 이벤트를 내보냅니다. 상태에는 버전 번호가 있으며, 차트는 현재 버전의 상태만 읽고 다른 버전이면 기본 상태에서 시작합니다. 읽은 상태는 항목별로 검사하며, 망가진 필드는 기본값을 씁니다. 테마와 언어는 저장소에서 읽지 않고 페이지가 정합니다.

자동 저장 대신 사용자가 "레이아웃 저장"을 누를 때만 저장하거나, 여러 레이아웃을 바꿔 가며 쓰려면 `storage: null`과 메서드 두 개를 씁니다:

```ts
const layouts = new Map<string, ChartState>();

saveButton.onclick = async () => layouts.set(name, await chart.getState());
layoutMenu.onselect = (name) => chart.setState(layouts.get(name)!);
```

`setState()`는 새 상태로 차트를 다시 만들며, 읽는 방식은 `storage`와 같습니다. 항목별로 검사하고, 망가진 필드는 기본값을 쓰며, 버전이 맞지 않으면 거부합니다.
