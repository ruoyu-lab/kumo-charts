import { describe, expect, it } from 'vitest';
import { volumeCandlesSeries } from '../../src/chart-types/volume-candles';
import { lightTheme } from '../../src/options/themes';
import { barWidth } from '../../src/series/bar-width';
import { candlesSeries, ohlcSeries } from '../../src/series/bars';
import { columnsSeries } from '../../src/series/lines';
import { PointBuffer, type SeriesTypeDefinition } from '../../src/series/types';

/** The pixels left between bars, whatever the zoom, in place of the share of their spacing. */

/** A context recording the width of every body and column, and the length of every line across. */
function recorder() {
  const widths: number[] = [];
  const across: number[] = [];
  let from: { x: number; y: number } | null = null;
  const noop = () => undefined;
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    beginPath: noop,
    save: noop,
    restore: noop,
    clip: noop,
    fill: noop,
    stroke: noop,
    setLineDash: noop,
    rect: (_x: number, _y: number, width: number) => widths.push(width),
    fillRect: (_x: number, _y: number, width: number) => widths.push(width),
    moveTo: (x: number, y: number) => {
      from = { x, y };
    },
    lineTo: (x: number, y: number) => {
      if (from && from.y === y && from.x !== x) {
        across.push(Math.abs(x - from.x));
      }
    }
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, widths, across };
}

function paint<Style extends object>(
  definition: SeriesTypeDefinition<Style>,
  barSpacing: number,
  style: Partial<Style>
) {
  const points = new PointBuffer();
  points.reset(2);

  if (definition.input === 'value') {
    points.pushValue(100, 50, true);
    points.pushValue(100 + barSpacing, 60, false);
  } else {
    points.pushOhlc(100, 60, 40, 80, 50, 100, true);
    points.pushOhlc(100 + barSpacing, 50, 40, 80, 60, 100, false);
  }

  const recorded = recorder();
  definition.paint({
    ctx: recorded.ctx,
    pixelRatio: 1,
    width: 400,
    height: 300,
    barSpacing,
    style: { ...definition.defaultStyle(lightTheme, lightTheme.accent), ...style },
    points,
    valueToY: (value) => value,
    bars: null,
    first: 0,
    transform: null
  });
  return recorded;
}

describe('the gap between bars', () => {
  it('leaves the spacing less the gap, or the share of it without one, a pixel at least', () => {
    expect(barWidth(20, 0.72, null, 1)).toBe(14);
    expect(barWidth(20, 0.72, 2, 1)).toBe(18);
    expect(barWidth(40, 0.72, 2, 1)).toBe(38);
    expect(barWidth(2, 0.72, 4, 1)).toBe(1);
    expect(barWidth(2, 0.72, 4, 2)).toBe(0.5);
  });

  it.each([
    ['candles', candlesSeries],
    ['columns', columnsSeries]
  ] as const)('sizes the %s by it, as they are zoomed', (_, series) => {
    const definition = series as SeriesTypeDefinition<object>;
    expect(paint(definition, 20, {}).widths).toEqual([14, 14]);
    expect(paint(definition, 20, { gap: 3 }).widths).toEqual([17, 17]);
    expect(paint(definition, 40, { gap: 3 }).widths).toEqual([37, 37]);
  });

  it('makes the candle with the most volume as wide as a candle', () => {
    expect(Math.max(...paint(volumeCandlesSeries, 30, { gap: 4 }).widths)).toBe(26);
  });

  it('reaches the ticks of OHLC bars as near the next bars as it leaves', () => {
    expect(Math.max(...paint(ohlcSeries, 30, {}).across)).toBe(8);
    expect(Math.max(...paint(ohlcSeries, 30, { gap: 4 }).across)).toBe(13);
  });
});
