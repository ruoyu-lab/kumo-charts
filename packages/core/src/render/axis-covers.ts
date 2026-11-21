import type { Rect } from '../layout/layout';
import type { ChartOptions } from '../options/types';
import type { CrosshairView } from './cursor-painter';
import { labelHeight as axisLabelHeight, placeAxisLabels } from './axis-labels';
import type { Frame, TimeLabel } from './frame';

/** The room a label takes on a price axis, from the top of the axis. */
export interface AxisCover {
  readonly axis: Rect;
  readonly top: number;
  readonly bottom: number;
}

/** Where the crosshair's labels lie on the axes; the ticks there are left out. */
export interface CrosshairCovers {
  readonly price: readonly AxisCover[];
  /** The span of its time label, or `null` without one. */
  readonly time: { readonly left: number; readonly right: number } | null;
}

export const NO_COVERS: CrosshairCovers = { price: [], time: null };

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
  /** The middle of each of the lines with it (`crosshair.priceLines`). */
  readonly lineY: (index: number) => number;
}

/**
 * Where the crosshair's price label at `y` lies with `lines` lines of text (`crosshair.priceLines`). As
 * `priceScale.labelAnchor` says, the whole label is centered on `y`, within the plot, or the price stays at `y` and the
 * lines are evenly under it, or over it where the plot has no room under it. Without lines, the label is as the time
 * label is. With `crosshair.avoidLabels`, it is moved clear of the labels of the latest price and values.
 */
export function priceLabelSpan(
  frame: Frame,
  options: ChartOptions,
  y: number,
  lines: number
): PriceLabelSpan {
  const at = labelAt(frame, options, y, lines);
  return options.crosshair.avoidLabels ? clearOf(frame, at, y, occupied(frame, options)) : at;
}

/** Where the label lies at the pointer. */
function labelAt(frame: Frame, options: ChartOptions, y: number, lines: number): PriceLabelSpan {
  if (lines === 0) {
    const half = labelHeight(options) / 2;
    return { top: y - half, bottom: y + half, priceY: y, lineY: () => y };
  }

  const line = lineHeight(options);
  const half = line / 2 + BLOCK_PADDING;
  const plotBottom = frame.layout.timeAxis?.y ?? frame.layout.height;

  if (options.priceScale.labelAnchor === 'middle') {
    const height = 2 * half + lines * line;
    const top = Math.max(0, Math.min(y - height / 2, plotBottom - height));
    return moved(
      { top: 0, bottom: height, priceY: half, lineY: (index) => half + line * (index + 1) },
      top
    );
  }

  if (y + half + lines * line <= plotBottom) {
    return {
      top: y - half,
      bottom: y + half + lines * line,
      priceY: y,
      lineY: (index) => y + line * (index + 1)
    };
  }

  return {
    top: y - half - lines * line,
    bottom: y + half,
    priceY: y,
    lineY: (index) => y - line * (lines - index)
  };
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

/** Where the labels of `crosshair` lie on the axes; `measure` gives the width of a text. */
export function crosshairCovers(
  frame: Frame,
  options: ChartOptions,
  crosshair: CrosshairView | null,
  measure: (text: string) => number
): CrosshairCovers {
  if (!crosshair || !options.crosshair.labels) {
    return NO_COVERS;
  }

  const price: AxisCover[] = [];
  const { y } = crosshair;

  if (y !== null && options.priceScale.visible) {
    const half = labelHeight(options) / 2;
    // The right label is as tall as its lines make it.
    const right = priceLabelSpan(frame, options, y, crosshair.priceLines.length);

    // A label at the edge of a pane covers the axis of the next one too.
    for (const pane of frame.panes) {
      const top = right.top - pane.axis.y;
      const bottom = right.bottom - pane.axis.y;

      if (crosshair.priceText !== null && bottom > 0 && top < pane.axis.height) {
        price.push({ axis: pane.axis, top, bottom });
      }

      const leftTop = y - half - pane.axis.y;
      const leftBottom = y + half - pane.axis.y;

      if (
        crosshair.leftPriceText !== null &&
        pane.left &&
        leftBottom > 0 &&
        leftTop < pane.axis.height
      ) {
        price.push({ axis: pane.left.axis, top: leftTop, bottom: leftBottom });
      }
    }
  }

  let time: CrosshairCovers['time'] = null;

  if (crosshair.timeText !== null && frame.layout.timeAxis) {
    const width = measure(crosshair.timeText) + LABEL_PADDING_X * 2;
    const center = timeLabelCenter(frame, crosshair.x, width);
    time = { left: center - width / 2, right: center + width / 2 };
  }

  return { price, time };
}

/** Whether the text of a price tick at `y` on `axis`, `half` as tall as it is, meets a cover. */
export function priceTickCovered(
  covers: readonly AxisCover[],
  axis: Rect,
  y: number,
  half: number
): boolean {
  return covers.some(
    (cover) => cover.axis === axis && y + half > cover.top && y - half < cover.bottom
  );
}

export function timeTickCovered(covers: CrosshairCovers, tick: TimeLabel): boolean {
  const span = covers.time;
  return (
    span !== null && tick.x + tick.width / 2 > span.left && tick.x - tick.width / 2 < span.right
  );
}

/** The ticks the covers leave out, as a key that changes when they do. */
export function coveredTicks(frame: Frame, options: ChartOptions, covers: CrosshairCovers): string {
  const half = options.font.size / 2;
  const hidden: string[] = [];
  const panes = options.priceScale.hideCoveredTicks ? frame.panes : [];

  panes.forEach((pane, index) => {
    pane.ticks.forEach((tick, position) => {
      if (priceTickCovered(covers.price, pane.axis, tick.y, half)) {
        hidden.push(`${index}:${position}`);
      }
    });
    pane.left?.ticks.forEach((tick, position) => {
      if (priceTickCovered(covers.price, pane.left?.axis ?? pane.axis, tick.y, half)) {
        hidden.push(`${index}<${position}`);
      }
    });
  });
  frame.timeTicks.forEach((tick, position) => {
    if (timeTickCovered(covers, tick)) {
      hidden.push(`t${position}`);
    }
  });

  return hidden.join(',');
}
