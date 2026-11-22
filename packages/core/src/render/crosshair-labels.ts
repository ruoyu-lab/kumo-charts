// Where the crosshair's labels lie on the axes. They are painted over the ticks there, on a layer
// of their own above the scene, as the label of the latest price is over the price ticks: the
// ticks stay.
import type { ChartOptions } from '../options/types';
import { labelHeight as axisLabelHeight, placeAxisLabels } from './axis-labels';
import type { Frame } from './frame';

/** Room on either side of the text of the crosshair's labels. */
export const LABEL_PADDING_X = 6;

/** The height of the crosshair's labels on the axes, and of each of the lines under its price. */
const labelHeight = (options: ChartOptions): number => options.font.size + 8;
/** With lines under it, the price and each line take as much room, close together inside `BLOCK_PADDING`. */
const lineHeight = (options: ChartOptions): number => options.font.size + 2;
const BLOCK_PADDING = 3;

/** Where the crosshair's price label lies on the right price axis, in the chart's coordinates. */
export interface PriceLabelSpan {
  readonly top: number;
  readonly bottom: number;
  /** The middle of the price. */
  readonly priceY: number;
  /** The middle of each of the lines with it (`crosshair.labels.priceLines`). */
  readonly lineY: (index: number) => number;
}

/**
 * Where the crosshair's price label at `y` lies with `lines` lines of text (`crosshair.labels.priceLines`): the whole label
 * centered on `y`, within the plot, the price on top and the lines evenly under it. Without lines, the label is as the
 * time label is. With `crosshair.labels.avoidLatest`, it is moved clear of the labels of the latest price and values.
 */
export function priceLabelSpan(
  frame: Frame,
  options: ChartOptions,
  y: number,
  lines: number
): PriceLabelSpan {
  const at = labelAt(frame, options, y, lines);
  return options.crosshair.labels.avoidLatest
    ? clearOf(frame, at, y, occupied(frame, options))
    : at;
}

/** Where the label lies at the pointer, as on the left price axis, where nothing moves it. */
export function labelAt(
  frame: Frame,
  options: ChartOptions,
  y: number,
  lines: number
): PriceLabelSpan {
  if (lines === 0) {
    const half = labelHeight(options) / 2;
    return { top: y - half, bottom: y + half, priceY: y, lineY: () => y };
  }

  const line = lineHeight(options);
  const half = line / 2 + BLOCK_PADDING;
  const plotBottom = frame.layout.timeAxis?.y ?? frame.layout.height;

  const height = 2 * half + lines * line;
  const top = Math.max(0, Math.min(y - height / 2, plotBottom - height));
  return moved(
    { top: 0, bottom: height, priceY: half, lineY: (index) => half + line * (index + 1) },
    top
  );
}

/** The label `by` lower. */
function moved(span: PriceLabelSpan, by: number): PriceLabelSpan {
  return {
    top: span.top + by,
    bottom: span.bottom + by,
    priceY: span.priceY + by,
    lineY: (index) => span.lineY(index) + by
  };
}

/** Where the labels of the latest price and values lie on the right price axes, in the chart's coordinates. */
function occupied(frame: Frame, options: ChartOptions): { top: number; bottom: number }[] {
  const right = new Set(frame.panes.map((pane) => pane.axis));
  const first = axisLabelHeight(options, 1) / 2;
  return placeAxisLabels(frame, options, (frame.latest?.countdown ?? null) !== null)
    .filter((label) => right.has(label.axis))
    .map((label) => {
      const top = label.axis.y + label.y - first;
      return { top, bottom: top + axisLabelHeight(options, label.lines) };
    });
}

/**
 * The label clear of `taken`: where it would cover some, against them on the side of the pointer at `y`, or on the
 * other where the plot has no room there. Labels closer together than the label is tall are passed as one.
 */
function clearOf(
  frame: Frame,
  span: PriceLabelSpan,
  y: number,
  taken: readonly { top: number; bottom: number }[]
): PriceLabelSpan {
  const height = span.bottom - span.top;
  const groups: { top: number; bottom: number }[] = [];

  for (const each of [...taken].sort((a, b) => a.top - b.top)) {
    const last = groups[groups.length - 1];

    if (last && each.top < last.bottom + height) {
      last.bottom = Math.max(last.bottom, each.bottom);
    } else {
      groups.push({ ...each });
    }
  }

  const covered = groups.find((group) => span.top < group.bottom && span.bottom > group.top);

  if (!covered) {
    return span;
  }

  const plotBottom = frame.layout.timeAxis?.y ?? frame.layout.height;
  const above = covered.top - height >= 0;
  const below = covered.bottom + height <= plotBottom;
  const up = (y < (covered.top + covered.bottom) / 2 && above) || !below;
  return moved(span, up ? covered.top - span.bottom : covered.bottom - span.top);
}

/** Where the crosshair's time label of `width` is centered: at its line, within the plot. */
export function timeLabelCenter(frame: Frame, x: number, width: number): number {
  return Math.min(Math.max(x, width / 2), Math.max(width / 2, frame.layout.plotWidth - width / 2));
}
