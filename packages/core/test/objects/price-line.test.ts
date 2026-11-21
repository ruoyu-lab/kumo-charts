import { describe, expect, it } from 'vitest';
import {
  draggedValue,
  labelPositionAt,
  layoutPriceLines,
  type PriceLineView
} from '../../src/objects/price-line';

function view(id: string, y: number): PriceLineView {
  return {
    id,
    y,
    color: '#000000',
    text: id,
    axisText: '',
    buttons: [],
    lineStyle: 'solid',
    emphasized: false
  };
}

const measure = (text: string) => text.length * 6;

describe('price line labels', () => {
  it('move apart downwards from the top', () => {
    const labels = layoutPriceLines([view('a', 50), view('b', 52)], 400, 300, 12, measure);

    expect(labels.map((label) => label.labelY)).toEqual([50, 72]);
  });

  it('move up where they would leave the plot at the bottom, each above the next', () => {
    const labels = layoutPriceLines(
      [view('a', 290), view('b', 292), view('c', 294)],
      400,
      300,
      12,
      measure
    );
    const bottoms = labels.map((label) => label.label.y + label.label.height);

    expect(bottoms[2]).toBeLessThanOrEqual(300);
    expect(labels.map((label) => label.labelY)).toEqual([246, 268, 290]);
  });

  it('leave the labels of lines below the plot where they are', () => {
    const labels = layoutPriceLines([view('a', 290), view('b', 400)], 400, 300, 12, measure);

    expect(labels.map((label) => label.labelY)).toEqual([290, 400]);
  });

  it('go where along the plot each says, apart only from those they would overlap', () => {
    const at = (id: string, y: number, position?: number): PriceLineView =>
      position === undefined ? view(id, y) : { ...view(id, y), position };
    const labels = layoutPriceLines(
      [at('a', 50, 0), at('b', 52, 0.5), at('c', 54), at('d', 56, 0.01), at('e', 58, 0.2)],
      400,
      300,
      12,
      measure
    );
    // Each label is 6 a letter and 6 each side: 18 wide; 8 from the edges.
    expect(labels.map((label) => Math.round(label.label.x * 100) / 100)).toEqual([
      8, 191, 374, 11.66, 81.2
    ]);
    // The two at the left that overlap are kept apart; the others stay at their lines.
    expect(labels.map((label) => label.labelY)).toEqual([50, 52, 54, 72, 58]);
  });

  it('are placed along the plot from where their left is, kept inside it', () => {
    // 400 wide, 18 wide labels, 8 from the edges: 366 of room.
    expect(labelPositionAt(8, 18, 400)).toBe(0);
    expect(labelPositionAt(191, 18, 400)).toBe(0.5);
    expect(labelPositionAt(-50, 18, 400)).toBe(0);
    expect(labelPositionAt(900, 18, 400)).toBe(1);
    expect(labelPositionAt(100, 500, 400)).toBe(1);
  });
});

describe('pinned price line labels', () => {
  const pinned = (views: PriceLineView[]) =>
    layoutPriceLines(views, 400, 300, 12, measure, true).map((label) => ({
      id: label.view.id,
      y: label.labelY,
      pinned: label.pinned
    }));

  it('stay at the edge the line lies beyond, stacked in the order of their lines', () => {
    expect(
      pinned([view('a', -50), view('b', -30), view('c', 150), view('d', 400), view('e', 380)])
    ).toEqual([
      { id: 'a', y: 10, pinned: 'top' },
      { id: 'b', y: 32, pinned: 'top' },
      { id: 'c', y: 150, pinned: null },
      { id: 'e', y: 268, pinned: 'bottom' },
      { id: 'd', y: 290, pinned: 'bottom' }
    ]);
  });

  it('keep a label that would be cut by the top edge inside the plot, with its line in view', () => {
    expect(pinned([view('a', 3)])).toEqual([{ id: 'a', y: 10, pinned: null }]);
  });

  it('give way to the label of a line in view that lies where they stack', () => {
    const labels = pinned([view('a', -50), view('b', 12)]);

    expect(labels.map((label) => label.y)).toEqual([10, 32]);
  });

  it('are only made when asked to: off, a label stays with its line out of the plot', () => {
    const labels = layoutPriceLines([view('a', -50)], 400, 300, 12, measure);

    expect(labels.map((label) => [label.labelY, label.pinned])).toEqual([[-50, null]]);
  });

  it('make room for the arrow, which the label starts with', () => {
    const [plain] = layoutPriceLines([view('a', 100)], 400, 300, 12, measure);
    const [edge] = layoutPriceLines([view('a', -100)], 400, 300, 12, measure, true);

    expect((edge?.label.width ?? 0) - (plain?.label.width ?? 0)).toBe(edge?.arrow);
    expect(edge?.arrow).toBeGreaterThan(0);
  });
});

describe('a dragged value', () => {
  /** A scale on which each pixel down is worth `pixel` less, from `top` at y 0. */
  const scale = (top: number, pixel: number) => ({ yToValue: (y: number) => top - y * pixel });

  it('keeps the decimals of a pane that writes them', () => {
    expect(draggedValue(scale(100, 0.0371), { kind: 'decimal', precision: 2 }, 10)).toBe(99.63);
  });

  it('keeps the power of ten a pixel is worth where the pane writes compact numbers', () => {
    const compact = { kind: 'compact' } as const;

    expect(draggedValue(scale(1_234_567, 2500), compact, 0)).toBe(1_235_000);
    expect(draggedValue(scale(4.56789e-7, 3e-9), compact, 0)).toBe(4.57e-7);
    expect(draggedValue(scale(0, 0), compact, 0)).toBe(0);
  });
});
