import { checkColor } from '../canvas/color';
import { font as cssFont } from '../canvas/canvas';
import { IconCache } from '../canvas/icon-cache';
import type { DragSession, HitTarget, Point } from '../interaction/types';
import { LINE_STYLES, type LineStyle } from '../options/types';
import { MAIN_PANE_ID, RIGHT_SCALE } from '../panes/pane-store';
import type {
  ObjectContext,
  ObjectDomain,
  ObjectHit,
  ObjectPaintContext,
  ObjectPlace
} from '../objects/types';
import type { PaneFrame } from '../render/frame';
import { paneOf } from '../objects/types';
import { replacement, type Collection } from '../chart/api/collection';
import { fail } from '../utils/errors';
import { IdSequence } from '../utils/ids';
import {
  checkBoolean,
  checkFields,
  checkNumber,
  checkOneOf,
  checkString,
  fieldsOf
} from '../utils/validate';
import {
  draggedValue,
  hitPriceLines,
  isPinned,
  labelPositionAt,
  layoutPriceLines,
  paintPriceLines,
  validateButtons,
  type LabelDragEvent,
  type PriceLineButton,
  type PriceLineHost,
  type PriceLineLayout,
  type PriceLineView
} from '../objects/price-line';

/** The label of an order on its line: what it writes, and where along the line it is. */
export interface OrderLabelInput {
  /** Its text, such as `LIMIT` or `TP`; `BUY` or `SELL` by default. */
  text?: string;
  /** Written after its text. */
  quantity?: number | string;
  /** Where along the line it is, from 0 at the left of the plot to 1 at its right. Default `1`. */
  position?: number;
  /**
   * Lets the user drag it along the line, to the left or the right; `orderLabelDrag` tells where it
   * is. Where the order is `draggable` too, a drag of the label that starts across the plot moves
   * the label, one that starts up or down moves the line. Default `false`.
   */
  draggable?: boolean;
}

export interface OrderInput {
  /** Usually the broker's order id; the chart numbers one, `order-1` on, when it is left out. */
  id?: string;
  price: number;
  side: 'buy' | 'sell';
  label?: OrderLabelInput;
  /** Marks its price on the price axis. Off where its label says it. Default `true`. */
  showOnAxis?: boolean;
  /**
   * A short text the browser shows after a moment while the pointer rests on its line or its label (not on its buttons),
   * such as what it says that its label does not. None by default.
   */
  tooltip?: string;
  /** Lets the user drag the order to a new price. Default `true`. */
  draggable?: boolean;
  /**
   * Dragging it pulls a price out of it instead of moving it, as a stop loss out of a position:
   * it stays where it is, and `orderDrag` tells where the pointer is, for the application to draw
   * what is pulled and to act on where it is let go. Default `false`.
   */
  pull?: boolean;
  visible?: boolean;
  /** Defaults to the theme's buy or sell color. */
  color?: string;
  lineStyle?: LineStyle;
  buttons?: PriceLineButton[];
}

export interface OrderLabel {
  readonly text: string | null;
  readonly quantity: number | string | null;
  readonly position: number;
  readonly draggable: boolean;
}

export interface Order {
  readonly id: string;
  readonly price: number;
  readonly side: 'buy' | 'sell';
  readonly label: OrderLabel;
  readonly showOnAxis: boolean;
  readonly tooltip: string | null;
  readonly draggable: boolean;
  readonly pull: boolean;
  readonly visible: boolean;
  readonly color: string | null;
  readonly lineStyle: LineStyle;
  readonly buttons: readonly PriceLineButton[];
}

const ORDER_FIELDS = fieldsOf<OrderInput>({
  id: true,
  price: true,
  side: true,
  label: true,
  showOnAxis: true,
  tooltip: true,
  draggable: true,
  pull: true,
  visible: true,
  color: true,
  lineStyle: true,
  buttons: true
});
const LABEL_FIELDS = fieldsOf<OrderLabelInput>({
  text: true,
  quantity: true,
  position: true,
  draggable: true
});

/** An order but for its id, which the domain gives it. */
type OrderSettings = Omit<Order, 'id'>;

function parseLabel(input: OrderLabelInput | undefined, label: string): OrderLabel {
  const given = input ?? {};
  checkFields(label, given, LABEL_FIELDS);

  if (given.text !== undefined) {
    checkString(`${label}.text`, given.text);
  }

  if (given.quantity !== undefined && typeof given.quantity !== 'string') {
    checkNumber(`${label}.quantity`, given.quantity);
  }

  return {
    text: given.text ?? null,
    quantity: given.quantity ?? null,
    position:
      given.position === undefined
        ? 1
        : checkNumber(`${label}.position`, given.position, { min: 0, max: 1 }),
    draggable:
      given.draggable === undefined ? false : checkBoolean(`${label}.draggable`, given.draggable)
  };
}

function parseOrder(input: OrderInput, label = 'order'): OrderSettings {
  checkFields(label, input, ORDER_FIELDS);

  if (input.tooltip !== undefined) {
    checkString(`${label}.tooltip`, input.tooltip);
  }

  return {
    price: checkNumber(`${label}.price`, input.price),
    side: checkOneOf(`${label}.side`, input.side, ['buy', 'sell']),
    label: parseLabel(input.label, `${label}.label`),
    showOnAxis:
      input.showOnAxis === undefined ? true : checkBoolean(`${label}.showOnAxis`, input.showOnAxis),
    tooltip: input.tooltip === undefined || input.tooltip === '' ? null : input.tooltip,
    draggable:
      input.draggable === undefined ? true : checkBoolean(`${label}.draggable`, input.draggable),
    pull: input.pull === undefined ? false : checkBoolean(`${label}.pull`, input.pull),
    visible: input.visible === undefined ? true : checkBoolean(`${label}.visible`, input.visible),
    color: input.color === undefined ? null : checkColor(`${label}.color`, input.color),
    lineStyle:
      input.lineStyle === undefined
        ? 'dashed'
        : checkOneOf(`${label}.lineStyle`, input.lineStyle, LINE_STYLES),
    buttons: validateButtons(input.buttons, `${label}.buttons`)
  };
}

function labelInput(label: OrderLabel): OrderLabelInput {
  return {
    position: label.position,
    draggable: label.draggable,
    ...(label.text !== null ? { text: label.text } : {}),
    ...(label.quantity !== null ? { quantity: label.quantity } : {})
  };
}

function orderInput(order: Order): OrderInput {
  return {
    price: order.price,
    side: order.side,
    label: labelInput(order.label),
    showOnAxis: order.showOnAxis,
    draggable: order.draggable,
    pull: order.pull,
    visible: order.visible,
    lineStyle: order.lineStyle,
    buttons: order.buttons.map((button) => ({ ...button })),
    ...(order.color !== null ? { color: order.color } : {}),
    ...(order.tooltip !== null ? { tooltip: order.tooltip } : {})
  };
}

/** How orders are drawn and dragged, and where the user drags their labels to is told. */
export interface OrdersHost extends PriceLineHost {
  labelDragged(event: LabelDragEvent): void;
}

/** Whether a part of an order's line is its label, at its line or kept at an edge. */
const isLabel = (part: string) => part === 'label' || isPinned(part);

/** Orders drawn as draggable price lines on the main pane. */
export class OrdersDomain implements ObjectDomain, Collection<OrderInput, Order> {
  readonly kind = 'order';
  private orders = new Map<string, Order>();
  private readonly ids = new IdSequence((id) => this.orders.has(id));
  private readonly icons = new IconCache();

  constructor(private readonly host: OrdersHost) {}

  has(id: string): boolean {
    return this.orders.has(id);
  }

  list(): Order[] {
    return [...this.orders.values()];
  }

  get(id: string): Order | null {
    return this.orders.get(id) ?? null;
  }

  require(id: string): Order {
    return this.orders.get(id) ?? fail(`Unknown order "${id}".`);
  }

  set(inputs: readonly OrderInput[]): void {
    this.orders = replacement('orders', inputs, this.ids, 'order', parseOrder);
  }

  add(input: OrderInput): string {
    const order = parseOrder(input);
    const id = input.id === undefined ? this.ids.next('order') : checkString('order.id', input.id);

    if (this.orders.has(id)) {
      fail(`An order with id "${id}" already exists.`);
    }

    this.orders.set(id, { id, ...order });
    this.ids.note(id);
    return id;
  }

  /** Changes an order; what the patch leaves out stays, its label's fields too. */
  update(id: string, patch: Partial<Omit<OrderInput, 'id'>>): void {
    const current = orderInput(this.require(id));
    const label = { ...current.label, ...patch.label };
    this.orders.set(id, { id, ...parseOrder({ ...current, ...patch, label }) });
  }

  remove(id: string): void {
    this.require(id);
    this.orders.delete(id);
  }

  private layouts(context: ObjectContext, pane: PaneFrame): PriceLineLayout[] {
    const { theme, font } = context.options;
    const views: PriceLineView[] = [];

    for (const order of this.orders.values()) {
      if (!order.visible) {
        continue;
      }

      const { label } = order;
      const name = label.text ?? (order.side === 'buy' ? 'BUY' : 'SELL');
      // Selected, its line is drawn thicker; under the pointer only the cursor says it can be taken, as over a drawing.
      const emphasized = context.selection?.kind === 'order' && context.selection.id === order.id;
      views.push({
        id: order.id,
        y: pane.scale.valueToY(order.price),
        color: order.color ?? (order.side === 'buy' ? theme.buy : theme.sell),
        text: label.quantity === null ? name : `${name} ${String(label.quantity)}`,
        axisText: order.showOnAxis ? this.host.formatValue(pane, order.price) : null,
        buttons: order.buttons,
        lineStyle: order.lineStyle,
        emphasized,
        position: label.position
      });
    }

    return layoutPriceLines(
      views,
      pane.plot.width,
      pane.plot.height,
      font.size,
      (text, size) => context.measureText(text, cssFont(size, font.family)),
      context.options.priceScale.pinLabels
    );
  }

  hitTest(context: ObjectContext, point: Point): ObjectHit | null {
    const pane = paneOf(context.frame, MAIN_PANE_ID);

    if (!pane || point.y < pane.plot.y || point.y >= pane.plot.y + pane.plot.height) {
      return null;
    }

    const hit = hitPriceLines(
      this.layouts(context, pane),
      { x: point.x, y: point.y - pane.plot.y },
      context.options.interaction.hitTolerance
    );
    const order = hit ? this.orders.get(hit.id) : undefined;

    if (!hit || !order) {
      return null;
    }

    const button = hit.part.startsWith('button:');
    // A label kept at an edge drags its line as the line itself does; a click on it brings the line into view.
    const movesLine = order.draggable && !button;
    const movesLabel = order.label.draggable && isLabel(hit.part);
    // The line says it moves; its label, which is clicked as much as it is dragged, that it can be taken, or which
    // ways it moves where it moves along the line.
    const cursor =
      hit.part === 'line'
        ? movesLine
          ? 'ns-resize'
          : 'pointer'
        : movesLabel
          ? movesLine
            ? 'move'
            : 'ew-resize'
          : 'pointer';
    return {
      target: {
        kind: 'order',
        id: order.id,
        part: hit.part,
        cursor,
        draggable: movesLine || movesLabel,
        ...(order.tooltip === null || button ? {} : { tooltip: order.tooltip })
      },
      priority: hit.priority,
      distance: hit.distance
    };
  }

  reveal(_context: ObjectContext, target: HitTarget): ObjectPlace | null {
    const order = this.orders.get(target.id);
    return order ? { pane: MAIN_PANE_ID, scale: RIGHT_SCALE, value: order.price } : null;
  }

  beginDrag(context: ObjectContext, target: HitTarget, point: Point): DragSession | null {
    const order = this.orders.get(target.id);
    const pane = paneOf(context.frame, MAIN_PANE_ID);
    const movesLine = order?.draggable === true && !target.part.startsWith('button:');
    const movesLabel = order?.label.draggable === true && isLabel(target.part);

    if (!order || !pane || (!movesLine && !movesLabel)) {
      return null;
    }

    const line = movesLine ? this.lineDrag(order) : null;
    const label = movesLabel ? this.labelDrag(context, pane, order, point) : null;
    // Where both can move, the way the pointer first goes says which: across the plot the label, up or down the line.
    let session: DragSession | null = line && label ? null : ((label ?? line)?.() ?? null);

    return {
      move: (next, modifiers) => {
        if (!session && line && label) {
          session = Math.abs(next.x - point.x) > Math.abs(next.y - point.y) ? label() : line();
        }

        session?.move(next, modifiers);
      },
      end: () => {
        session?.end();
      },
      cancel: () => {
        session?.cancel();
      }
    };
  }

  /** A drag of an order's line to another price, started as it is called. */
  private lineDrag(order: Order): () => DragSession {
    return () => {
      const initialPrice = order.price;
      let price = initialPrice;
      this.host.dragged({ id: order.id, phase: 'start', price, initialPrice });

      // An order pulled from stays: only the events tell where the pointer is.
      const setPrice = (next: number) => {
        const current = this.orders.get(order.id);

        if (current && !current.pull) {
          this.orders.set(order.id, { ...current, price: next });
          this.host.repaint();
        }
      };

      return {
        move: (point) => {
          const currentPane = paneOf(this.host.context().frame, MAIN_PANE_ID);

          if (!currentPane || !this.orders.has(order.id)) {
            return;
          }

          const y = point.y - currentPane.plot.y;
          const next = draggedValue(currentPane.scale, currentPane.format, y);

          if (Number.isFinite(next) && next !== price) {
            price = next;
            setPrice(price);
            this.host.dragged({ id: order.id, phase: 'move', price, initialPrice });
          }
        },
        end: () => {
          this.host.dragged({ id: order.id, phase: 'end', price, initialPrice });
        },
        cancel: () => {
          setPrice(initialPrice);
          this.host.dragged({ id: order.id, phase: 'cancel', price: initialPrice, initialPrice });
        }
      };
    };
  }

  /**
   * A drag of an order's label along its line, held where it was grabbed at `point`, started as it
   * is called.
   */
  private labelDrag(
    context: ObjectContext,
    pane: PaneFrame,
    order: Order,
    point: Point
  ): (() => DragSession) | null {
    const layout = this.layouts(context, pane).find((each) => each.view.id === order.id);

    if (!layout) {
      return null;
    }

    const { width } = layout.label;
    const grab = point.x - layout.label.x;

    return () => {
      const initialPosition = order.label.position;
      let position = initialPosition;
      this.host.labelDragged({ id: order.id, phase: 'start', position, initialPosition });

      const setPosition = (next: number) => {
        const current = this.orders.get(order.id);

        if (current) {
          this.orders.set(order.id, { ...current, label: { ...current.label, position: next } });
          this.host.repaint();
        }
      };

      return {
        move: (next) => {
          const currentPane = paneOf(this.host.context().frame, MAIN_PANE_ID);

          if (!currentPane || !this.orders.has(order.id)) {
            return;
          }

          const at = labelPositionAt(next.x - grab, width, currentPane.plot.width);

          if (at !== position) {
            position = at;
            setPosition(position);
            this.host.labelDragged({ id: order.id, phase: 'move', position, initialPosition });
          }
        },
        end: () => {
          this.host.labelDragged({ id: order.id, phase: 'end', position, initialPosition });
        },
        cancel: () => {
          setPosition(initialPosition);
          this.host.labelDragged({
            id: order.id,
            phase: 'cancel',
            position: initialPosition,
            initialPosition
          });
        }
      };
    };
  }

  paint(context: ObjectPaintContext): void {
    const pane = paneOf(context.frame, MAIN_PANE_ID);

    if (!pane || this.orders.size === 0) {
      return;
    }

    const { ctx } = context;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, pane.plot.y, context.frame.layout.width, pane.plot.height);
    ctx.clip();
    paintPriceLines(
      ctx,
      this.layouts(context, pane),
      pane.plot,
      pane.axis,
      {
        fontSize: context.options.font.size,
        fontFamily: context.options.font.family,
        pixelRatio: context.pixelRatio,
        textColor: '#ffffff',
        showAxis: context.options.priceScale.visible
      },
      this.icons
    );
    ctx.restore();
  }
}
