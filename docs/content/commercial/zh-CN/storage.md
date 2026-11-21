# 保存到自己的服务器

默认存在浏览器里，换台设备就没了。要按用户账号同步，就传一个 `storage`：

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  storage: {
    // 还没存过时给 null；读不到（网络、服务器出错）时要抛错，不能给 null。
    load: async () => {
      const response = await fetch('/api/chart-state');

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`读取图表状态失败：${response.status}`);
      }

      return response.json();
    },
    save: (state) => {
      void fetch('/api/chart-state', { method: 'PUT', body: JSON.stringify(state) });
    }
  }
});
```

`state` 是一个 JSON 对象（`ChartState`），包括多图布局和分界的位置、每张图的品种、周期、图表类型（含各 K 线类型的设置）、指标（含各自的参数和线条设置）和比较品种、指标模板、价格刻度和最新价的显示、收藏的周期、图表类型、画线工具和指标、每张图自己的画线（按画的时候的品种分着存）、按品种保存的提醒、每种画线工具上次用的样式、回放小窗、画线浮动工具栏和常用画线栏被拖到的位置、常用画线栏是否显示、用户选的时区（`timeZone`：`exchange`、`local`、时区名，没选过是 `null`）。图表在变化停下半秒后才调用 `save()`，内容没变时不调用，关闭页面时会把没存的存掉。`load()` 抛错或拒绝时，图表从默认状态开始，并且这次打开不再调用 `save()`，免得读不到的状态被默认状态覆盖；`save()` 失败时，下次变化会再存。两种失败都发出 `storageError` 事件。状态带版本号，图表只读当前版本的状态，别的版本从默认状态开始；读到的状态逐项检查，坏掉的字段用默认值。主题和语言不从存储里读，由页面决定。

不想自动保存，而是让用户点「保存布局」时才存、或者有多套布局可以切换，就用 `storage: null` 加两个方法：

```ts
const layouts = new Map<string, ChartState>();

saveButton.onclick = async () => layouts.set(name, await chart.getState());
layoutMenu.onselect = (name) => chart.setState(layouts.get(name)!);
```

`setState()` 把图表按新状态重建，读法和 `storage` 一样：逐项检查，坏掉的字段用默认值；版本不对时拒绝。
