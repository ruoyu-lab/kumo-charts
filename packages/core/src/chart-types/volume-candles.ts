import { alignToDevice, snap } from '../canvas/canvas';
import { barWidth } from '../series/bar-width';
import { candleStyle, groupsOf } from '../series/bars';
import type { CandleStyle } from '../series/styles';
import type { SeriesPaintContext, SeriesTypeDefinition } from '../series/types';

/**
 * Candles as wide as their volume: the bar with the most volume in view takes the full body
 * width, the others their share of it.
 */
function paintVolumeCandles(context: SeriesPaintContext<CandleStyle>): void {
  const { ctx, points, style, pixelRatio, barSpacing } = context;
  const hairline = 1 / pixelRatio;
  let most = 0;

  for (let index = 0; index < points.count; index += 1) {
    most = Math.max(most, points.volume(index) || 0);
  }

  // The bar with the most volume is as wide as a candle, the others their share of it.
  const widest = barWidth(barSpacing, style.bodyRatio, style.gap, pixelRatio);
  const widthOf = (index: number) =>
    Math.max(
      hairline,
      alignToDevice((widest * (points.volume(index) || 0)) / (most || 1), pixelRatio)
    );
  ctx.setLineDash([]);

  for (const group of groupsOf(points)) {
    const { up, color } = group;
    const bodyColor = color ?? (up ? style.upColor : style.downColor);
    const filled = !(up ? style.hollowUp : style.hollowDown);

    if (style.wick) {
      ctx.beginPath();

      for (const index of group.indices) {
        const x = snap(points.x(index), 1, pixelRatio);
        const high = points.high(index);
        const low = points.low(index);

        if (filled) {
          ctx.moveTo(x, high);
          ctx.lineTo(x, low);
          continue;
        }

        // Up to a hollow body and on from it, not through it.
        const open = points.open(index);
        const close = points.close(index);
        ctx.moveTo(x, Math.min(high, low));
        ctx.lineTo(x, Math.min(open, close));
        ctx.moveTo(x, Math.max(open, close));
        ctx.lineTo(x, Math.max(high, low));
      }

      ctx.strokeStyle = color ?? (up ? style.upWickColor : style.downWickColor);
      ctx.lineWidth = hairline;
      ctx.stroke();
    }

    ctx.beginPath();

    for (const index of group.indices) {
      const width = widthOf(index);
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
      ctx.save();
      ctx.clip();
      // A hollow body is outlined as a border is: in the border's color, unless a color is chosen for the bar.
      ctx.strokeStyle =
        color === null ? (up ? style.upBorderColor : style.downBorderColor) : bodyColor;
      ctx.lineWidth = 2 * Math.max(hairline, alignToDevice(1, pixelRatio));
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** Candles whose bodies are as wide as their volume. */
export const volumeCandlesSeries: SeriesTypeDefinition<CandleStyle> = {
  type: 'volume-candles',
  input: 'ohlc',
  defaultStyle: (theme) => candleStyle(theme.up, theme.down),
  paint: paintVolumeCandles
};
