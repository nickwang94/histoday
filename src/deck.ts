export interface DeckOptions<T> {
  render: (item: T) => HTMLElement;
  key: (item: T) => string;
  onChange: (index: number) => void;
}

const DEPTH = 3;
const FLY_MS = 450;

function tiltFor(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 7) - 3) * 0.6;
}

/**
 * A pile of paper cards. Drag/swipe the top card left for the next one and
 * right for the previous one. Pointer events cover mouse, pen and touch;
 * `touch-action: pan-y` on cards keeps vertical page scrolling native.
 */
export class Deck<T> {
  private items: T[] = [];
  private index = 0;
  private readonly els = new Map<string, HTMLElement>();
  private drag: {
    id: number;
    el: HTMLElement;
    x0: number;
    y0: number;
    dx: number;
    t0: number;
    active: boolean;
  } | null = null;
  private suppressClick = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly opts: DeckOptions<T>,
  ) {
    root.addEventListener('pointerdown', this.onDown);
    root.addEventListener('pointermove', this.onMove);
    root.addEventListener('pointerup', this.onUp);
    root.addEventListener('pointercancel', this.onCancel);
    root.addEventListener('dragstart', (e) => e.preventDefault());
    root.addEventListener(
      'click',
      (e) => {
        if (this.suppressClick) {
          e.preventDefault();
          e.stopPropagation();
          this.suppressClick = false;
        }
      },
      true,
    );
  }

  get current(): number {
    return this.index;
  }

  get length(): number {
    return this.items.length;
  }

  setItems(items: T[], index = 0): void {
    this.items = items;
    this.index = Math.max(0, Math.min(index, items.length - 1));
    for (const el of this.els.values()) el.remove();
    this.els.clear();
    this.layout();
    this.opts.onChange(this.index);
  }

  next(): void {
    if (this.index >= this.items.length - 1) return this.bounce(-1);
    const top = this.topEl();
    if (top) this.flyOut(top, -1);
    this.index++;
    this.layout();
    this.opts.onChange(this.index);
  }

  prev(): void {
    if (this.index <= 0) return this.bounce(1);
    this.index--;
    const el = this.ensure(this.items[this.index]);
    // Start the returning card off-screen on the left, then let layout() slide it in.
    el.classList.add('no-anim');
    el.style.setProperty('--dx', '-120vw');
    el.style.setProperty('--rot', '-16deg');
    el.style.setProperty('--k', '0');
    el.style.zIndex = String(DEPTH + 1);
    void el.offsetWidth;
    el.classList.remove('no-anim');
    this.reset(el);
    this.layout();
    this.opts.onChange(this.index);
  }

  private topEl(): HTMLElement | undefined {
    const item = this.items[this.index];
    return item === undefined ? undefined : this.els.get(this.opts.key(item));
  }

  private ensure(item: T): HTMLElement {
    const key = this.opts.key(item);
    let el = this.els.get(key);
    if (!el) {
      el = this.opts.render(item);
      el.classList.add('card');
      el.style.setProperty('--tilt', `${tiltFor(key)}deg`);
      el.style.setProperty('--k', String(DEPTH));
      this.root.appendChild(el);
      this.els.set(key, el);
    }
    return el;
  }

  private layout(): void {
    const visible = new Set<string>();
    for (let k = 0; k < DEPTH; k++) {
      const item = this.items[this.index + k];
      if (item === undefined) break;
      const el = this.ensure(item);
      const key = this.opts.key(item);
      visible.add(key);
      el.style.setProperty('--k', String(k));
      el.style.zIndex = String(DEPTH - k);
      el.classList.toggle('is-top', k === 0);
      el.inert = k !== 0;
      el.setAttribute('aria-hidden', String(k !== 0));
    }
    for (const [key, el] of this.els) {
      if (!visible.has(key) && !el.classList.contains('leaving')) {
        el.remove();
        this.els.delete(key);
      }
    }
  }

  private flyOut(el: HTMLElement, dir: -1 | 1): void {
    const key = [...this.els].find(([, v]) => v === el)?.[0];
    if (key) this.els.delete(key);
    el.classList.remove('dragging', 'is-top');
    el.classList.add('leaving');
    el.inert = true;
    el.style.zIndex = String(DEPTH + 2);
    el.style.setProperty('--dx', `${dir * 120}vw`);
    el.style.setProperty('--rot', `${dir * 18}deg`);
    window.setTimeout(() => el.remove(), FLY_MS);
  }

  private bounce(dir: -1 | 1): void {
    const el = this.topEl();
    if (!el) return;
    el.classList.remove('bounce-left', 'bounce-right');
    void el.offsetWidth;
    el.classList.add(dir < 0 ? 'bounce-left' : 'bounce-right');
    this.reset(el);
  }

  private reset(el: HTMLElement): void {
    el.classList.remove('dragging');
    el.style.setProperty('--dx', '0px');
    el.style.setProperty('--rot', '0deg');
  }

  private onDown = (e: PointerEvent): void => {
    if (e.button !== 0 || this.drag) return;
    const el = (e.target as Element).closest<HTMLElement>('.card.is-top');
    if (!el) return;
    this.drag = { id: e.pointerId, el, x0: e.clientX, y0: e.clientY, dx: 0, t0: performance.now(), active: false };
  };

  private onMove = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.active) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        this.drag = null;
        return;
      }
      // Capture only once a horizontal drag starts so plain clicks still reach links.
      d.active = true;
      d.t0 = performance.now();
      d.x0 = e.clientX;
      d.el.setPointerCapture(e.pointerId);
      d.el.classList.add('dragging');
      document.body.classList.add('is-dragging');
    }
    const raw = e.clientX - d.x0;
    const atStart = raw > 0 && this.index === 0;
    const atEnd = raw < 0 && this.index >= this.items.length - 1;
    d.dx = atStart || atEnd ? raw * 0.3 : raw;
    d.el.style.setProperty('--dx', `${d.dx}px`);
    d.el.style.setProperty('--rot', `${d.dx / 22}deg`);
  };

  private onUp = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (!d.active) return;
    document.body.classList.remove('is-dragging');
    this.suppressClick = true;
    window.setTimeout(() => (this.suppressClick = false), 0);

    const width = this.root.clientWidth || 360;
    const velocity = d.dx / Math.max(1, performance.now() - d.t0);
    const threshold = Math.min(120, width * 0.28);
    const flickLeft = d.dx < -threshold || (velocity < -0.6 && d.dx < -30);
    const flickRight = d.dx > threshold || (velocity > 0.6 && d.dx > 30);

    if (flickLeft && this.index < this.items.length - 1) {
      this.next();
    } else if (flickRight && this.index > 0) {
      this.reset(d.el);
      this.prev();
    } else {
      this.reset(d.el);
    }
  };

  private onCancel = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    document.body.classList.remove('is-dragging');
    this.reset(d.el);
  };
}
