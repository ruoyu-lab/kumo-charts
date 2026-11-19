import type { Rect } from '../layout/layout';
import type { ChartOptions } from '../options/types';
import type { CrosshairView } from './cursor-painter';
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

/**
 * Where the crosshair's price label at `y` lies with `lines` lines of text (`crosshair.priceLines`): from its top to its
 * bottom, and the middle of each line. The price stays at `y`, the lines evenly under it, or over it where the plot has
 * no room under it. Without lines, the label is as the time label is.
 */
export function priceLabelSpan(
  frame: Frame,
  options: ChartOptions,
  y: number,
  lines: number
): { readonly top: number; readonly bottom: number; readonly lineY: (index: number) => number } {
  if (lines === 0) {
    const half = labelHeight(options) / 2;
    return { top: y - half, bottom: y + half, lineY: () => y };
  }

  const line = lineHeight(options);
  const half = line / 2 + BLOCK_PADDING;
  const plotBottom = frame.layout.timeAxis?.y ?? frame.layout.height;

  if (y + half + lines * line <= plotBottom) {
    return {
      top: y - half,
      bottom: y + half + lines * line,
      lineY: (index) => y + line * (index + 1)
    };
  }

  return {
    top: y - half - lines * line,
    bottom: y + half,
    lineY: (index) => y - line * (lines - index)
  };
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

  frame.panes.forEach((pane, index) => {
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
