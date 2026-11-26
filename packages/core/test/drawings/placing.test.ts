import { describe, expect, it } from 'vitest';
import type { Chart } from '../helpers/chart';
import { MINUTE, T0 } from '../helpers/bars';
import { chartWithBars, click, drag, nextFrame, pointer } from '../helpers/chart';
import { canvasCalls, type CanvasCall } from '../setup';

/** Chart coordinates of bar `index` at `price`, in the main pane or another. */
function at(chart: Chart, index: number, price: number, pane = 'main'): [number, number] {
  const x = chart.timeScale.timeToX(T0 + index * MINUTE);
  const y = chart.priceScale(pane).priceToY(price);

  if (x === null || y === null) {
    throw new Error('Point is outside the chart.');
  }

  return [x, y];
}

/** A chart of 200 bars with an RSI pane. */
function withRsi(): { chart: Chart; rsi: string } {
  const chart = chartWithBars(200);
  const id = chart.indicators.add({ type: 'RSI' });
  return { chart, rsi: chart.indicators.get(id)?.pane ?? '' };
}

describe('a tool places nothing that would draw nothing', () => {
  it('anchors no VWAP after the last bar, where it has no bars to average', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('anchored-vwap');
    click(chart, ...at(chart, 203, 170));

    expect(chart.drawings.list()).toEqual([]);
    expect(chart.drawings.activeTool()).toBe('anchored-vwap');

    click(chart, ...at(chart, 150, 170));
    expect(chart.drawings.list().map((drawing) => drawing.type)).toEqual(['anchored-vwap']);
  });

  it('ends no regression trend on the bar it starts at, which fits no line', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('regression-trend');
    click(chart, ...at(chart, 150, 170));
    click(chart, ...at(chart, 150, 180));

    expect(chart.drawings.list()).toEqual([]);

    click(chart, ...at(chart, 170, 180));
    const [drawing] = chart.drawings.list();
    expect(drawing?.points.map((point) => point.time)).toEqual([
      T0 + 150 * MINUTE,
      T0 + 170 * MINUTE
    ]);
  });
});

describe('types computed from the bars of the main pane', () => {
  it.each([
    'anchored-vwap',
    'regression-trend',
    'long-position',
    'short-position',
    'fixed-range-volume-profile'
  ])('draws %s on the main pane only', (type) => {
    const { chart, rsi } = withRsi();
    chart.drawings.startTool(type);
    click(chart, ...at(chart, 150, 50, rsi));
    click(chart, ...at(chart, 170, 60, rsi));

    expect(chart.drawings.list()).toEqual([]);
    expect(chart.drawings.definition(type)?.mainPane).toBe(true);

    const points = Array.from({ length: chart.drawings.definition(type)?.points ?? 0 }, () => ({
      time: T0 + 150 * MINUTE,
      price: 50
    }));
    expect(() => chart.drawings.add({ type, pane: rsi, points })).toThrow('main pane');
  });

  it('moves none of them to another pane', () => {
    const { chart, rsi } = withRsi();
    const id = chart.drawings.add({
      type: 'anchored-vwap',
      points: [{ time: T0 + 150 * MINUTE, price: 0 }]
    });

    expect(() => {
      chart.drawings.update(id, { pane: rsi });
    }).toThrow('main pane');
  });
});

describe('a tool while every drawing is hidden', () => {
  it('places nothing, and the chart pans as it does without a tool', () => {
    const chart = chartWithBars(200);
    chart.applyOptions({ drawings: { visible: false } });
    chart.drawings.startTool('trend-line');
    click(chart, ...at(chart, 150, 170));
    click(chart, ...at(chart, 170, 180));

    expect(chart.drawings.list()).toEqual([]);

    const before = chart.timeScale.visibleLogicalRange();
    drag(chart, at(chart, 150, 170), at(chart, 160, 170));
    expect(chart.timeScale.visibleLogicalRange()?.from).toBeLessThan(before?.from ?? 0);
    expect(chart.drawings.activeTool()).toBe('trend-line');

    chart.applyOptions({ drawings: { visible: true } });
    click(chart, ...at(chart, 150, 170));
    click(chart, ...at(chart, 170, 180));
    expect(chart.drawings.list()).toHaveLength(1);
  });
});

describe('a finger', () => {
  const finger = { pointerType: 'touch', pointerId: 1 } as const;
  const timesOf = (chart: Chart) =>
    chart.drawings.list().map((drawing) => drawing.points.map((point) => point.time));

  /** A finger pressing at `from`, dragging through `through` and lifting at the last of them. */
  function stroke(chart: Chart, from: [number, number], ...through: [number, number][]): void {
    pointer(chart, 'pointerdown', ...from, finger);

    for (const point of through) {
      pointer(chart, 'pointermove', ...point, finger);
    }

    const end = through.at(-1) ?? from;
    pointer(chart, 'pointerup', ...end, finger);
  }

  it('draws a line in one stroke: from where it pressed to where it lifts', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('trend-line');
    stroke(chart, at(chart, 150, 170), at(chart, 160, 175), at(chart, 170, 180));

    expect(timesOf(chart)).toEqual([[T0 + 150 * MINUTE, T0 + 170 * MINUTE]]);
  });

  it('draws the line from where it pressed to the finger while it drags', async () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('trend-line');
    const objects = chart.element.querySelector<HTMLCanvasElement>('canvas[data-layer="objects"]');
    const calls = canvasCalls(objects as HTMLCanvasElement);
    pointer(chart, 'pointerdown', ...at(chart, 150, 170), finger);
    await nextFrame();
    calls.length = 0;
    pointer(chart, 'pointermove', ...at(chart, 160, 175), finger);
    await nextFrame();

    expect(chart.drawings.list()).toEqual([]);
    expect(calls.filter((call) => call.name === 'lineTo')).not.toEqual([]);
  });

  it('places one anchor with a tap, where it lifts, and the next with the next tap', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('trend-line');
    stroke(chart, at(chart, 150, 170));

    expect(chart.drawings.list()).toEqual([]);

    stroke(chart, at(chart, 170, 180));
    expect(timesOf(chart)).toEqual([[T0 + 150 * MINUTE, T0 + 170 * MINUTE]]);
  });

  it('places the first two anchors of a longer drawing with a stroke, the others where it lifts', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('parallel-channel');
    stroke(chart, at(chart, 150, 170), at(chart, 160, 175), at(chart, 170, 180));

    expect(chart.drawings.list()).toEqual([]);

    stroke(chart, at(chart, 175, 170), at(chart, 180, 175));
    expect(timesOf(chart)).toEqual([[T0 + 150 * MINUTE, T0 + 170 * MINUTE, T0 + 180 * MINUTE]]);
  });

  it('places a drawing of one anchor where it lifts, after a drag', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('vertical-line');
    stroke(chart, at(chart, 150, 170), at(chart, 160, 175), at(chart, 170, 180));

    expect(timesOf(chart)).toEqual([[T0 + 170 * MINUTE]]);
  });

  it('places nothing where it pressed when a pinch takes the stroke', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('trend-line');
    const [x, y] = at(chart, 150, 170);
    pointer(chart, 'pointerdown', x, y, finger);
    pointer(chart, 'pointermove', ...at(chart, 160, 175), finger);
    pointer(chart, 'pointerdown', x + 100, y, { pointerType: 'touch', pointerId: 2 });
    pointer(chart, 'pointerup', x + 100, y, { pointerType: 'touch', pointerId: 2 });
    pointer(chart, 'pointerup', ...at(chart, 160, 175), finger);
    stroke(chart, at(chart, 120, 170), at(chart, 130, 175), at(chart, 140, 180));

    expect(timesOf(chart)).toEqual([[T0 + 120 * MINUTE, T0 + 140 * MINUTE]]);
  });
});

describe('a press that is lost', () => {
  const touch = (id: number) => ({ pointerType: 'touch', pointerId: id }) as const;

  it('places no anchor where the first finger of a pinch went down', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('trend-line');
    const [x, y] = at(chart, 150, 170);
    pointer(chart, 'pointerdown', x, y, touch(1));
    pointer(chart, 'pointerdown', x + 100, y, touch(2));
    pointer(chart, 'pointermove', x + 140, y, touch(2));
    pointer(chart, 'pointerup', x, y, touch(1));
    pointer(chart, 'pointerup', x + 140, y, touch(2));
    click(chart, ...at(chart, 170, 180));

    expect(chart.drawings.list()).toEqual([]);
  });

  it('places no anchor where a mouse pressed before the window lost focus', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('parallel-channel');
    click(chart, ...at(chart, 150, 170));
    pointer(chart, 'pointerdown', ...at(chart, 160, 175));
    window.dispatchEvent(new Event('blur'));
    click(chart, ...at(chart, 170, 180));
    click(chart, ...at(chart, 180, 175));

    expect(chart.drawings.list()[0]?.points.map((point) => point.time)).toEqual([
      T0 + 150 * MINUTE,
      T0 + 170 * MINUTE,
      T0 + 180 * MINUTE
    ]);
  });
});

describe('what a tool and a drag repaint', () => {
  /** Clears what a layer drew, then returns the calls it makes in the next frame. */
  async function paintedOn(chart: Chart, layer: string, run: () => void): Promise<CanvasCall[]> {
    const canvas = chart.element.querySelector<HTMLCanvasElement>(`canvas[data-layer="${layer}"]`);
    await nextFrame();
    const calls = canvasCalls(canvas as HTMLCanvasElement);
    calls.length = 0;
    run();
    await nextFrame();
    return [...calls];
  }

  /**
   * Whether the series paint again in the next frame: the scene is cleared to paint afresh; the
   * axes painting again alone, as the crosshair moves, leave them.
   */
  async function seriesPainted(chart: Chart, run: () => void): Promise<boolean> {
    return (await paintedOn(chart, 'scene', run)).some((call) => call.name === 'clearRect');
  }

  it('leaves the series alone while a tool previews its drawing', async () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('trend-line');
    click(chart, ...at(chart, 150, 170));
    const move = () => {
      for (const index of [155, 160, 165]) {
        pointer(chart, 'pointermove', ...at(chart, index, 175), { buttons: 0 });
      }
    };

    expect(await seriesPainted(chart, move)).toBe(false);
    expect(await paintedOn(chart, 'objects', move)).not.toEqual([]);
  });

  it('repaints the series only for a drawing that paints under them', async () => {
    const chart = chartWithBars(200);
    const line = chart.drawings.add({
      type: 'horizontal-line',
      points: [{ time: T0 + 150 * MINUTE, price: 170 }]
    });
    chart.drawings.add({
      type: 'long-position',
      points: [
        { time: T0 + 120 * MINUTE, price: 150 },
        { time: T0 + 140 * MINUTE, price: 160 },
        { time: T0 + 140 * MINUTE, price: 145 }
      ]
    });
    const dragged = (from: [number, number]) => () => {
      pointer(chart, 'pointerdown', ...from);
      pointer(chart, 'pointermove', from[0], from[1] - 20);
      pointer(chart, 'pointermove', from[0], from[1] - 40);
    };

    expect(chart.drawings.get(line)).not.toBeNull();
    expect(await seriesPainted(chart, dragged(at(chart, 180, 170)))).toBe(false);
    pointer(chart, 'pointerup', 0, 0);
    // The position by the edge at its target: its zones are a fill, which a press goes through.
    expect(await seriesPainted(chart, dragged(at(chart, 125, 160)))).toBe(true);
  });
});

describe('a click on the anchor before', () => {
  it('places no second anchor there, as the clicks of a double click would', () => {
    const chart = chartWithBars(200);
    chart.drawings.startTool('trend-line');
    click(chart, ...at(chart, 150, 170));
    click(chart, ...at(chart, 150, 170));

    expect(chart.drawings.list()).toEqual([]);

    click(chart, ...at(chart, 170, 180));
    expect(chart.drawings.list()[0]?.points.map((point) => point.time)).toEqual([
      T0 + 150 * MINUTE,
      T0 + 170 * MINUTE
    ]);
  });
});
