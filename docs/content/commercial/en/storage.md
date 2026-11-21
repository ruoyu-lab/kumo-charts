# Saving the state

By default the state is kept in the browser, and is gone on another device. To sync it by the user's account, pass a `storage`:

```ts
createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  storage: {
    // null when nothing has been saved yet; when it cannot be read (the network, a server error), throw rather than give null.
    load: async () => {
      const response = await fetch('/api/chart-state');

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Could not read the chart state: ${response.status}`);
      }

      return response.json();
    },
    save: (state) => {
      void fetch('/api/chart-state', { method: 'PUT', body: JSON.stringify(state) });
    }
  }
});
```

`state` is a JSON object (`ChartState`), with the multi-chart layout and the positions of its borders; the symbol, timeframe and chart type (with the settings of each kind of bars) of each chart, its indicators (with their parameters and line settings) and compared symbols; indicator templates; the price scale and how the latest price shows; the favorite timeframes, chart types, drawing tools and indicators; each chart's own drawings (kept apart by the symbol they were drawn on); alerts, kept by symbol; the style each drawing tool used last; where the replay window, the floating toolbar of drawings and the bar of favorite drawing tools were dragged; whether the bar of favorite drawing tools is shown; and the time zone the user picked (`timeZone`: `exchange`, `local` or the name of a time zone, `null` when none was picked). The chart calls `save()` half a second after changes stop, not when nothing changed, and saves what was not saved yet when the page closes. When `load()` throws or rejects, the chart starts from the default state and does not call `save()` for as long as it stays open, so that a state that could not be read is not overwritten by the default one; when `save()` fails, the next change saves again. Both failures emit a `storageError` event. The state carries a version number, and the chart reads only a state of the current version, starting from the default state with any other; a state read is checked item by item, and broken fields take their defaults. The theme and the language are not read from the storage: the page decides them.

To save only when the user clicks a "Save layout", rather than automatically, or to switch between several layouts, use `storage: null` with two methods:

```ts
const layouts = new Map<string, ChartState>();

saveButton.onclick = async () => layouts.set(name, await chart.getState());
layoutMenu.onselect = (name) => chart.setState(layouts.get(name)!);
```

`setState()` rebuilds the chart by the new state, read as `storage` is: checked item by item, with broken fields taking their defaults; a wrong version is rejected.
