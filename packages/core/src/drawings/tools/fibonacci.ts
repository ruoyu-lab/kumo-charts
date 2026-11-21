import { font } from '../../canvas/canvas';
import { withAlpha } from '../../canvas/color';
import type { Point } from '../../interaction/types';
import { boundsOf, extendSides, type Segment } from '../geometry';
import type {
  Anchors,
  DrawingField,
  DrawingGeometry,
  DrawingLevel,
  DrawingLevelStyle,
  DrawingPoint,
  DrawingStyle,
  DrawingTypeDefinition,
  LevelRange,
  TextAlign
} from '../types';
import { sideLevel } from './lines';
import {
  LABEL_GAP,
  type LevelStroke,
  levelText,
  measured,
  ratioText,
  segmentsHit,
  shownLevels,
  strokeDrawing,
  tracePath
} from './shared';

/**
 * The levels of a Fibonacci retracement: those to 4.236 show by default,
 * the others are there to turn on.
 */
const RETRACEMENT_LEVELS: readonly DrawingLevelStyle[] = [
  { value: 0 },
  { value: 0.236 },
  { value: 0.382 },
  { value: 0.5 },
  { value: 0.618 },
  { value: 0.786 },
  { value: 1 },
  { value: 1.618 },
  { value: 2.618 },
  { value: 3.618 },
  { value: 4.236 },
  { value: 1.272, visible: false },
  { value: 1.414, visible: false },
  { value: 2.272, visible: false },
  { value: 2.414, visible: false },
  { value: 2, visible: false },
  { value: 3, visible: false },
  { value: 3.272, visible: false },
  { value: 3.414, visible: false },
  { value: 4, visible: false },
  { value: 4.272, visible: false },
  { value: 4.414, visible: false },
  { value: 4.618, visible: false },
  { value: 4.764, visible: false }
];
const EXTENSION_LEVELS: readonly DrawingLevelStyle[] = [
  { value: 0 },
  { value: 0.382 },
  { value: 0.618 },
  { value: 1 },
  { value: 1.272 },
  { value: 1.618 },
  { value: 2 },
  { value: 2.618 }
];
/** The levels of a Fibonacci channel that show by default. */
const CHANNEL_RATIOS: readonly number[] = [
  0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618, 3.618, 4.236
];
/** Fibonacci numbers of bars, from the first anchor in units of the bars to the second. */
const TIME_ZONE_COUNTS: readonly number[] = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

interface FibLevel {
  readonly level: number;
  readonly price: number;
  readonly y: number;
  readonly color: string;
  readonly stroke: LevelStroke;
}

interface Ladder {
  /** The anchors joined by a dashed guide. */
  readonly guide: readonly Point[];
  /** Where the levels start and end, as far as the style extends them. */
  readonly left: number;
  readonly right: number;
  /** Where the labels start: at the earliest anchor, or the plot's left edge as levels go there. */
  readonly labels: number;
  /** The levels shown, lowest ratio first. */
  readonly levels: readonly FibLevel[];
}

/** What the forms of the tools that measure in price offer. */
const MEASURING_FIELDS: readonly DrawingField[] = [
  'color',
  'lineWidth',
  'lineStyle',
  'levels',
  'levelRange',
  'levelLabel',
  'fill',
  'extendLeft',
  'extendRight'
];

/**
 * A kind of Fibonacci tool of anchors `A`: its default levels, what they measure from, and the
 * price `along` its measure, 0 at the start and 1 at the end.
 */
interface FibKind<A extends readonly DrawingPoint[]> {
  readonly points: A['length'];
  readonly levels: readonly DrawingLevelStyle[];
  readonly range: LevelRange;
  price(anchors: A, along: number): number;
}

/** Horizontal levels across the anchors' times, or the plot as far as the style extends them. */
function ladderOf<A extends readonly DrawingPoint[]>(
  geometry: DrawingGeometry<A>,
  kind: FibKind<A>
): Ladder {
  const { points, anchors, style } = geometry;
  const xs = points.map((point) => point.x);
  const levels = shownLevels(style.levels, style, geometry.theme.palette, style.levelRange).map(
    ({ value, color, stroke }): FibLevel => {
      const price = kind.price(anchors, measured(value, style.levelRange));
      return { level: value, price, y: geometry.valueToY(price), color, stroke };
    }
  );
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  return {
    guide: points,
    left: style.extendLeft ? Math.min(0, left) : left,
    right: style.extendRight ? Math.max(geometry.width, right) : right,
    labels: style.extendLeft ? 0 : left,
    levels: levels.sort((a, b) => a.level - b.level)
  };
}

/** Where the labels of a ladder are written along its levels, as the style aligns its text. */
function labelPlace(geometry: DrawingGeometry, ladder: Ladder): { x: number; align: TextAlign } {
  const { textAlign } = geometry.style;

  if (textAlign === 'center') {
    return { x: (ladder.left + ladder.right) / 2, align: 'center' };
  }

  return textAlign === 'right'
    ? { x: ladder.right - LABEL_GAP, align: 'right' }
    : { x: ladder.labels + LABEL_GAP, align: 'left' };
}

/** The left of a text of `width` written at `x` as aligned. */
function textLeft(x: number, width: number, align: TextAlign): number {
  return align === 'left' ? x : align === 'right' ? x - width : x - width / 2;
}

/**
 * The difference in price between the highest and the lowest level, where the style writes it:
 * centered above the highest, a line higher where that level's label is above it too.
 */
function differenceOf(
  geometry: DrawingGeometry,
  ladder: Ladder
): { text: string; x: number; y: number; color: string } | null {
  const { levels } = ladder;

  if (!geometry.style.levelDifference || levels.length < 2) {
    return null;
  }

  const byY = [...levels].sort((a, b) => a.y - b.y);
  const top = byY[0] as FibLevel;
  const bottom = byY[byY.length - 1] as FibLevel;
  const labelled = levelLabel(geometry, top.level, top.price) !== '';
  return {
    text: geometry.formatValue(Math.abs(top.price - bottom.price)),
    x: (ladder.left + ladder.right) / 2,
    y: top.y - 3 - (labelled ? geometry.style.fontSize + 2 : 0),
    color: top.color
  };
}

/**
 * The color a band from a level to the next is tinted with: that of the level it starts from, or
 * with a symmetric fill that of the one farther from the middle of the levels.
 */
function bandColor(style: DrawingStyle, levels: readonly FibLevel[], index: number): string {
  const from = levels[index] as FibLevel;
  const to = levels[index + 1] ?? from;

  if (!style.symmetricFill) {
    return from.color;
  }

  const values = levels.map((level) => level.level);
  const middle = (Math.min(...values) + Math.max(...values)) / 2;
  return Math.abs(to.level - middle) > Math.abs(from.level - middle) ? to.color : from.color;
}

/** A level's label as the style writes it: its level and its price, e.g. `0.618  98,250`. */
function levelLabel(geometry: DrawingGeometry, level: number, price: number): string {
  const { levelLabel: label } = geometry.style;
  return [levelText(level, label), label.price ? geometry.formatValue(price) : '']
    .filter((part) => part !== '')
    .join('  ');
}

/** The levels, the guide between the anchors and the labels over the levels. */
function ladderBounds(geometry: DrawingGeometry, ladder: Ladder) {
  const top = geometry.style.fontSize + LABEL_GAP;
  const { x, align } = labelPlace(geometry, ladder);
  const difference = differenceOf(geometry, ladder);
  const texts = [
    ...ladder.levels.map(({ level, price, y }) => ({
      width: geometry.measureText(levelLabel(geometry, level, price)),
      x,
      y,
      align
    })),
    ...(difference
      ? [
          {
            width: geometry.measureText(difference.text),
            x: difference.x,
            y: difference.y + 3,
            align: 'center' as const
          }
        ]
      : [])
  ];
  return boundsOf([
    ...(geometry.style.guide ? ladder.guide : []),
    ...levelLines(ladder).flat(),
    ...texts.flatMap((text) => {
      const left = textLeft(text.x, text.width, text.align);
      return [
        { x: left, y: text.y - top },
        { x: left + text.width, y: text.y - top }
      ];
    })
  ]);
}

function levelLines({ left, right, levels }: Ladder): Segment[] {
  return levels.map(({ y }): Segment => [
    { x: left, y },
    { x: right, y }
  ]);
}

function fibType<A extends readonly DrawingPoint[]>(
  type: string,
  kind: FibKind<A>
): DrawingTypeDefinition<A> {
  return {
    type,
    points: kind.points,
    fields: MEASURING_FIELDS,
    defaultStyle: (): Partial<DrawingStyle> => ({ levels: kind.levels, levelRange: kind.range }),
    // Each level shown by its ratio, e.g. `0.618`, between the anchors' times.
    levels: (anchors, _scale, style) => {
      const times = anchors.map((anchor) => anchor.time);
      return shownLevels(style.levels, style).map(({ value: level }): DrawingLevel => {
        const price = kind.price(anchors, measured(level, style.levelRange));
        return sideLevel(
          ratioText(level),
          { time: Math.min(...times), price },
          { time: Math.max(...times), price },
          style
        );
      });
    },
    paint: (context) => {
      const { ctx, geometry } = context;
      const ladder = ladderOf(geometry, kind);
      const { left, right, levels } = ladder;

      // Each band between two levels is tinted with the color of the level it starts from, or
      // alike either side of the middle.
      if (geometry.style.fill) {
        levels.forEach(({ y }, index) => {
          const next = levels[index + 1];

          if (next) {
            ctx.fillStyle = withAlpha(
              bandColor(geometry.style, levels, index),
              geometry.style.bandOpacity
            );
            ctx.fillRect(left, y, right - left, next.y - y);
          }
        });
      }

      levels.forEach(({ y, stroke }) => {
        strokeDrawing(
          context,
          (path) => {
            path.moveTo(left, y);
            path.lineTo(right, y);
          },
          stroke
        );
      });
      if (geometry.style.guide) {
        strokeDrawing(
          context,
          (path) => {
            tracePath(path, ladder.guide, false);
          },
          { lineStyle: 'dashed' }
        );
      }

      ctx.font = font(geometry.style.fontSize - 1, geometry.fontFamily);
      const { x, align } = labelPlace(geometry, ladder);
      ctx.textAlign = align;
      ctx.textBaseline = 'bottom';
      levels.forEach(({ level, price, y, color }) => {
        ctx.fillStyle = color;
        ctx.fillText(levelLabel(geometry, level, price), x, y - 3);
      });

      const difference = differenceOf(geometry, ladder);

      if (difference) {
        ctx.textAlign = 'center';
        ctx.fillStyle = difference.color;
        ctx.fillText(difference.text, difference.x, difference.y);
      }
    },
    // The levels, and the bands between them where they are filled.
    hitTest: (geometry, point, tolerance) => {
      const ladder = ladderOf(geometry, kind);
      return segmentsHit(point, levelLines(ladder), tolerance);
    },
    bounds: (geometry) => ladderBounds(geometry, ladderOf(geometry, kind))
  };
}

/**
 * Levels of how far a move retraces, measured from where it began, the first anchor, to where it
 * ended, the second: by default from 1 there back to 0 at the end.
 */
export const fibRetracement = /* @__PURE__ */ fibType<Anchors<2>>('fib-retracement', {
  points: 2,
  levels: RETRACEMENT_LEVELS,
  range: { start: 1, end: 0 },
  price: ([from, to], along) => from.price + (to.price - from.price) * along
});

/**
 * A trend-based extension: the move from the first anchor to the second, projected from the third
 * by each ratio. It measures from the third anchor to as far again as the move, 0 to 1 by default
 * (1 repeats the move, 1.618 extends it).
 */
export const fibExtension = /* @__PURE__ */ fibType<Anchors<3>>('fib-extension', {
  points: 3,
  levels: EXTENSION_LEVELS,
  range: { start: 0, end: 1 },
  price: ([start, end, from], along) => from.price + (end.price - start.price) * along
});

interface ChannelLevel {
  readonly level: number;
  readonly color: string;
  readonly stroke: LevelStroke;
  /** The line as far as the style extends it. */
  readonly line: Segment;
}

/**
 * The lines of a Fibonacci channel, lowest level first: the base line from the first anchor to the
 * second moved along the way to the third, which it measures: the base line is the start, 0 by
 * default, and its parallel through the third anchor the end, 1.
 */
function channelLevels(geometry: DrawingGeometry<Anchors<3>>): ChannelLevel[] {
  const [first, second, third] = geometry.points;
  const { style, width, height } = geometry;
  const shift = (point: Point, along: number): Point => ({
    x: point.x + (third.x - first.x) * along,
    y: point.y + (third.y - first.y) * along
  });
  return shownLevels(style.levels, style, geometry.theme.palette, style.levelRange)
    .map(({ value, color, stroke }): ChannelLevel => ({
      level: value,
      color,
      stroke,
      line: extendSides(
        shift(first, measured(value, style.levelRange)),
        shift(second, measured(value, style.levelRange)),
        width,
        height,
        style.extendLeft,
        style.extendRight
      )
    }))
    .sort((a, b) => a.level - b.level);
}

/** The left end of a line in view: its own, or where it crosses the plot's left edge. */
function leftInView([start, end]: Segment): Point {
  const [left, right] = start.x <= end.x ? [start, end] : [end, start];

  if (left.x >= 0 || right.x === left.x) {
    return left;
  }

  return { x: 0, y: left.y + ((right.y - left.y) * -left.x) / (right.x - left.x) };
}

/**
 * A Fibonacci channel, lines parallel to a trend line at Fibonacci ratios of the channel's
 * width: the first two anchors make the base line (0), the third its parallel (1), and the other
 * ratios lie beyond or between them, each labelled with its value where it starts.
 */
export const fibChannel: DrawingTypeDefinition<Anchors<3>> = {
  type: 'fib-channel',
  points: 3,
  fields: MEASURING_FIELDS,
  defaultStyle: () => ({ levels: CHANNEL_RATIOS.map((value) => ({ value })) }),
  paint: (context) => {
    const { ctx, geometry } = context;
    const levels = channelLevels(geometry);

    // Each band between two levels is tinted with the color of the level it starts from.
    if (geometry.style.fill) {
      levels.forEach(({ line, color }, index) => {
        const next = levels[index + 1];

        if (next) {
          ctx.beginPath();
          tracePath(ctx, [line[0], line[1], next.line[1], next.line[0]], true);
          ctx.fillStyle = withAlpha(color, geometry.style.bandOpacity);
          ctx.fill();
        }
      });
    }

    for (const { line, stroke } of levels) {
      strokeDrawing(
        context,
        (path) => {
          tracePath(path, line, false);
        },
        stroke
      );
    }

    ctx.font = font(geometry.style.fontSize - 1, geometry.fontFamily);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    for (const { level, line, color } of levels) {
      const start = leftInView(line);
      ctx.fillStyle = color;
      ctx.fillText(
        levelLabel(geometry, level, geometry.yToValue(start.y)),
        start.x + LABEL_GAP,
        start.y - 3
      );
    }
  },
  bounds: (geometry) => {
    const top = geometry.style.fontSize + LABEL_GAP;
    return boundsOf(
      channelLevels(geometry).flatMap(({ level, line }) => {
        const start = leftInView(line);
        const label = levelLabel(geometry, level, geometry.yToValue(start.y));
        return [
          ...line,
          { x: start.x + LABEL_GAP + geometry.measureText(label), y: start.y - top }
        ];
      })
    );
  },
  // The levels, and the bands between them where they are filled.
  hitTest: (geometry, point, tolerance) => {
    return segmentsHit(
      point,
      channelLevels(geometry).map(({ line }) => line),
      tolerance
    );
  },
  // Each level shown by its ratio, moved as drawn: by bars in time, along the pane's scale.
  levels: ([first, second, third], scale, style, { barIndex, timeAt }) => {
    const bars = barIndex(third.time) - barIndex(first.time);
    const rise = scale.toScale(third.price) - scale.toScale(first.price);
    const shift = (point: DrawingPoint, along: number): DrawingPoint => ({
      time: timeAt(barIndex(point.time) + bars * along),
      price: scale.fromScale(scale.toScale(point.price) + rise * along)
    });
    return shownLevels(style.levels, style).map(({ value }) => {
      const along = measured(value, style.levelRange);
      return sideLevel(ratioText(value), shift(first, along), shift(second, along), style);
    });
  }
};

interface Zone {
  readonly count: number;
  readonly x: number;
  readonly color: string;
  readonly stroke: LevelStroke;
}

/**
 * The zones shown, at their counts of the bars from the first anchor to the second, which it
 * measures: 0 at the first by default, 1 at the second.
 */
function zonesOf(geometry: DrawingGeometry<Anchors<2>>): Zone[] {
  const [first, second] = geometry.points;
  const { style } = geometry;
  return shownLevels(style.levels, style)
    .map(({ value, color, stroke }) => ({
      count: value,
      x: first.x + (second.x - first.x) * measured(value, style.levelRange),
      color,
      stroke
    }))
    .sort((a, b) => a.x - b.x);
}

/**
 * Fibonacci time zones: the bars from the first anchor to the
 * second make one unit, and vertical lines mark 0, 1, 2, 3, 5, 8, 13, … units from the first
 * anchor, where turns are expected. Each is labelled with its count at the bottom.
 */
export const fibTimeZone: DrawingTypeDefinition<Anchors<2>> = {
  type: 'fib-time-zone',
  points: 2,
  fields: ['color', 'lineWidth', 'lineStyle', 'levels', 'levelRange', 'levelLabel', 'fill'],
  defaultStyle: () => ({ fill: false, levels: TIME_ZONE_COUNTS.map((value) => ({ value })) }),
  paint: (context) => {
    const { ctx, geometry } = context;
    const zones = zonesOf(geometry);

    const { height, style } = geometry;

    if (style.fill) {
      zones.forEach(({ x, color }, index) => {
        const next = zones[index + 1];

        if (next) {
          ctx.fillStyle = withAlpha(color, geometry.style.bandOpacity);
          ctx.fillRect(x, 0, next.x - x, height);
        }
      });
    }

    for (const { x, stroke } of zones) {
      strokeDrawing(
        context,
        (path) => {
          path.moveTo(x, 0);
          path.lineTo(x, height);
        },
        stroke
      );
    }

    strokeDrawing(
      context,
      (path) => {
        tracePath(path, geometry.points, false);
      },
      { lineStyle: 'dashed' }
    );

    ctx.font = font(style.fontSize - 1, geometry.fontFamily);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    for (const { count, x, color } of zones) {
      ctx.fillStyle = color;
      ctx.fillText(levelText(count, style.levelLabel), x + LABEL_GAP, height - LABEL_GAP);
    }
  },
  hitTest: (geometry, point, tolerance) => {
    const zones = zonesOf(geometry);
    const [first, second] = geometry.points;
    return segmentsHit(
      point,
      [
        [first, second],
        ...zones.map(({ x }): Segment => [
          { x, y: 0 },
          { x, y: geometry.height }
        ])
      ],
      tolerance
    );
  },
  // The lines from the top to the bottom of the plot, with their counts right of them.
  bounds: (geometry) =>
    boundsOf([
      ...geometry.points,
      ...zonesOf(geometry).flatMap(({ count, x }) => [
        { x, y: 0 },
        {
          x: x + LABEL_GAP + geometry.measureText(levelText(count, geometry.style.levelLabel)),
          y: geometry.height
        }
      ])
    ]),
  axisMarks: ([first, second]) => ({ prices: [], times: [first.time, second.time] })
};
