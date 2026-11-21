# 公式

国内看盘软件写法的指标公式，直接变成专业图表里的指标：逐根 K 线实时计算，指标窗口里列出来，用户可以像自带指标一样添加、改参数和线条，也能在它上面加提醒。把公式写进 `customIndicators`（或晚一点用 `registerIndicator()` 注册），`formula` 代替算法的 `definition`：

```ts
import { createProChart, type CustomIndicator } from '@kumo-charts/pro-chart';

const MYMACD: CustomIndicator = {
  name: { en: 'My MACD', zh: '我的 MACD' }, // 指标窗口里代码后面的名称
  group: 'oscillators',
  formula: {
    type: 'MYMACD', // 代码，指标窗口和图例里显示，不能和自带指标重名
    name: 'MYMACD', // 图例里的名字
    formula: `
      DIF:EMA(CLOSE,SHORT)-EMA(CLOSE,LONG);
      DEA:EMA(DIF,MID);
      MACD:(DIF-DEA)*2,COLORSTICK;
    `,
    params: { SHORT: 12, LONG: 26, MID: 9 }
  }
};

const chart = createProChart(container, {
  datafeed,
  symbol: '600519.SH',
  customIndicators: [MYMACD]
});
chart.addIndicator('MYMACD', { params: { SHORT: 6 } });
```

公式指标的授权包含在商业授权里。`name`、`group`、`origin` 和别的[自定义指标](custom-indicators.md)一样。

## 选项

| 选项        | 说明                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `type`      | 代码，如 `MYMACD`：指标窗口、图例和状态里都用它，不能和自带指标或别的自定义指标重名                                     |
| `name`      | 图例里显示的名称                                                                                                        |
| `formula`   | 公式文本                                                                                                                |
| `params`    | 参数，如 `{ N: 9 }`；也可以带范围：`{ N: { default: 9, min: 1, max: 100, integer: true } }`，指标设置窗口照着它限制输入 |
| `overlay`   | `true` 时画在主图上，否则单独一个副图                                                                                   |
| `precision` | 小数位数；`price` 跟随价格（画在主图上时的默认），`volume` 用于成交量                                                   |
| `levels`    | 水平参考线，如 `[20, 80]`                                                                                               |
| `range`     | 副图固定的刻度范围，如 `{ min: 0, max: 100 }`                                                                           |
| `timeZone`  | 时间函数用的时区，如 `Asia/Shanghai`；默认跟着图上显示时间的时区，用户换了时区就按新时区重算                            |
| `library`   | 可以引用的其他公式，见下面的「引用其他公式」                                                                            |

## 写错时

公式在 `createProChart()` 或 `registerIndicator()` 时就编译，写错了立刻抛出 `FormulaError`（从 `@kumo-charts/pro-chart` 导入）：`code` 说是哪种错，`span` 是出错的地方，`describe('zh')` 是中文的说明：

```ts
import { FormulaError } from '@kumo-charts/pro-chart';

try {
  await chart.registerIndicator({ formula: { type: 'X', name: 'X', formula: 'A:MA(C,N);' } });
} catch (error) {
  if (error instanceof FormulaError) {
    error.span; // { line: 1, column: 8, length: 1 }
    error.describe('zh'); // "N"既不是前面定义过的变量、参数，也不是 CLOSE 这样的行情数据。
  }
}
```

## 语法

- `名称:表达式;` 画一条线；`名称:=表达式;` 只定义中间变量；没有名称的表达式也会画线。
- 运算符：`+ - * /`，比较 `> < >= <= = <>`，逻辑 `AND OR NOT`（也可以写 `&& || !`）。优先级从高到低：`* /`、`+ -`、比较、`NOT`、`AND`、`OR`。所以不带括号的 `NOT C>O` 和国内公式通常的写法 `NOT(C>O)` 一样，是「不是阳线」；`NOT` 放在比较的一边时要带括号，如 `C>NOT(O)`。
- 名称不区分大小写，可以用中文；中文全角标点（`；：，（）`）会自动识别，引号里的文字照原样保留（`'买入，加仓'` 里的全角逗号不变）。文字和引用也可以用中文引号 `‘’`、`“”` 括起来；用英文引号括起来时，里面可以有中文引号。
- 注释：`{ … }` 和 `// …`。
- 行情数据：`OPEN/O`、`HIGH/H`、`LOW/L`、`CLOSE/C`、`VOL/V/VOLUME`。
- 线型属性：`COLORRED` 等颜色、`COLOR` 加六位 BBGGRR、`NODRAW`、`STICK`、`COLORSTICK`、`VOLSTICK`、`DOTLINE`、`DASHLINE`、`LINETHICK1`–`9`（线宽，见「绘图函数」）。

## 函数

| 类别 | 函数                                                                                                                                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 均线 | `MA` `EMA` `EXPMA` `SMA` `MEMA` `DMA` `WMA`                                                                                                                           |
| 引用 | `REF` `BARSLAST` `BARSSINCE` `BARSCOUNT` `BARSLASTCOUNT`                                                                                                              |
| 统计 | `SUM` `HHV` `LLV` `HHVBARS` `LLVBARS` `COUNT` `EVERY` `EXIST` `SUMBARS` `STD` `STDP` `VAR` `VARP` `AVEDEV` `DEVSQ` `SLOPE` `FORCAST`                                  |
| 信号 | `CROSS` `LONGCROSS` `FILTER` `VALUEWHEN` `LAST` `NDAY` `UPNDAY` `DOWNNDAY`                                                                                            |
| 指标 | `SAR`                                                                                                                                                                 |
| 时间 | `DATE` `TIME` `YEAR` `MONTH` `DAY` `HOUR` `MINUTE` `WEEKDAY` `BARPOS`                                                                                                 |
| 逻辑 | `IF` `IFF` `IFN` `NOT` `BETWEEN` `RANGE` `ISUP` `ISDOWN` `ISEQUAL`                                                                                                    |
| 数学 | `ABS` `MAX` `MIN` `SQRT` `POW` `LN` `LOG` `EXP` `INTPART` `FRACPART` `CEILING` `FLOOR` `ROUND` `ROUND2` `SIGN` `MOD` `REVERSE` `SIN` `COS` `TAN` `ASIN` `ACOS` `ATAN` |
| 其他 | `DRAWNULL`                                                                                                                                                            |

几个函数的细节：

- `LAST(X,A,B)`：从前 A 根到前 B 根（两头都算）每根都满足 X 时为 1。A 为 0 表示从第一根算起，B 为 0 表示到当根；这段开始在第一根之前，或 A 小于 B 时为 0。
- `NDAY(X,Y,N)`：最近 N 根每根都是 X>Y。`UPNDAY(X,M)`、`DOWNNDAY(X,M)`：最近 M 根每根都比前一根大（小），相等不算。
- `RANGE(A,B,C)`：A 大于 B 并且小于 C 时为 1，两端不算；两端也算用 `BETWEEN`。
- `ROUND(X)` 取整，`ROUND2(X,N)` 保留 N 位小数：都是四舍五入，负数的 0.5 也往远离 0 的方向（`ROUND(-2.5)` 是 -3）；按写出来的十进制舍入，`ROUND2(1.005,2)` 是 1.01。N 的小数部分截掉，负数为无效值。
- `FRACPART(X)` 是小数部分，带符号：`FRACPART(-3.5)` 是 -0.5。
- `VALUEWHEN(COND,X)`：COND 最近一次成立那根的 X；第一次成立之前为无效值。
- `SUMBARS(X,A)`：从当根往前把 X 加到不小于 A，要加几根；当根就够时为 1，全部加完还不够时为已有的 K 线数。X 的无效值当 0。
- `SAR(N,S,M)`：抛物线转向，S 是步长、M 是极限值，都按百分比，如 `SAR(10,2,20)`。前 N 根 K 线没有值，用来定起点：之后那根的收盘高于第一根的收盘就从上涨开始，SAR 从这 N 根的最低价起步，否则从下跌开始，从最高价起步。之后每根向趋势的极值靠近，加速度从 S% 起，每创一次新极值加 S%，最多 M%；不进入前两根 K 线的范围；价格穿过时转向，从上一段趋势的极值重新开始。

### 周期

周期参数（如 `MA(C,N)` 里的 `N`）可以是数字、参数或它们的四则运算，也可以是序列：`HHV(H,BARSLAST(CROSS(C,MA(C,5)))+1)` 是上次上穿 5 日均线以来的最高价，`SUM(V,BARSLAST(CROSS(C,MA(C,5)))+1)` 是这段时间的成交量。除 `LONGCROSS`、`FILTER` 和 `SAR` 外，周期都可以是序列。

- 写成数字或参数时，周期必须是整数，并且不小于这个函数的下限（见下一条），否则编译时报 `invalid-period`，说明下限是几；`REF` 的周期写成负数是引用之后的 K 线（未来数据），报 `future-reference`。
- 序列当周期时，每根 K 线用当根的周期值，小数部分截掉（2.7 当 2）；周期是无效值或负数时，结果为无效值。
- 0 的意思和写成数字时一样：`SUM`、`HHV`、`LLV`、`HHVBARS`、`LLVBARS`、`COUNT` 和 `LAST` 的 A 写 0 表示从第一根 K 线算起，`REF` 的 0 是当根。其他函数的周期至少是 1（`STD`、`VAR`、`SLOPE`、`FORCAST` 至少是 2），更小就是无效值。
- 已有的 K 线比周期少时也和写成数字时一样：`COUNT`、`EXIST` 数已有的几根，`EVERY`、`NDAY`、`UPNDAY`、`DOWNNDAY` 和 `LAST` 为 0，其他为无效值。
- `EMA`、`SMA` 这类递推的均线每根按当根的周期算，周期无效的那根结果为无效值，也不参与递推。

## 绘图函数

在 K 线上画出信号，写法和国内看盘软件的公式一样，单独成一句，后面可以跟颜色：

```text
金叉:=CROSS(MA(C,5),MA(C,10));
DRAWICON(金叉,LOW,1);
DRAWTEXT(金叉,HIGH+MA(HIGH-LOW,20),'金叉'),COLORRED;
STICKLINE(VOL>MA(VOL,20)*2,OPEN,CLOSE,0.8,0),COLORYELLOW;
DRAWBAND(MA(C,5),COLORRED,MA(C,20),COLORGREEN);
DRAWLINE(H>=HHV(H,20),H,L<=LLV(L,20),L,1),COLORMAGENTA,LINETHICK2;
```

| 函数                                     | 画法                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STICKLINE(条件,价格1,价格2,宽度,空心)`  | 条件成立的 K 线上，从价格 1 到价格 2 画柱子。宽度 0 是一条细线，0.8 和 K 线实体一样宽，1.1 以上占满间距；空心不为 0 时只画边框                                                                                                                                             |
| `DRAWTEXT(条件,价格,'文字')`             | 在价格处写文字（以价格为中心）                                                                                                                                                                                                                                             |
| `DRAWNUMBER(条件,价格,数字)`             | 在价格处写数字（以价格为中心），数字可以是序列。整数不带小数，其他数按公式的小数位数写，和图例一样                                                                                                                                                                         |
| `DRAWICON(条件,价格,图标)`               | 图标 1 是向上箭头，尖端从下方指向价格；2 是向下箭头，从上方指向价格；其他编号画圆点                                                                                                                                                                                        |
| `POLYLINE(条件,价格)`                    | 条件成立的点依次连成折线，中间的 K 线跳过；也可以写成 `PLOYLINE`                                                                                                                                                                                                           |
| `VERTLINE(条件)`                         | 条件成立的 K 线上画一条竖线，从窗格顶部到底部                                                                                                                                                                                                                              |
| `DRAWLINE(条件1,价格1,条件2,价格2,延长)` | 条件 1 成立时记下起点（再成立就换成新的起点），之后条件 2 成立时从起点画直线到这里，起点就用掉了，下一条线等条件 1 再成立。两个条件在同一根 K 线成立时，先在这里结束上一条线，再从这里开始新的一条。延长：0 不延长，1 向右延长到窗格边缘，2 或 10 向左，3 或 11 两头都延长 |
| `DRAWBAND(值1,颜色1,值2,颜色2)`          | 值 1 高于值 2 的地方用颜色 1 填满两个值之间，反之用颜色 2。颜色写 `COLORRED` 这样的颜色名或 `COLOR` 加六位 BBGGRR；填充是半透明的，不挡住 K 线                                                                                                                             |
| `DRAWKLINE(最高,开盘,最低,收盘)`         | 用这四个值画 K 线，收盘不低于开盘的是涨，涨跌颜色跟随图表主题                                                                                                                                                                                                              |

- 绘图函数的参数每根 K 线都会计算，条件不成立时也一样，所以 `MA`、`REF` 这类函数放在参数里结果不变。
- 宽度、空心、图标编号、延长必须是数字或参数；文字要用引号括起来。
- 不写颜色时，箭头用图表主题的买入、卖出颜色，`DRAWKLINE` 用主题的涨跌颜色，其他图形依次用主题的线条颜色。国内看盘软件里 1、2 号图标固定是红、绿色，这里跟随主题，避免在绿涨红跌的图上把买入画成红色。
- `LINETHICK1`–`9` 设置线宽：普通的线和 `POLYLINE`、`DRAWLINE`、`VERTLINE` 都一样，1 是默认粗细，2–9 是 2–9 像素；`DOTLINE`、`DASHLINE` 把它们画成点线、虚线。用户在指标设置里改的线宽优先。
- `DRAWLINE` 不会预先画线：一条线在条件 2 成立的那根 K 线出现时才画上，画上之后不再改动。
- 绘图不显示在图例里。坐标会为柱子两端、标记、数字、折线的各点、直线的两端和带状区域留出空间，竖线不占坐标；副图里只有绘图也能正常显示。
- 绘图函数要单独成一句，不能放进表达式或赋给名称。

## 引用其他公式

`"公式名.线名"` 读另一个公式的一条线，用的是那个公式的默认参数：

```text
XG:CROSS("MACD.DIF","MACD.DEA") AND "KDJ.J"<20;
```

- 现成的公式按名称都可以引用：`MA`、`BOLL`、`MACD`、`KDJ`、`RSI`、`CCI`、`WR`、`BIAS`、`TRIX`、`OBV`。
- 自己的公式放进 `library` 选项后也可以引用，同名时优先于现成的：`{ library: { 我的均线: { formula: 'FAST:MA(C,N);', params: { N: 5 } } } }`。
- 名称不区分大小写；中文引号 `“”` 也可以。
- 同一个公式被引用多次只计算一次。互相引用成环、引用不存在的公式或线，都会报错并指出位置。公式按它的代码（`type`）认自己：引用同名的公式算引用自己；图例里显示的 `name` 不算，所以 `name: 'MACD'` 的公式照样能引用现成的 `"MACD.DIF"`。
- 被引用的公式本身写错了，报 `broken-reference`，位置指向引用的地方，说明里带上那个公式错在第几行第几列、错在哪里；`error.referenced` 是那个公式原来的 `FormulaError`。

## 与国内看盘软件的差别

- **无效值**：数据不够时（如 `MA(C,5)` 的前 4 根）、除以 0、和无效值比较，结果都是无效值，图上不画。均线类函数会跳过无效值。
- **K 线不足周期时的 `HHV`、`LLV`、`SUM`**：已有的 K 线还不到周期时，这里是无效值（`HHV(H,20)` 的前 19 根不画），和图表库内置指标一样；国内看盘软件一般用已有的几根算出值，所以开头这一段两边不一样，之后完全相同。要从第一根就有值，可以写 `IF(BARSCOUNT(C)>=20,HHV(H,20),HHV(H,0))`（周期 0 是从第一根算起）。
- **暂不支持**：其余绘图函数（`DRAWBMP`、`DRAWSL`、`DRAWGBK`、`FILLRGN`、`PARTLINE`、`DRAWTEXT_FIX` 等）、交易函数（`BUY`、`SELL`）、`AMOUNT`（K 线里没有成交额，结果为无效值）、跨周期引用（如 `"MACD.DIF#WEEK"`）、引用时指定参数。
- **时间**：`DATE` 和国内看盘软件一样从 1900 年算起（2026-10-21 是 `1261021`），`TIME` 是 `HHMMSS`（9:30 是 `93000`），`WEEKDAY` 中 0 是星期日。时间取 K 线的**开始时间**，而国内看盘软件的分钟线用的是结束时间：同一根 9:30–9:35 的 K 线，这里 `TIME` 是 `93000`，那边是 `93500`。
- **未来函数**：`ZIG`、`PEAK`、`PEAKBARS`、`TROUGH`、`TROUGHBARS`、`BACKSET`、`REFX`、`REFXV`、`CONST`、`XMA`、`CURRBARSCOUNT`、`TOTALBARSCOUNT`、`ISLASTBAR`、`BARSTATUS`、`BARSNEXT`、`FILTERX` 会用到之后的 K 线：画出来的线和信号会随新 K 线改写（重绘），回看时好看，实时却等不到，所以不支持。写了会报 `future-function` 错误，指出位置，有别的写法时一并提示，比如 `ZIG` 找的高低点可以用 `HHV`、`LLV` 加 `BARSLAST` 求已经确认的，`XMA` 可以换成 `MA`。
- **SAR 的起点**：各家软件 `SAR` 起步的写法不尽相同，这里的起点见上文；所以开头一段的数值和转向点可能和别的软件不一样，几次转向之后就相同了。起步那段过去之后（通常是开头几十根里的几次转向），和图表库内置的 SAR 每根都一致（参数换成小数：`SAR(10,2,20)` 对应 0.02、0.02、0.2）；`N` 为 1 时从头到尾都一致。
