import { describe, expect, it, vi } from 'vitest';
import type { BarColorContext } from '../../src/options/types';
import type { BarsView } from '../../src/data/types';
import {
  candlesSeries,
  hollowCandlesSeries,
  hollowGroupsOf,
  ohlcSeries
} from '../../src/series/bars';
import { volumeCandlesSeries } from '../../src/chart-types/volume-candles';
import { PointBuffer, type SeriesTypeDefinition } from '../../src/series/types';
import { lightTheme } from '../../src/options/themes';
import { chartWithBars } from '../helpers/chart';

/** A context recording the color of every fill and stroke. */
function recorder() {
  const painted: Array<{ kind: 'fill' | 'stroke'; color: string }> = [];
  const state = { fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: 'butt' };
  const noop = () => undefined;
  const ctx = {
    ...state,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    rect: noop,
    save: noop,
    restore: noop,
    clip: noop,
    setLineDash: noop,
    fill() {
      painted.push({ kind: 'fill', color: this.fillStyle });
    },
    stroke() {
      painted.push({ kind: 'stroke', color: this.strokeStyle });
    }
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, painted };
}

/** The raw bars behind the points, by their opens and closes. */
function barsOf(bars: ReadonlyArray<readonly [open: number, close: number]>): BarsView {
  return {
    length: bars.length,
    revision: 0,
    time: (index) => index,
    open: (index) => bars[index]?.[0] ?? NaN,
    high: (index) => Math.max(...(bars[index] ?? [NaN])),
    low: (index) => Math.min(...(bars[index] ?? [NaN])),
    close: (index) => bars[index]?.[1] ?? NaN,
    volume: () => 0,
    bar: () => null,
    lowerBound: () => 0
  };
}

function paint<Style extends object>(
  definition: SeriesTypeDefinition<Style>,
  points: PointBuffer,
  bars: BarsView | null = null,
  style: Partial<Style> = {}
) {
  const { ctx, painted } = recorder();
  definition.paint({
    ctx,
    pixelRatio: 1,
    width: 400,
    height: 300,
    barSpacing: 10,
    style: { ...definition.defaultStyle(lightTheme, lightTheme.accent), ...style },
    points,
    valueToY: (value) => value,
    bars,
    first: 0,
    transform: null
  });
  return painted;
}

/** The bars of `points()`: up from the open, and from the close before. */
const RISING = barsOf([
  [10, 12],
  [12, 14],
  [15, 13]
]);

/** A rising bar, a rising bar in teal and a falling bar in teal. */
function points(): PointBuffer {
  const buffer = new PointBuffer();
  buffer.reset(3);
  buffer.pushOhlc(10, 60, 40, 80, 50, 100, true);
  buffer.pushOhlc(20, 60, 40, 80, 50, 100, true, '#0d9488');
  buffer.pushOhlc(30, 50, 40, 80, 60, 100, false, '#0d9488');
  return buffer;
}

describe('bar colors', () => {
  it('draws the chosen colors over the style colors', () => {
    const fills = paint(candlesSeries, points())
      .filter((item) => item.kind === 'fill')
      .map((item) => item.color);

    expect(fills).toContain(lightTheme.up);
    expect(fills.filter((color) => color === '#0d9488')).toHaveLength(2);
    // Hollow candles keep rising bars hollow, in their chosen color.
    expect(
      paint(hollowCandlesSeries, points(), RISING).filter(
        (item) => item.kind === 'stroke' && item.color === '#0d9488'
      ).length
    ).toBeGreaterThanOrEqual(2);
    expect(paint(ohlcSeries, points()).map((item) => item.color)).toEqual([
      lightTheme.up,
      lightTheme.down,
      '#0d9488',
      '#0d9488'
    ]);
  });

  it.each([
    ['candles', candlesSeries],
    ['volume candles', volumeCandlesSeries]
  ])(
    'draws the %s that rise hollow, outlined in their color, where the style asks',
    (_, series) => {
      const painted = paint(series, points(), null, { hollowUp: true });
      const fills = painted.filter((item) => item.kind === 'fill').map((item) => item.color);

      // Only the falling ones are filled, in the down color and the chosen one; the rising ones are outlined.
      expect(fills).toEqual([lightTheme.down, '#0d9488']);
      expect(painted).toContainEqual({ kind: 'stroke', color: lightTheme.up });
      expect(
        painted.filter((item) => item.kind === 'stroke' && item.color === '#0d9488').length
      ).toBeGreaterThanOrEqual(2);
    }
  );

  it('reads the color of each bar once, however many colors there are', () => {
    const count = 500;
    const buffer = new PointBuffer();
    buffer.reset(count);

    for (let index = 0; index < count; index += 1) {
      const color = index % 2 === 0 ? null : `#${String(index).padStart(6, '0')}`;
      buffer.pushOhlc(index, 60, 40, 80, 50, 100, index % 3 === 0, color);
    }

    let reads = 0;
    const counted = Object.create(buffer, {
      color: {
        value: (index: number) => {
          reads += 1;
          return buffer.color(index);
        }
      }
    }) as PointBuffer;

    const readsOf = (painting: () => void) => {
      reads = 0;
      painting();
      return reads;
    };

    expect(readsOf(() => paint(candlesSeries, counted))).toBe(count);
    const flat = barsOf(Array.from({ length: count }, () => [50, 50] as const));
    expect(readsOf(() => paint(hollowCandlesSeries, counted, flat))).toBe(count);
    expect(readsOf(() => paint(ohlcSeries, counted))).toBe(count);
  });

  it('asks for the color of every visible bar, with indicator values at hand', () => {
    const chart = chartWithBars(200);
    const ma = chart.indicators.add({ id: 'ma', type: 'MA', params: { periods: [5] } });
    const seen: Array<{ index: number; close: number; ma: number }> = [];
    const barColor = vi.fn(({ index, bar, indicator }: BarColorContext) => {
      seen.push({ index, close: bar.close, ma: indicator(ma) });
      return bar.close > indicator(ma, 'ma5') ? '#0d9488' : null;
    });
    chart.applyOptions({ mainSeries: { barColor } });
    chart.screenshot();

    const visible = chart.timeScale.visibleLogicalRange();
    const last = seen.at(-1);
    expect(seen.length).toBeGreaterThan(20);
    expect(last?.index).toBe(chart.data.length - 1);
    expect(last?.close).toBe(chart.data.last()?.close);
    expect(last?.ma).toBeCloseTo(chart.indicators.valuesAt(ma)[0]?.value ?? Number.NaN);
    expect(seen[0]?.index).toBeLessThanOrEqual(Math.ceil(visible?.from ?? 0));
  });

  it('names a bad color or an unknown indicator', () => {
    const chart = chartWithBars(50);
    chart.applyOptions({ mainSeries: { barColor: () => 3 as never } });
    expect(() => chart.screenshot()).toThrow(
      'mainSeries.barColor must return a color string or null, received 3'
    );

    chart.applyOptions({ mainSeries: { barColor: ({ indicator }) => String(indicator('nope')) } });
    expect(() => chart.screenshot()).toThrow('unknown indicator "nope"');

    expect(() => {
      chart.applyOptions({ mainSeries: { barColor: 'red' as never } });
    }).toThrow('options.mainSeries.barColor');
  });
});

describe('hollow candles', () => {
  it('take their color from the close before, and are hollow when they close above their open', () => {
    const bars = barsOf([
      [10, 12], // the first of all, against its own open: up, hollow
      [13, 11], // below the close before: down; under its open: filled
      [9, 11.5], // above the close before: up; over its open: hollow
      [12, 11.8], // above the close before: up; under its open: filled
      [10, 11] // below the close before: down; over its open: hollow
    ]);
    const buffer = new PointBuffer();
    buffer.reset(5);

    for (let index = 0; index < 5; index += 1) {
      buffer.pushOhlc(index * 10, 60, 40, 80, 50, 100, true);
    }

    const groups = hollowGroupsOf({
      ctx: recorder().ctx,
      pixelRatio: 1,
      width: 400,
      height: 300,
      barSpacing: 10,
      style: hollowCandlesSeries.defaultStyle(lightTheme, lightTheme.accent),
      points: buffer,
      valueToY: (value) => value,
      bars,
      first: 0,
      transform: null
    });

    expect(
      groups
        .map((group) => ({ up: group.up, filled: group.filled, indices: group.indices }))
        .sort((a, b) => (a.indices[0] ?? 0) - (b.indices[0] ?? 0))
    ).toEqual([
      { up: true, filled: false, indices: [0, 2] },
      { up: false, filled: true, indices: [1] },
      { up: true, filled: true, indices: [3] },
      { up: false, filled: false, indices: [4] }
    ]);
  });
});

describe('the wicks of candles', () => {
  it('stop at the body, so that a hollow or see-through body shows nothing inside', () => {
    const lines: Array<[number, number]> = [];
    let from = 0;
    const noop = () => undefined;
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      beginPath: noop,
      rect: noop,
      save: noop,
      restore: noop,
      clip: noop,
      fill: noop,
      stroke: noop,
      setLineDash: noop,
      moveTo: (_x: number, y: number) => {
        from = y;
      },
      lineTo: (_x: number, y: number) => {
        lines.push([Math.min(from, y), Math.max(from, y)]);
      }
    } as unknown as CanvasRenderingContext2D;
    // y: high 40, open 80, close 50, low 100: a rising candle, its body from 50 to 80.
    const buffer = new PointBuffer();
    buffer.reset(1);
    buffer.pushOhlc(10, 80, 40, 100, 50, 100, true);

    for (const series of [candlesSeries, hollowCandlesSeries]) {
      lines.length = 0;
      series.paint({
        ctx,
        pixelRatio: 1,
        width: 400,
        height: 300,
        barSpacing: 10,
        style: series.defaultStyle(lightTheme, lightTheme.accent),
        points: buffer,
        valueToY: (value) => value,
        bars: barsOf([[10, 12]]),
        first: 0,
        transform: null
      });
      const wicks = lines.filter(([top, bottom]) => top === 40 || bottom === 100);
      expect(wicks).toEqual([
        [40, 50],
        [80, 100]
      ]);
    }
  });
});
