# 自定义指标

指标的算法用图表库的指标定义（和 `chart.indicators.register()` 一样），专业图表把它注册到每张图上（包括之后新建的图），列在指标窗口里，用户可以像自带指标一样添加、改参数和线条，状态里也会保存：

```ts
import type { CustomIndicator } from '@kumo-charts/pro-chart';

const MID: CustomIndicator = {
  name: { en: 'Mid price', zh: '中间价', ja: '中値', ko: '중간가' }, // 代码后面的名称，en 必填
  group: 'trend', // 列在哪一组：trend、bands、oscillators、volume、volatility、other（默认），plugins 是最后单独的「插件」一组
  // origin: { en: 'My plugin', zh: '我的插件' }, // 对话框里名字旁边写它从哪来，比如提供它的插件
  definition: {
    type: 'MID', // 代码，指标窗口和图例里显示，不能和自带指标重名
    name: 'MID',
    pane: 'main', // 叠在主图上；'new' 是单独的副图
    precision: 'price',
    params: { period: { default: 5, min: 1, max: 200, integer: true, label: 'Period' } },
    outputs: () => [{ key: 'mid', label: 'MID', plot: { kind: 'line' } }],
    lookback: ({ period }) => period as number,
    // bars 是最近的 lookback 根 K 线，从早到晚。
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

指标定义晚一点才拿到时，用 `chart.registerIndicator(MID)` 注册。用户保存过的自定义指标，注册后会显示出来；放在 `customIndicators` 里时打开就显示。代码不能和自带指标重名。页面的一部分关掉时（比如提供指标的插件），用 `chart.unregisterIndicator('MID')` 撤下：指标对话框不再列它，图上这种指标不画了、读它的提醒也停了，但留在图表状态里，参数不丢，再注册时原样画出来。

## 用公式写

不想写算法时，可以用国内看盘软件的公式：`formula` 代替 `definition`，比如 `{ formula: { type: 'MYMACD', name: 'MYMACD', formula: 'DIF:EMA(C,12)-EMA(C,26); …' } }`。写法、函数和选项见[公式](formula.md)。
