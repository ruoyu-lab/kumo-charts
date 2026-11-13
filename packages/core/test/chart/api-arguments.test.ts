import { describe, expect, it } from 'vitest';
import { chartWithBars, createTestChart, type Chart } from '../helpers/chart';

const CALLS: ReadonlyArray<readonly [string, (chart: Chart) => unknown]> = [
  [
    'data.set()',
    (chart) => {
      chart.data.set(undefined as never);
    }
  ],
  [
    'data.set(null)',
    (chart) => {
      chart.data.set(null as never);
    }
  ],
  ['data.prepend()', (chart) => chart.data.prepend(undefined as never)],
  [
    'batch()',
    (chart) => {
      chart.batch(undefined as never);
    }
  ],
  [
    'timeScale.setVisibleRange()',
    (chart) => {
      chart.timeScale.setVisibleRange(undefined as never);
    }
  ],
  [
    'timeScale.setVisibleLogicalRange()',
    (chart) => {
      chart.timeScale.setVisibleLogicalRange(undefined as never);
    }
  ],
  [
    'select()',
    (chart) => {
      chart.select(undefined as never);
    }
  ],
  ['indicators.label()', (chart) => chart.indicators.label(-1 as never)]
];

describe('what the chart says of arguments left out', () => {
  it.each(CALLS)('%s throws an error of the chart, not one of the language', (_name, call) => {
    const chart = chartWithBars(20);
    expect(() => call(chart)).toThrow(/\[kumochart\]/);
  });
});

describe('the screenshot of a chart with no size', () => {
  it('is an empty canvas, not an error of the browser', () => {
    const chart = createTestChart();
    chart.resize(0, 0);
    const canvas = chart.screenshot();
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });
});
