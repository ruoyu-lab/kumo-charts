# Formulas

Indicator formulas written the way Chinese market software writes them become indicators of the pro chart as they are: computed bar by bar in real time, listed in the indicators window, added and changed in their parameters and lines by users like the built-in indicators, and able to carry alerts. Put the formula in `customIndicators` (or register it later with `registerIndicator()`), with `formula` in place of an algorithm's `definition`:

```ts
import { createProChart, type CustomIndicator } from '@kumo-charts/pro-chart';

const MYMACD: CustomIndicator = {
  name: { en: 'My MACD', zh: '我的 MACD' }, // the name after the code in the indicators window
  group: 'oscillators',
  formula: {
    type: 'MYMACD', // the code, shown in the indicators window and the legend; it cannot be the name of a built-in indicator
    name: 'MYMACD', // the name in the legend
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

The license for formula indicators is included in the commercial license. `name`, `group` and `origin` are as for other [custom indicators](custom-indicators.md).

## Options

| Option      | Description                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`      | The code, as `MYMACD`: used in the indicators window, the legend and the state, and it cannot be the name of a built-in indicator or of another custom indicator           |
| `name`      | The name shown in the legend                                                                                                                                               |
| `formula`   | The text of the formula                                                                                                                                                    |
| `params`    | Parameters, as `{ N: 9 }`; they can have ranges too: `{ N: { default: 9, min: 1, max: 100, integer: true } }`, by which the indicator settings window limits what is typed |
| `overlay`   | With `true`, drawn on the main pane; otherwise in a pane of its own below                                                                                                  |
| `precision` | The number of decimals; `price` follows the price (the default when drawn on the main pane), and `volume` is for volume                                                    |
| `levels`    | Horizontal reference lines, as `[20, 80]`                                                                                                                                  |
| `range`     | A fixed scale range for the pane below, as `{ min: 0, max: 100 }`                                                                                                          |
| `timeZone`  | The time zone of the time functions, as `Asia/Shanghai`; by default the time zone the chart shows times in, computed again in the new time zone when the user changes it   |
| `library`   | Other formulas that can be referenced, see "Referencing other formulas" below                                                                                              |

## When it is wrong

A formula is compiled at `createProChart()` or `registerIndicator()`, and a mistake throws a `FormulaError` (imported from `@kumo-charts/pro-chart`) right away: `code` says what kind of error it is, `span` is where it is, and `describe('zh')` is the description in Chinese (`describe()` gives it in English):

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

## Syntax

- `name:expression;` draws a line; `name:=expression;` only defines an intermediate variable; an expression without a name draws a line too.
- Operators: `+ - * /`, the comparisons `> < >= <= = <>`, and the logic `AND OR NOT` (or `&& || !`). Precedence from high to low: `* /`, `+ -`, comparisons, `NOT`, `AND`, `OR`. So `NOT C>O` without parentheses is the same as `NOT(C>O)`, as Chinese formulas usually write it: "not a rising bar"; `NOT` on one side of a comparison needs parentheses, as `C>NOT(O)`.
- Names are not case sensitive and can be Chinese; full-width Chinese punctuation (`；：，（）`) is recognized automatically, and text in quotes is kept as it is (the full-width comma in `'买入，加仓'` stays). Text and references can also be enclosed in the Chinese quotes `‘’` and `“”`; enclosed in ASCII quotes, they can contain Chinese quotes.
- Comments: `{ … }` and `// …`.
- Market data: `OPEN/O`, `HIGH/H`, `LOW/L`, `CLOSE/C`, `VOL/V/VOLUME`.
- Line attributes: colors such as `COLORRED`, `COLOR` followed by six digits of BBGGRR, `NODRAW`, `STICK`, `COLORSTICK`, `VOLSTICK`, `DOTLINE`, `DASHLINE`, `LINETHICK1`–`9` (the line width, see "Drawing functions").

## Functions

| Kind       | Functions                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Averages   | `MA` `EMA` `EXPMA` `SMA` `MEMA` `DMA` `WMA`                                                                                                                           |
| References | `REF` `BARSLAST` `BARSSINCE` `BARSCOUNT` `BARSLASTCOUNT`                                                                                                              |
| Statistics | `SUM` `HHV` `LLV` `HHVBARS` `LLVBARS` `COUNT` `EVERY` `EXIST` `SUMBARS` `STD` `STDP` `VAR` `VARP` `AVEDEV` `DEVSQ` `SLOPE` `FORCAST`                                  |
| Signals    | `CROSS` `LONGCROSS` `FILTER` `VALUEWHEN` `LAST` `NDAY` `UPNDAY` `DOWNNDAY`                                                                                            |
| Indicators | `SAR`                                                                                                                                                                 |
| Time       | `DATE` `TIME` `YEAR` `MONTH` `DAY` `HOUR` `MINUTE` `WEEKDAY` `BARPOS`                                                                                                 |
| Logic      | `IF` `IFF` `IFN` `NOT` `BETWEEN` `RANGE` `ISUP` `ISDOWN` `ISEQUAL`                                                                                                    |
| Math       | `ABS` `MAX` `MIN` `SQRT` `POW` `LN` `LOG` `EXP` `INTPART` `FRACPART` `CEILING` `FLOOR` `ROUND` `ROUND2` `SIGN` `MOD` `REVERSE` `SIN` `COS` `TAN` `ASIN` `ACOS` `ATAN` |
| Other      | `DRAWNULL`                                                                                                                                                            |

Details of a few functions:

- `LAST(X,A,B)`: 1 when X holds on every bar from A bars back to B bars back (both included). A of 0 counts from the first bar, and B of 0 up to the current bar; 0 when the stretch starts before the first bar, or when A is less than B.
- `NDAY(X,Y,N)`: X>Y on each of the last N bars. `UPNDAY(X,M)` and `DOWNNDAY(X,M)`: each of the last M bars greater (less) than the bar before, with equal not counting.
- `RANGE(A,B,C)`: 1 when A is greater than B and less than C, the ends not included; `BETWEEN` includes the ends.
- `ROUND(X)` rounds to an integer, and `ROUND2(X,N)` to N decimals: both round half away from zero, negative numbers too (`ROUND(-2.5)` is -3), and they round the decimal as written, so `ROUND2(1.005,2)` is 1.01. The fractional part of N is dropped, and a negative N gives an invalid value.
- `FRACPART(X)` is the fractional part, with its sign: `FRACPART(-3.5)` is -0.5.
- `VALUEWHEN(COND,X)`: X at the bar where COND last held; an invalid value before it first holds.
- `SUMBARS(X,A)`: how many bars back from the current one X must be added up to reach A or more; 1 when the current bar is enough, and the number of bars there are when all of them are not enough. Invalid values of X count as 0.
- `SAR(N,S,M)`: parabolic stop and reverse, with the step S and the limit M both in percent, as `SAR(10,2,20)`. The first N bars have no value and set the start: when the close of the bar after them is above the close of the first, it starts rising, with SAR starting from the lowest low of those N bars, and otherwise falling, starting from the highest high. Each bar after moves toward the trend's extreme, with an acceleration from S% that grows by S% at each new extreme, up to M%; it does not go inside the range of the two bars before; when the price crosses it, it reverses, starting again from the extreme of the trend before.

### Periods

A period argument (the `N` of `MA(C,N)`) can be a number, a parameter or arithmetic on them, or a series: `HHV(H,BARSLAST(CROSS(C,MA(C,5)))+1)` is the highest high since the last cross above the 5-day moving average, and `SUM(V,BARSLAST(CROSS(C,MA(C,5)))+1)` the volume over that time. Except for `LONGCROSS`, `FILTER` and `SAR`, periods can all be series.

- Written as a number or a parameter, a period must be an integer no less than the function's lower bound (see the next item), or compiling reports `invalid-period`, saying what the bound is; a negative period of `REF` refers to later bars (future data) and reports `future-reference`.
- With a series as the period, each bar uses its own value of the period, with the fractional part dropped (2.7 as 2); a period that is invalid or negative gives an invalid value.
- 0 means what it means when written as a number: an A of 0 for `SUM`, `HHV`, `LLV`, `HHVBARS`, `LLVBARS`, `COUNT` and `LAST` counts from the first bar, and a 0 for `REF` is the current bar. The periods of other functions are at least 1 (at least 2 for `STD`, `VAR`, `SLOPE` and `FORCAST`), and smaller gives an invalid value.
- Fewer bars than the period is also as when written as a number: `COUNT` and `EXIST` count the bars there are, `EVERY`, `NDAY`, `UPNDAY`, `DOWNNDAY` and `LAST` give 0, and the others an invalid value.
- Recursive averages such as `EMA` and `SMA` compute each bar with its own period, and a bar whose period is invalid gives an invalid value and takes no part in the recursion.

## Drawing functions

Signals on the bars are drawn as in the formulas of Chinese market software, each in a statement of its own, optionally followed by a color:

```text
金叉:=CROSS(MA(C,5),MA(C,10));
DRAWICON(金叉,LOW,1);
DRAWTEXT(金叉,HIGH+MA(HIGH-LOW,20),'金叉'),COLORRED;
STICKLINE(VOL>MA(VOL,20)*2,OPEN,CLOSE,0.8,0),COLORYELLOW;
DRAWBAND(MA(C,5),COLORRED,MA(C,20),COLORGREEN);
DRAWLINE(H>=HHV(H,20),H,L<=LLV(L,20),L,1),COLORMAGENTA,LINETHICK2;
```

| Function                                      | What it draws                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STICKLINE(cond,price1,price2,width,hollow)`  | A bar from price 1 to price 2 on the bars where the condition holds. A width of 0 is a thin line, 0.8 is as wide as a candle's body, and 1.1 or more fills the spacing; with hollow not 0, only the outline is drawn                                                                                                                                                                                                                                             |
| `DRAWTEXT(cond,price,'text')`                 | Text at the price (centered on it)                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `DRAWNUMBER(cond,price,number)`               | A number at the price (centered on it), which can be a series. Integers are written without decimals, and other numbers with the formula's decimals, as in the legend                                                                                                                                                                                                                                                                                            |
| `DRAWICON(cond,price,icon)`                   | Icon 1 is an up arrow, its tip pointing at the price from below; 2 is a down arrow, pointing at the price from above; other numbers draw a dot                                                                                                                                                                                                                                                                                                                   |
| `POLYLINE(cond,price)`                        | Joins the points where the condition holds into a polyline, skipping the bars in between; it can also be written `PLOYLINE`                                                                                                                                                                                                                                                                                                                                      |
| `VERTLINE(cond)`                              | A vertical line on the bars where the condition holds, from the top of the pane to its bottom                                                                                                                                                                                                                                                                                                                                                                    |
| `DRAWLINE(cond1,price1,cond2,price2,extend)`  | When condition 1 holds, the start is noted (and replaced when it holds again); when condition 2 holds after it, a straight line is drawn from the start to there, using up the start, and the next line waits for condition 1 to hold again. When both conditions hold on the same bar, the line before ends there first, and a new one starts there. Extend: 0 does not extend, 1 extends to the right edge of the pane, 2 or 10 to the left, 3 or 11 both ways |
| `DRAWBAND(value1,color1,value2,color2)`       | Fills between the two values with color 1 where value 1 is above value 2, and with color 2 otherwise. Colors are names such as `COLORRED`, or `COLOR` followed by six digits of BBGGRR; the fill is translucent, not hiding the bars                                                                                                                                                                                                                             |
| `DRAWKLINE(high,open,low,close)`              | Draws candles from these four values, rising when the close is not below the open, with the up and down colors of the chart's theme                                                                                                                                                                                                                                                                                                                              |
| `PARTLINE(price,cond1,color1,cond2,color2,…)` | Draws a line of the price, each bar in the color of the first condition that holds, and nothing where none holds; where one color turns into another the two pieces join, so it is a single line that changes color. One pair of a condition and a color can be given, or several                                                                                                                                                                                |
| `FILLRGN(price1,price2,cond1,color1,…)`       | Fills between the two prices, each bar in the color of the first condition that holds, and not where none holds; the fill is translucent, as dark as `DRAWBAND`                                                                                                                                                                                                                                                                                                  |
| `DRAWGBK(cond,color)`                         | Tints the background of the whole pane faintly in the color behind the bars where the condition holds, bars in a row joining into one block; it is below the bars, not hiding them                                                                                                                                                                                                                                                                               |

- The arguments of drawing functions are computed on every bar, whether or not the condition holds, so functions such as `MA` and `REF` in the arguments give the same results.
- Width, hollow, the icon number and extend must be numbers or parameters; text must be in quotes.
- Without a color, arrows use the buy and sell colors of the chart's theme, `DRAWKLINE` the theme's up and down colors, and other shapes the theme's line colors in turn. In Chinese market software, icons 1 and 2 are always red and green; here they follow the theme, so that buying is not drawn red on a chart where green is up.
- `LINETHICK1`–`9` sets the line width, the same for ordinary lines and for `POLYLINE`, `DRAWLINE` and `VERTLINE`: 1 is the default width, and 2–9 are 2–9 pixels; `DOTLINE` and `DASHLINE` draw them dotted and dashed. A line width the user changes in the indicator settings comes first.
- `DRAWLINE` draws no line ahead: a line is drawn when the bar where condition 2 holds appears, and does not change after it is drawn.
- Drawings are not shown in the legend. The scale leaves room for the ends of bars, marks, numbers, the points of polylines, the ends of straight lines and bands, while vertical lines take no room on it; a pane below with only drawings shows properly too.
- A drawing function must be a statement of its own, and cannot be put in an expression or given to a name.

## Referencing other formulas

`"formula.line"` reads a line of another formula, with that formula's default parameters:

```text
XG:CROSS("MACD.DIF","MACD.DEA") AND "KDJ.J"<20;
```

Parentheses after it give it parameters of its own, in the order of that formula's parameters, each a number or a parameter of this formula, with the defaults for those not given:

```text
快:"MACD.DIF"(5,20); 慢:"MACD.DIF"; 金叉:CROSS("MACD.DIF"(N,20,9),"MACD.DEA"(N,20,9));
```

- The ready-made formulas can all be referenced by name: `MA`, `BOLL`, `MACD`, `KDJ`, `RSI`, `CCI`, `WR`, `BIAS`, `TRIX` and `OBV`.
- Your own formulas can be referenced once they are in the `library` option, ahead of ready-made ones of the same name: `{ library: { 我的均线: { formula: 'FAST:MA(C,N);', params: { N: 5 } } } }`.
- Names are not case sensitive; the Chinese quotes `“”` work too.
- A formula referenced several times with the same parameters is computed once. Formulas referencing each other in a cycle, and references to formulas or lines that do not exist, are errors that point to where they are. A formula knows itself by its code (`type`): referencing a formula of the same name is referencing itself; the `name` shown in the legend does not count, so a formula with `name: 'MACD'` can still reference the ready-made `"MACD.DIF"`.
- When a referenced formula is itself wrong, `broken-reference` is reported, pointing to where it is referenced, with a description of the line and column where that formula is wrong and what is wrong there; `error.referenced` is that formula's own `FormulaError`.

## Differences from Chinese market software

- **Invalid values**: when there is not enough data (the first 4 bars of `MA(C,5)`, say), on division by 0 and in comparisons with invalid values, the result is an invalid value, not drawn on the chart. Averages skip invalid values.
- **`HHV`, `LLV` and `SUM` with fewer bars than the period**: with fewer bars than the period so far, the result here is an invalid value (the first 19 bars of `HHV(H,20)` are not drawn), as for the library's built-in indicators; Chinese market software usually computes a value from the bars there are, so the two differ for this stretch at the start and are the same after it. To have values from the first bar, write `IF(BARSCOUNT(C)>=20,HHV(H,20),HHV(H,0))` (a period of 0 counts from the first bar).
- **Not supported yet**: the other drawing functions (`DRAWBMP`, `DRAWSL`, `DRAWTEXT_FIX`, …), trading functions (`BUY`, `SELL`), `AMOUNT` (bars have no turnover, so the result is an invalid value), and references across timeframes (as `"MACD.DIF#WEEK"`).
- **Time**: `DATE` counts from 1900 as in Chinese market software (2026-10-21 is `1261021`), `TIME` is `HHMMSS` (9:30 is `93000`), and 0 in `WEEKDAY` is Sunday. Times are the **start** of the bar, while the minute bars of Chinese market software use the end: for the same 9:30–9:35 bar, `TIME` is `93000` here and `93500` there.
- **Future functions**: `ZIG`, `PEAK`, `PEAKBARS`, `TROUGH`, `TROUGHBARS`, `BACKSET`, `REFX`, `REFXV`, `CONST`, `XMA`, `CURRBARSCOUNT`, `TOTALBARSCOUNT`, `ISLASTBAR`, `BARSTATUS`, `BARSNEXT` and `FILTERX` use later bars: the lines and signals they draw are rewritten as new bars come (repainting), which looks good looking back but cannot be had in real time, so they are not supported. Writing one reports a `future-function` error that points to where it is, with another way of writing it when there is one: the highs and lows `ZIG` finds can be found once confirmed with `HHV`, `LLV` and `BARSLAST`, say, and `XMA` can become `MA`.
- **The start of SAR**: software differs in how `SAR` starts, and the start here is described above; so the values and reversals of the first stretch may differ from other software, and are the same after a few reversals. Past the start (usually a few reversals within the first few dozen bars), it agrees on every bar with the library's built-in SAR (with the parameters as fractions: `SAR(10,2,20)` is 0.02, 0.02 and 0.2); with an `N` of 1, they agree from start to end.
