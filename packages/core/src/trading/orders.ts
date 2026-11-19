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
  LABEL_ALIGNS,
  layoutPriceLines,
  paintPriceLines,
  validateButtons,
  type LabelAlign,
  type PriceLineButton,
  type PriceLineHost,
  type PriceLineLayout,
  type PriceLineView
} from '../objects/price-line';

export interface OrderInput {
  /** Usually the broker's order id; the chart numbers one, `order-1` on, when it is left out. */
  id?: string;
  price: number;
  side: 'buy' | 'sell';
  /** Label text such as `LIMIT` or `TP`; defaults to `BUY`/`SELL`. */
  label?: string;
  /** Shown after the label. */
  quantity?: number | string;
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
  /** Where along the line its label is: `left`, `center` or `right` of the plot. Default `right`. */
  labelAlign?: LabelAlign;
  /** Its price on the price axis. Off where the label says it. Default `true`. */
  axisLabel?: boolean;
}

export interface Order {
  readonly id: string;
  readonly price: number;
  readonly side: 'buy' | 'sell';
  readonly label: string | null;
  readonly quantity: number | string | null;
  readonly draggable: boolean;
  readonly pull: boolean;
  readonly visible: boolean;
  readonly color: string | null;
  readonly lineStyle: LineStyle;
  readonly buttons: readonly PriceLineButton[];
  readonly labelAlign: LabelAlign;
  readonly axisLabel: boolean;
}

const ORDER_FIELDS = fieldsOf<OrderInput>({
  id: true,
  price: true,
  side: true,
  label: true,
  quantity: true,
  draggable: true,
  pull: true,
  visible: true,
  color: true,
  lineStyle: true,
  buttons: true,
  labelAlign: true,
  axisLabel: true
});

/** An order but for its id, which the domain gives it. */
type OrderSettings = Omit<Order, 'id'>;

function parseOrder(input: OrderInput, label = 'order'): OrderSettings {
  checkFields(label, input, ORDER_FIELDS);

  if (input.label !== undefined) {
    checkString(`${label}.label`, input.label);
  }

  if (input.quantity !== undefined && typeof input.quantity !== 'string') {
    checkNumber(`${label}.quantity`, input.quantity);
  }

  return {
    price: checkNumber(`${label}.price`, input.price),
    side: checkOneOf(`${label}.side`, input.side, ['buy', 'sell']),
    label: input.label ?? null,
    quantity: input.quantity ?? null,
    draggable:
      input.draggable === undefined ? true : checkBoolean(`${label}.draggable`, input.draggable),
    pull: input.pull === undefined ? false : checkBoolean(`${label}.pull`, input.pull),
    visible: input.visible === undefined ? true : checkBoolean(`${label}.visible`, input.visible),
    color: input.color === undefined ? null : checkColor(`${label}.color`, input.color),
    lineStyle:
      input.lineStyle === undefined
        ? 'dashed'
        : checkOneOf(`${label}.lineStyle`, input.lineStyle, LINE_STYLES),
    buttons: validateButtons(input.buttons, `${label}.buttons`),
    labelAlign:
      input.labelAlign === undefined
        ? 'right'
        : checkOneOf(`${label}.labelAlign`, input.labelAlign, LABEL_ALIGNS),
    axisLabel:
      input.axisLabel === undefined ? true : checkBoolean(`${label}.axisLabel`, input.axisLabel)
  };
}

function orderInput(order: Order): OrderInput {
  return {
    price: order.price,
    side: order.side,
    draggable: order.draggable,
    pull: order.pull,
    visible: order.visible,
    lineStyle: order.lineStyle,
    buttons: order.buttons.map((button) => ({ ...button })),
    labelAlign: order.labelAlign,
    axisLabel: order.axisLabel,
    ...(order.label !== null ? { label: order.label } : {}),
    ...(order.quantity !== null ? { quantity: order.quantity } : {}),
    ...(order.color !== null ? { color: order.color } : {})
  };
}

/** Orders drawn as draggable price lines on the main pane. */
export class OrdersDomain implements ObjectDomain, Collection<OrderInput, Order> {
  readonly kind = 'order';
  private orders = new Map<string, Order>();
  private readonly ids = new IdSequence((id) => this.orders.has(id));
  private readonly icons = new IconCache();

  constructor(private readonly host: PriceLineHost) {}

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

  update(id: string, patch: Partial<Omit<OrderInput, 'id'>>): void {
    const current = this.require(id);
    this.orders.set(id, { id, ...parseOrder({ ...orderInput(current), ...patch }) });
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

      const name = order.label ?? (order.side === 'buy' ? 'BUY' : 'SELL');
      // Selected, its line is drawn thicker; under the pointer only the cursor says it can be taken, as over a drawing.
      const emphasized = context.selection?.kind === 'order' && context.selection.id === order.id;
      views.push({
        id: order.id,
        y: pane.scale.valueToY(order.price),
        color: order.color ?? (order.side === 'buy' ? theme.buy : theme.sell),
        text: order.quantity === null ? name : `${name} ${String(order.quantity)}`,
        axisText: order.axisLabel ? this.host.formatValue(pane, order.price) : null,
        buttons: order.buttons,
        lineStyle: order.lineStyle,
        emphasized,
        align: order.labelAlign
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
    const draggable = order.draggable && !button;
    return {
      target: {
        kind: 'order',
        id: order.id,
        part: hit.part,
        cursor: draggable ? 'ns-resize' : 'pointer',
        draggable
      },
      priority: hit.priority,
      distance: hit.distance
    };
  }

  reveal(_context: ObjectContext, target: HitTarget): ObjectPlace | null {
    const order = this.orders.get(target.id);
    return order ? { pane: MAIN_PANE_ID, scale: RIGHT_SCALE, value: order.price } : null;
  }

  beginDrag(context: ObjectContext, target: HitTarget): DragSession | null {
    const order = this.orders.get(target.id);
    const pane = paneOf(context.frame, MAIN_PANE_ID);

    if (!order?.draggable || !pane) {
      return null;
    }

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
