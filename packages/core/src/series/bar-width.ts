import { alignToDevice } from '../canvas/canvas';

/**
 * How wide a bar is drawn, at least a device pixel: the bar spacing less `gap` pixels, which leaves
 * that much between bars however far the chart is zoomed, or, without a gap, its share `ratio` of
 * the spacing.
 */
export function barWidth(
  barSpacing: number,
  ratio: number,
  gap: number | null,
  pixelRatio: number
): number {
  const width = gap === null ? barSpacing * ratio : barSpacing - gap;
  return Math.max(1 / pixelRatio, alignToDevice(width, pixelRatio));
}
