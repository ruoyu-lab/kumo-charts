import { alignToDevice, snap } from '../canvas/canvas';
import type { CandleStyle, HighLowStyle, OhlcStyle } from './styles';
import type { SeriesPaintContext, SeriesPoints, SeriesTypeDefinition } from './types';

/** Points drawn alike: rising or falling, with the style's colors or one chosen color. */
export interface PointGroup {
  readonly up: boolean;
  /** The chosen color, or `null` for the style's up or down colors. */
  readonly color: string | null;
  /** The points of the group, in order. */
  readonly indices: readonly number[];
}

/**
 * The groups to draw: the style's directions first, then each chosen color by direction, in the
 * order they first appear; one pass over the points, whatever the number of colors.
 */
export function groupsOf(points: SeriesPoints): PointGroup[] {
  const rising: number[] = [];
  const falling: number[] = [];
  const chosen: Array<{ up: boolean; color: string; indices: number[] }> = [];
  const byColor = new Map<string, { rising?: number[]; falling?: number[] }>();

  for (let index = 0; index < points.count; index += 1) {
    const up = points.isUp(index);
    const color = points.color(index);

    if (color === null) {
      (up ? rising : falling).push(index);
      continue;
    }

    let pair = byColor.get(color);

    if (!pair) {
      pair = {};
      byColor.set(color, pair);
    }

    let indices = up ? pair.rising : pair.falling;

    if (!indices) {
      indices = [];
      pair[up ? 'rising' : 'falling'] = indices;
      chosen.push({ up, color, indices });
    }

    indices.push(index);
  }

  return [
    { up: true, color: null, indices: rising },
    { up: false, color: null, indices: falling },
    ...chosen
  ];
}

/** Candles drawn alike: in one color, filled or hollow. */
interface CandleGroup {
  readonly up: boolean;
  /** The chosen color, or `null` for the style's up or down colors. */
  readonly color: string | null;
  readonly filled: boolean;
  readonly indices: readonly number[];
}

function paintCandles(
  context: SeriesPaintContext<CandleStyle>,
  groups: readonly CandleGroup[]
): void {
  const { ctx, points, style, pixelRatio, barSpacing } = context;
  const width = Math.max(1 / pixelRatio, alignToDevice(barSpacing * style.bodyRatio, pixelRatio));
  const thin = width * pixelRatio < 3;
  const hairline = 1 / pixelRatio;
  ctx.setLineDash([]);

  for (const group of groups) {
    const { up, color, filled } = group;
    const bodyColor = color ?? (up ? style.upColor : style.downColor);

    if (style.wick || thin) {
      ctx.beginPath();

      for (const index of group.indices) {
        const x = snap(points.x(index), 1, pixelRatio);
        const high = points.high(index);
        const low = points.low(index);

        if (thin) {
          ctx.moveTo(x, high);
          ctx.lineTo(x, low);
          continue;
        }

        // Up to the body and on from it, not through it: a hollow body, or one see-through, shows nothing inside.
        const open = points.open(index);
        const close = points.close(index);
        const top = alignToDevice(Math.min(open, close), pixelRatio);
        const bottom = top + Math.max(hairline, alignToDevice(Math.abs(close - open), pixelRatio));
        ctx.moveTo(x, Math.min(high, low));
        ctx.lineTo(x, top);
        ctx.moveTo(x, bottom);
        ctx.lineTo(x, Math.max(high, low));
      }

      ctx.strokeStyle =
        thin || color !== null ? bodyColor : up ? style.upWickColor : style.downWickColor;
      ctx.lineWidth = hairline;
      ctx.stroke();
    }

    if (thin) {
      continue;
    }

    ctx.beginPath();

    for (const index of group.indices) {
      const open = points.open(index);
      const close = points.close(index);
      ctx.rect(
        alignToDevice(points.x(index) - width / 2, pixelRatio),
        alignToDevice(Math.min(open, close), pixelRatio),
        width,
        Math.max(hairline, alignToDevice(Math.abs(close - open), pixelRatio))
      );
    }

    if (filled) {
      ctx.fillStyle = bodyColor;
      ctx.fill();
    }

    if (style.border || !filled) {
      // Clipping to the bodies keeps the border inside them, so it never widens a candle.
      ctx.save();
      ctx.clip();
      ctx.strokeStyle =
        filled && color === null ? (up ? style.upBorderColor : style.downBorderColor) : bodyColor;
      ctx.lineWidth = 2 * Math.max(hairline, alignToDevice(1, pixelRatio));
      ctx.stroke();
      ctx.restore();
    }
  }
}

/**
 * The groups of hollow candles. Each takes its color from where it closed against the close before it (up at or above it,
 * down below), the first bar of all against its own open; and it is hollow when it closed above its open, filled when
 * at or below it. So a candle can rise within its bar and still be down from the bar before: hollow, in the down color.
 */
export function hollowGroupsOf(context: SeriesPaintContext<CandleStyle>): CandleGroup[] {
  const { points, bars, first } = context;
  const groups = new Map<
    string,
    { up: boolean; color: string | null; filled: boolean; indices: number[] }
  >();

  if (!bars) {
    return [];
  }

  for (let index = 0; index < points.count; index += 1) {
    const bar = first + index;
    const close = bars.close(bar);
    const before = bar > 0 ? bars.close(bar - 1) : bars.open(bar);
    const up = close >= before;
    const filled = close <= bars.open(bar);
    const color = points.color(index);
    const key = `${String(up)}|${String(filled)}|${color ?? ''}`;
    let group = groups.get(key);

    if (!group) {
      group = { up, color, filled, indices: [] };
      groups.set(key, group);
    }

    group.indices.push(index);
  }

  return [...groups.values()];
}

export function candleStyle(up: string, down: string): CandleStyle {
  return {
    upColor: up,
    downColor: down,
    upWickColor: up,
    downWickColor: down,
    upBorderColor: up,
    downBorderColor: down,
    wick: true,
    border: false,
    bodyRatio: 0.72,
    hollowUp: false,
    hollowDown: false
  };
}

export const candlesSeries: SeriesTypeDefinition<CandleStyle> = {
  type: 'candles',
  input: 'ohlc',
  defaultStyle: (theme) => candleStyle(theme.up, theme.down),
  paint: (context) => {
    paintCandles(
      context,
      groupsOf(context.points).map((group) => ({
        ...group,
        filled: !(group.up ? context.style.hollowUp : context.style.hollowDown)
      }))
    );
  }
};

export const hollowCandlesSeries: SeriesTypeDefinition<CandleStyle> = {
  type: 'hollow-candles',
  input: 'ohlc',
  defaultStyle: (theme) => candleStyle(theme.up, theme.down),
  paint: (context) => {
    paintCandles(context, hollowGroupsOf(context));
  }
};

export const ohlcSeries: SeriesTypeDefinition<OhlcStyle> = {
  type: 'ohlc',
  input: 'ohlc',
  defaultStyle: (theme) => ({
    upColor: theme.up,
    downColor: theme.down,
    lineWidth: 1,
    ticks: true
  }),
  paint: ({ ctx, points, style, pixelRatio, barSpacing }) => {
    const tick = Math.max(1, Math.min(barSpacing * 0.4, 8));
    const ticks = style.ticks && barSpacing >= 3;
    ctx.lineWidth = style.lineWidth;
    ctx.setLineDash([]);

    for (const group of groupsOf(points)) {
      ctx.beginPath();

      for (const index of group.indices) {
        const x = snap(points.x(index), style.lineWidth, pixelRatio);
        ctx.moveTo(x, points.high(index));
        ctx.lineTo(x, points.low(index));

        if (ticks) {
          const open = snap(points.open(index), style.lineWidth, pixelRatio);
          const close = snap(points.close(index), style.lineWidth, pixelRatio);
          ctx.moveTo(x - tick, open);
          ctx.lineTo(x, open);
          ctx.moveTo(x, close);
          ctx.lineTo(x + tick, close);
        }
      }

      ctx.strokeStyle = group.color ?? (group.up ? style.upColor : style.downColor);
      ctx.stroke();
    }
  }
};

export const highLowSeries: SeriesTypeDefinition<HighLowStyle> = {
  type: 'high-low',
  input: 'ohlc',
  defaultStyle: (theme) => ({ upColor: theme.up, downColor: theme.down, lineWidth: 2 }),
  paint: ({ ctx, points, style, pixelRatio }) => {
    ctx.lineWidth = style.lineWidth;
    ctx.lineCap = 'butt';
    ctx.setLineDash([]);

    for (const group of groupsOf(points)) {
      ctx.beginPath();

      for (const index of group.indices) {
        const x = snap(points.x(index), style.lineWidth, pixelRatio);
        ctx.moveTo(x, points.high(index));
        ctx.lineTo(x, points.low(index));
      }

      ctx.strokeStyle = group.color ?? (group.up ? style.upColor : style.downColor);
      ctx.stroke();
    }
  }
};
