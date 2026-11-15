import type { BarsView } from './types';

/** The latest intervals the typical spacing of bars is the median of. */
const INTERVAL_SAMPLE = 64;

/** Typical spacing between consecutive bars in milliseconds, or `null` with fewer than two bars. */
export function typicalInterval(bars: BarsView): number | null {
  if (bars.length < 2) {
    return null;
  }

  const start = Math.max(1, bars.length - INTERVAL_SAMPLE);
  const deltas: number[] = [];

  for (let index = start; index < bars.length; index += 1) {
    deltas.push(bars.time(index) - bars.time(index - 1));
  }

  deltas.sort((left, right) => left - right);
  return deltas[Math.floor(deltas.length / 2)] ?? null;
}

/**
 * Continuous logical index of `time` among `bars` spaced `interval` apart: interpolated between
 * the bars around it and extrapolated with the interval outside them. `NaN` when the position
 * cannot be known (no bars, or a single bar and a different time).
 */
export function logicalIndex(bars: BarsView, interval: number | null, time: number): number {
  if (interval === null) {
    return bars.length === 1 && time === bars.time(0) ? 0 : Number.NaN;
  }

  if (time <= bars.time(0)) {
    return (time - bars.time(0)) / interval;
  }

  // The bar whose period contains the time: the last one starting at or before it.
  const after = bars.lowerBound(time);
  const index = after < bars.length && bars.time(after) === time ? after : after - 1;
  const last = bars.length - 1;

  if (index >= last) {
    return last + (time - bars.time(last)) / interval;
  }

  const start = bars.time(index);
  return index + (time - start) / (bars.time(index + 1) - start);
}

/**
 * Whole logical index of the bar whose period contains `time`: what a time is on the bars of a
 * chart, whatever interval it was set on. A time of a smaller interval, such as a 15-minute bar
 * seen on daily bars, stands on the daily bar it falls in, not between that bar and the next.
 * Beyond the bars the periods go on with the interval. `NaN` as {@link logicalIndex} has it.
 */
export function barIndex(bars: BarsView, interval: number | null, time: number): number {
  if (interval === null) {
    return bars.length === 1 && time === bars.time(0) ? 0 : Number.NaN;
  }

  const last = bars.length - 1;

  if (time < bars.time(0)) {
    return Math.floor((time - bars.time(0)) / interval);
  }

  const after = bars.lowerBound(time);
  const index = after < bars.length && bars.time(after) === time ? after : after - 1;
  return index >= last ? last + Math.floor((time - bars.time(last)) / interval) : index;
}

/** Time at a continuous logical index, the inverse of {@link logicalIndex}. */
export function logicalTime(bars: BarsView, interval: number | null, logical: number): number {
  if (interval === null) {
    return bars.length === 1 && logical === 0 ? bars.time(0) : Number.NaN;
  }

  const last = bars.length - 1;

  if (logical <= 0) {
    return bars.time(0) + logical * interval;
  }

  if (logical >= last) {
    return bars.time(last) + (logical - last) * interval;
  }

  const index = Math.floor(logical);
  const start = bars.time(index);
  return start + (logical - index) * (bars.time(index + 1) - start);
}
