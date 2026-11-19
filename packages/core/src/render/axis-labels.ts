import type { ChartOptions } from '../options/types';
import type { Rect } from '../layout/layout';
import type { AxisLabel, AxisMark, Frame } from './frame';

/** How tall a label of `lines` lines is. */
export function labelHeight(options: ChartOptions, lines: number): number {
  const height = options.font.size + 8;
  return (height - 6) * lines + 6;
}

/**
 * The middle of the first line of a label of `lines` lines whose line is at `y`: there, or above it as much as centers
 * the whole label on it (`priceScale.labelAnchor`).
 */
export function firstLineY(options: ChartOptions, y: number, lines: number): number {
  return options.priceScale.labelAnchor === 'middle'
    ? y - (labelHeight(options, lines) - labelHeight(options, 1)) / 2
    : y;
}

/**
 * Where the labels of series' values go on an axis, at their values where they do not overlap:
 * moved apart, as charting platforms do, those above the latest price's label (`fixed`, which
 * stays) up from it and the others down, each past the one before.
 */
export function spreadLabels(
  ys: readonly number[],
  height: number,
  fixed: { readonly top: number; readonly bottom: number } | null
): number[] {
  const placed = [...ys];
  const order = ys.map((_, index) => index).sort((a, b) => (ys[a] ?? 0) - (ys[b] ?? 0));
  const middle = fixed ? (fixed.top + fixed.bottom) / 2 : Number.NEGATIVE_INFINITY;
  let edge = fixed?.top ?? Number.POSITIVE_INFINITY;

  for (const index of order.filter((each) => (ys[each] ?? 0) <= middle).reverse()) {
    placed[index] = Math.min(ys[index] ?? 0, edge - height / 2);
    edge = (placed[index] ?? 0) - height / 2;
  }

  edge = fixed?.bottom ?? Number.NEGATIVE_INFINITY;

  for (const index of order.filter((each) => (ys[each] ?? 0) > middle)) {
    placed[index] = Math.max(ys[index] ?? 0, edge + height / 2);
    edge = (placed[index] ?? 0) + height / 2;
  }

  return placed;
}

/** A label on a price axis: of a series' latest value, of the real-time price, or of the latest price. */
export interface PlacedLabel {
  readonly axis: Rect;
  /** The middle of its first line, from the top of the axis. */
  readonly y: number;
  readonly lines: number;
  /** The value it labels, or `null` for the latest price, whose label comes last, on top. */
  readonly mark: AxisMark | AxisLabel | null;
}

/**
 * The labels of the latest values on the price axes, apart from each other and from the label
 * of the latest price, which has a second line with the countdown.
 */
export function placeAxisLabels(
  frame: Frame,
  options: ChartOptions,
  countdown: boolean
): PlacedLabel[] {
  if (!options.priceScale.visible) {
    return [];
  }

  const latest = options.latestPrice.label ? frame.latest : null;
  const lines = countdown ? 2 : 1;
  const height = labelHeight(options, 1);
  const live = latest?.live ?? null;
  // The countdown under the price, the label as `priceScale.labelAnchor` puts it on the line.
  const latestY = latest ? firstLineY(options, latest.y, lines) : 0;
  const placed: PlacedLabel[] = [];

  for (const pane of frame.panes) {
    for (const side of ['right', 'left'] as const) {
      const axis = side === 'right' ? pane.axis : pane.left?.axis;
      const main = pane === frame.main && side === 'right';
      const marks: Array<AxisMark | AxisLabel> = [
        ...pane.marks.filter((mark) => mark.side === side),
        ...(main && live && Number.isFinite(live.y) ? [live] : [])
      ];
      const top = latestY - height / 2;
      const fixed =
        latest && main && Number.isFinite(latest.y)
          ? { top, bottom: top + labelHeight(options, lines) }
          : null;
      const ys = spreadLabels(
        marks.map((mark) => mark.y),
        height,
        fixed
      );

      if (axis) {
        marks.forEach((mark, index) => {
          placed.push({ axis, y: ys[index] ?? mark.y, lines: 1, mark });
        });
      }
    }
  }

  if (latest) {
    placed.push({ axis: frame.main.axis, y: latestY, lines, mark: null });
  }

  return placed;
}
