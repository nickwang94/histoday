const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* Split-flap cells                                                    */
/* ------------------------------------------------------------------ */

const CYCLE = ' 0123456789';
const MAX_STEPS = 5;

interface Cell {
  root: HTMLElement;
  top: HTMLElement;
  bottom: HTMLElement;
  leafTop: HTMLElement;
  leafBottom: HTMLElement;
  value: string;
}

function half(cls: string): HTMLElement {
  const el = document.createElement('span');
  el.className = cls;
  el.appendChild(document.createElement('span'));
  return el;
}

function put(el: HTMLElement, ch: string): void {
  (el.firstChild as HTMLElement).textContent = ch === ' ' ? '\u00a0' : ch;
}

/**
 * A row of split-flap cells. Changing the value flips each cell through the
 * intermediate characters, like a station board, staggered left to right.
 */
export class Flaps {
  private cells: Cell[] = [];
  private run = 0;

  constructor(
    root: HTMLElement,
    count: number,
  ) {
    for (let i = 0; i < count; i++) {
      const cell = document.createElement('span');
      cell.className = 'cell';
      const c: Cell = {
        root: cell,
        top: half('half half-top'),
        bottom: half('half half-bottom'),
        leafTop: half('leaf leaf-top'),
        leafBottom: half('leaf leaf-bottom'),
        value: ' ',
      };
      cell.append(c.top, c.bottom, c.leafTop, c.leafBottom);
      for (const h of [c.top, c.bottom, c.leafTop, c.leafBottom]) put(h, ' ');
      root.appendChild(cell);
      this.cells.push(c);
    }
  }

  set(text: string, animate = true): void {
    const target = text.padStart(this.cells.length, ' ').slice(-this.cells.length);
    const run = ++this.run;
    this.cells.forEach((cell, i) => {
      const to = target[i];
      if (!animate || reduceMotion()) {
        this.land(cell, to);
        return;
      }
      void this.flipTo(cell, to, run, i * 55);
    });
  }

  private land(cell: Cell, ch: string): void {
    for (const h of [cell.top, cell.bottom, cell.leafTop, cell.leafBottom]) put(h, ch);
    cell.leafTop.getAnimations().forEach((a) => a.cancel());
    cell.leafBottom.getAnimations().forEach((a) => a.cancel());
    cell.root.classList.remove('is-flipping');
    cell.value = ch;
  }

  private steps(from: string, to: string): string[] {
    if (from === to) return [];
    let a = CYCLE.indexOf(from);
    const b = CYCLE.indexOf(to);
    if (a < 0 || b < 0) return [to];
    const seq: string[] = [];
    while (a !== b) {
      a = (a + 1) % CYCLE.length;
      seq.push(CYCLE[a]);
    }
    return seq.slice(-MAX_STEPS);
  }

  private async flipTo(cell: Cell, to: string, run: number, delay: number): Promise<void> {
    const seq = this.steps(cell.value, to);
    if (!seq.length) return;
    if (delay) await new Promise((r) => setTimeout(r, delay));
    cell.root.classList.add('is-flipping');
    for (let s = 0; s < seq.length; s++) {
      if (run !== this.run) return;
      const next = seq[s];
      const last = s === seq.length - 1;
      const dur = last ? 210 : 120;
      put(cell.top, next);
      put(cell.leafTop, cell.value);
      put(cell.leafBottom, next);
      put(cell.bottom, cell.value);
      await cell.leafTop.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], {
        duration: dur / 2,
        easing: 'cubic-bezier(.55,0,1,.45)',
        fill: 'forwards',
      }).finished.catch(() => undefined);
      if (run !== this.run) return;
      await cell.leafBottom.animate(
        [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }],
        { duration: dur / 2, easing: last ? 'cubic-bezier(.2,1.6,.4,1)' : 'cubic-bezier(0,.55,.45,1)', fill: 'forwards' },
      ).finished.catch(() => undefined);
      put(cell.bottom, next);
      cell.value = next;
    }
    if (run === this.run) this.land(cell, to);
  }
}

/* ------------------------------------------------------------------ */
/* Swipe stage: spring-driven story change with synced photo crossfade */
/* ------------------------------------------------------------------ */

export interface Slide {
  image?: string;
}

export interface StageOptions<T extends Slide> {
  /** Element that receives pointer gestures. */
  surface: HTMLElement;
  /** Element that travels with the finger. */
  text: HTMLElement;
  backdrop: [HTMLImageElement, HTMLImageElement];
  /** Paint item `index` into the text layer (called at the swap point). */
  render: (item: T, index: number) => void;
  /** Called once a move is committed, before the spring settles. */
  onCommit: (index: number) => void;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export class Stage<T extends Slide> {
  private items: T[] = [];
  private index = 0;
  /** Index currently painted into the text layer. */
  private painted = -1;
  private front = 0;
  private dir: 1 | -1 = 1;
  private progress = 0;
  private velocity = 0;
  private target = 0;
  private raf = 0;
  private drag: { id: number; x0: number; y0: number; t: number; x: number; active: boolean } | null = null;
  private suppressClick = false;

  constructor(private readonly o: StageOptions<T>) {
    const s = o.surface;
    s.addEventListener('pointerdown', this.down);
    s.addEventListener('pointermove', this.move);
    s.addEventListener('pointerup', this.up);
    s.addEventListener('pointercancel', this.up);
    s.addEventListener('dragstart', (e) => e.preventDefault());
    for (const img of o.backdrop) {
      img.addEventListener('load', () => this.loaded(img));
      img.addEventListener('error', () => {
        img.dataset.empty = 'true';
        img.style.opacity = '0';
      });
    }
    s.addEventListener(
      'click',
      (e) => {
        if (!this.suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
        this.suppressClick = false;
      },
      true,
    );
  }

  get current(): number {
    return this.index;
  }

  setItems(items: T[], index = 0): void {
    cancelAnimationFrame(this.raf);
    this.items = items;
    this.index = clamp(index, 0, Math.max(0, items.length - 1));
    this.progress = this.target = this.velocity = 0;
    this.painted = -1;
    this.paintText(this.index);
    this.applyText(0, 0);
    const [a, b] = this.o.backdrop;
    this.showImage(a, items[this.index]?.image);
    a.style.opacity = a.dataset.empty ? '0' : '1';
    a.style.transform = '';
    b.style.opacity = '0';
    this.front = 0;
  }

  go(delta: 1 | -1): void {
    if (this.drag?.active) return;
    if (this.progress !== 0 || this.target !== 0) this.finishNow();
    if (!this.items[this.index + delta]) return this.nudge(delta);
    this.begin(delta);
    this.commit(0);
  }

  private nudge(delta: 1 | -1): void {
    if (reduceMotion()) return;
    this.o.text.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${-delta * 18}px)` }, { transform: 'translateX(0)' }],
      { duration: 320, easing: 'cubic-bezier(.3,.7,.4,1)' },
    );
  }

  private begin(dir: 1 | -1): void {
    this.dir = dir;
    const back = this.o.backdrop[1 - this.front];
    const next = this.items[this.index + dir];
    this.showImage(back, next?.image);
    back.style.opacity = '0';
  }

  private showImage(img: HTMLImageElement, src: string | undefined): void {
    if (!src) {
      img.removeAttribute('src');
      img.dataset.empty = 'true';
      return;
    }
    if (img.getAttribute('src') === src && img.complete && img.naturalWidth > 0) return this.loaded(img);
    img.dataset.empty = 'true';
    delete img.dataset.fit;
    img.src = src;
  }

  /** A photo counts only once decoded; a small original is shown whole instead of stretched. */
  private loaded(img: HTMLImageElement): void {
    if (!img.naturalWidth) return;
    delete img.dataset.empty;
    const needed = img.clientWidth * Math.max(0.8, Math.min(devicePixelRatio || 1, 2) * 0.55);
    img.dataset.fit = img.naturalWidth < needed ? 'contain' : 'cover';
    const settled = this.progress === 0 && this.target === 0 && !this.drag?.active;
    if (settled && img === this.o.backdrop[this.front]) {
      img.style.opacity = '1';
      if (!reduceMotion()) img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
    }
  }

  private paintText(i: number): void {
    if (this.painted === i || !this.items[i]) return;
    this.painted = i;
    this.o.render(this.items[i], i);
  }

  /** Paints the frame for progress p in [0, 1] toward `this.dir`; `raw` is the rubber-band drag offset. */
  private applyText(p: number, raw: number): void {
    const w = this.o.surface.clientWidth || 360;
    const text = this.o.text;
    const hasNext = !!this.items[this.index + this.dir];
    if (!hasNext) {
      text.style.transform = `translate3d(${raw}px,0,0)`;
      text.style.opacity = '1';
      return;
    }
    const out = p < 0.5;
    this.paintText(out ? this.index : this.index + this.dir);
    const k = out ? p * 2 : (1 - p) * 2;
    const x = (out ? -this.dir : this.dir) * k * w * (out ? 0.42 : 0.22);
    text.style.transform = `translate3d(${x}px,0,0)`;
    text.style.opacity = String(clamp(1 - k * 1.1, 0, 1));
    text.style.filter = k > 0.02 ? `blur(${(k * 6).toFixed(2)}px)` : '';

    const [frontImg, backImg] = [this.o.backdrop[this.front], this.o.backdrop[1 - this.front]];
    const e = smooth(clamp(p, 0, 1));
    const frontVisible = frontImg.dataset.empty ? 0 : 1;
    const backVisible = backImg.dataset.empty ? 0 : 1;
    frontImg.style.opacity = String(frontVisible * (1 - e));
    frontImg.style.transform = `translate3d(${-this.dir * e * 3}%,0,0) scale(${1 + e * 0.07})`;
    backImg.style.opacity = String(backVisible * e);
    backImg.style.transform = `translate3d(${this.dir * (1 - e) * 3}%,0,0) scale(${1.08 - e * 0.08})`;
  }

  private commit(velocity: number): void {
    this.target = 1;
    this.velocity = velocity;
    this.o.onCommit(this.index + this.dir);
    this.animate();
  }

  private cancel(velocity: number): void {
    this.target = 0;
    this.velocity = velocity;
    this.animate();
  }

  private finishNow(): void {
    cancelAnimationFrame(this.raf);
    if (this.target === 1) this.settle();
    else {
      this.progress = 0;
      this.applyText(0, 0);
    }
  }

  /** Completes a committed move: the back photo becomes the front one. */
  private settle(): void {
    this.index += this.dir;
    this.front = 1 - this.front;
    this.progress = this.target = this.velocity = 0;
    this.paintText(this.index);
    const t = this.o.text;
    t.style.transform = '';
    t.style.opacity = '1';
    t.style.filter = '';
    const [f, b] = [this.o.backdrop[this.front], this.o.backdrop[1 - this.front]];
    f.style.transform = '';
    f.style.opacity = f.dataset.empty ? '0' : '1';
    b.style.opacity = '0';
  }

  private animate(): void {
    cancelAnimationFrame(this.raf);
    if (reduceMotion()) {
      this.progress = this.target;
      this.applyText(this.progress, 0);
      if (this.target === 1) this.settle();
      return;
    }
    let last = performance.now();
    // Critically damped spring in "progress" units.
    const k = 210;
    const c = 2 * Math.sqrt(k) * 0.92;
    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const a = -k * (this.progress - this.target) - c * this.velocity;
      this.velocity += a * dt;
      this.progress += this.velocity * dt;
      if (this.target === 1 && this.progress > 1) {
        this.progress = 1;
        this.velocity = 0;
      }
      this.applyText(clamp(this.progress, 0, 1), 0);
      if (Math.abs(this.progress - this.target) < 0.002 && Math.abs(this.velocity) < 0.02) {
        if (this.target === 1) this.settle();
        else {
          this.progress = 0;
          this.applyText(0, 0);
        }
        return;
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  private down = (e: PointerEvent): void => {
    if (e.button !== 0 || this.drag) return;
    if ((e.target as Element).closest('button, dialog')) return;
    this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t: performance.now(), x: e.clientX, active: false };
  };

  private move = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.active) {
      if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        this.drag = null;
        return;
      }
      if (this.progress !== 0 || this.target !== 0) this.finishNow();
      d.active = true;
      d.x0 = e.clientX;
      this.o.surface.setPointerCapture(e.pointerId);
      document.body.classList.add('is-dragging');
    }
    const now = performance.now();
    const raw = e.clientX - d.x0;
    const dir: 1 | -1 = raw < 0 ? 1 : -1;
    if (dir !== this.dir || this.progress === 0) this.begin(dir);
    const w = this.o.surface.clientWidth || 360;
    this.velocity = ((-(e.clientX - d.x) / w) * dir * 1000) / Math.max(1, now - d.t);
    d.x = e.clientX;
    d.t = now;
    if (this.items[this.index + dir]) {
      this.progress = clamp(Math.abs(raw) / (w * 0.9), 0, 1);
      this.applyText(this.progress, 0);
    } else {
      this.progress = 0;
      this.applyText(0, raw * 0.28);
    }
  };

  private up = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    this.drag = null;
    if (!d.active) return;
    document.body.classList.remove('is-dragging');
    this.suppressClick = true;
    setTimeout(() => (this.suppressClick = false), 0);
    const can = !!this.items[this.index + this.dir];
    if (can && (this.progress > 0.22 || (this.velocity > 1.4 && this.progress > 0.04))) {
      this.commit(Math.max(0, this.velocity));
    } else if (can) {
      this.cancel(Math.min(0, this.velocity));
    } else {
      const t = this.o.text;
      t.animate([{ transform: t.style.transform }, { transform: 'translate3d(0,0,0)' }], {
        duration: 360,
        easing: 'cubic-bezier(.2,1.4,.4,1)',
      });
      t.style.transform = '';
    }
  };
}
