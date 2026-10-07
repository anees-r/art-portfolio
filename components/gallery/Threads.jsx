'use client';

import { useEffect } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/motion';

/**
 * The thread: one violet string that runs through the home page, drawn on by
 * scroll only (nothing moves while you are idle).
 *
 * In the hero it enters from a random point at the edge of the screen and
 * sweeps down to the bottom centre, where the gallery begins; it carries on
 * behind each artwork in turn and off the edge of the screen; it comes back in
 * for the process, snaking behind each step and lighting it as it arrives. The
 * route is randomised per visit (never looping) and stays put while you are on
 * the page.
 *
 * Markup: <svg class="thread" data-thread="hero|work|process"> inside each section.
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f1 = (v) => Math.round(v * 10) / 10;

/** Small seeded PRNG, so a rebuild (resize, images loading) keeps the same route. */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
const unit = (v) => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};

/**
 * Centripetal Catmull-Rom spline through the points (no overshoot or ripples
 * between unevenly spaced points), as cubic Bézier segments [p1, c1, c2, p2].
 * startDir / endDir pin the direction the string leaves its first point and
 * arrives at its last — used where two sections' strings meet.
 */
function segmentsOf(pts, { startDir, endDir } = {}) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];
    const d2 = dist(p1, p2);
    const b = Math.sqrt(d2);
    let c1;
    let c2;
    if (p0) {
      const d1 = dist(p0, p1);
      const a = Math.sqrt(d1);
      c1 = [0, 1].map((k) => (d1 * p2[k] - d2 * p0[k] + (2 * d1 + 3 * a * b + d2) * p1[k]) / (3 * a * (a + b)));
    } else {
      const u = unit(startDir || [p2[0] - p1[0], p2[1] - p1[1]]);
      c1 = [p1[0] + (u[0] * d2) / 3, p1[1] + (u[1] * d2) / 3];
    }
    if (p3) {
      const d3 = dist(p2, p3);
      const c = Math.sqrt(d3);
      c2 = [0, 1].map((k) => (d3 * p1[k] - d2 * p3[k] + (2 * d3 + 3 * c * b + d2) * p2[k]) / (3 * c * (c + b)));
    } else {
      const u = unit(endDir || [p2[0] - p1[0], p2[1] - p1[1]]);
      c2 = [p2[0] - (u[0] * d2) / 3, p2[1] - (u[1] * d2) / 3];
    }
    out.push([p1, c1, c2, p2]);
  }
  return out;
}

const pathOf = (segs) =>
  `M${f1(segs[0][0][0])},${f1(segs[0][0][1])}` +
  segs.map(([, a, b, p]) => `C${f1(a[0])},${f1(a[1])} ${f1(b[0])},${f1(b[1])} ${f1(p[0])},${f1(p[1])}`).join('');

/**
 * Points along the curve (computed directly, ~every 8px) with their running
 * length and the furthest-down y reached so far.
 */
function sample(segs) {
  const xs = [];
  const ys = [];
  const ls = [];
  const reach = [];
  let len = 0;
  let low = -Infinity;
  const push = (x, y) => {
    if (xs.length) len += Math.hypot(x - xs[xs.length - 1], y - ys[ys.length - 1]);
    low = Math.max(low, y);
    xs.push(x);
    ys.push(y);
    ls.push(len);
    reach.push(low);
  };
  push(segs[0][0][0], segs[0][0][1]);
  for (const [p, a, b, q] of segs) {
    const n = clamp(Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 8), 4, 400);
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      const w0 = u * u * u;
      const w1 = 3 * u * u * t;
      const w2 = 3 * u * t * t;
      const w3 = t * t * t;
      push(w0 * p[0] + w1 * a[0] + w2 * b[0] + w3 * q[0], w0 * p[1] + w1 * a[1] + w2 * b[1] + w3 * q[1]);
    }
  }
  return { xs, ys, ls, reach, n: xs.length, total: len };
}

/** Last sample index whose value in arr is ≤ v (arr is non-decreasing). */
function indexAt(arr, v) {
  if (arr[0] > v) return -1;
  let lo = 0;
  let hi = arr.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (arr[mid] <= v) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Position of el inside root (an offsetParent ancestor), ignoring transforms. */
function offsetIn(el, root) {
  let x = 0;
  let y = 0;
  for (let n = el; n && n !== root; n = n.offsetParent) {
    x += n.offsetLeft;
    y += n.offsetTop;
  }
  return [x, y];
}

/** A random point inside el's middle area (fx × fy of its box). */
function insideOf(el, root, rand, fx, fy) {
  const [x, y] = offsetIn(el, root);
  return [x + el.offsetWidth * (0.5 + (rand() - 0.5) * fx), y + el.offsetHeight * (0.5 + (rand() - 0.5) * fy)];
}

// --- section routes --------------------------------------------------------

const DOWN = [0, 1];

const ROUTES = {
  /**
   * In from a random point on the left, right or top edge, one loose sweep
   * toward the centre, arriving at the bottom centre heading straight down —
   * the direction the gallery's string sets off in, so the two read as one.
   */
  hero(W, H, root, rand) {
    const side = Math.floor(rand() * 3);
    const enter =
      side === 0 ? [-40, H * (0.08 + 0.4 * rand())] : side === 1 ? [W + 40, H * (0.08 + 0.4 * rand())] : [W * (0.1 + 0.8 * rand()), -40];
    // Keep sweeping toward the centre (never doubling back into a hairpin).
    const ax =
      side === 0 ? W * (0.12 + 0.4 * rand()) : side === 1 ? W * (0.48 + 0.4 * rand()) : clamp(enter[0] + (rand() - 0.5) * W * 0.4, W * 0.15, W * 0.85);
    const a = [ax, H * (0.3 + 0.2 * rand())];
    return { pts: [enter, a, [W / 2, H + 2]], endDir: DOWN };
  },

  /** From the hero's end (setting off straight down), behind each artwork in turn, then off the screen. */
  work(W, H, root, rand) {
    const pts = [[W / 2, 0], ...[...root.querySelectorAll('.piece .frame')].map((f) => insideOf(f, root, rand, 0.5, 0.4))];
    const last = pts[pts.length - 1];
    pts.push([last[0] < W / 2 ? W + 160 : -160, Math.max(last[1] + 1, H - 10)]);
    return { pts, startDir: DOWN };
  },

  /**
   * Long diagonal runs from step to step, each turning in a broad curve around
   * the outer side of a step's piece (the side away from its neighbours).
   */
  process(W, H, root, rand) {
    const steps = [...root.querySelectorAll('.step')];
    if (!steps.length) return { pts: [[-160, 0], [W + 160, H]] };
    const n = steps.length;
    const boxes = steps.map((s) => {
      const t = s.querySelector('.th') || s;
      const [x, y] = offsetIn(t, root);
      return { x, y, w: t.offsetWidth, h: t.offsetHeight, cx: x + t.offsetWidth / 2 };
    });
    const outs = boxes.map((bx, i) => {
      const nb = [boxes[i - 1], boxes[i + 1]].filter(Boolean);
      const avg = nb.length ? nb.reduce((sum, o) => sum + o.cx, 0) / nb.length : W / 2;
      return bx.cx >= avg ? 1 : -1;
    });
    const turns = boxes.map((bx, i) => [bx.cx + outs[i] * bx.w * (0.72 + 0.18 * rand()), bx.y + bx.h * (0.4 + 0.2 * rand())]);
    // Drop in from the top corner on the first piece's inner side: steep at first,
    // flattening out as it sweeps across the heading into the first turn.
    const inward = outs[0] > 0 ? -1 : 1;
    const enter = [inward < 0 ? -160 : W + 160, -40];
    // The last piece isn't wrapped: the string runs straight behind it and carries
    // on in the same direction off the edge of the screen.
    const lastBox = boxes[n - 1];
    const through = [lastBox.cx, lastBox.y + lastBox.h * (0.4 + 0.2 * rand())];
    turns[n - 1] = through;
    const from = n > 1 ? turns[n - 2] : enter;
    const dx = through[0] - from[0] || 1;
    const exitX = dx > 0 ? W + 160 : -160;
    const exit = [exitX, Math.min(H - 10, through[1] + ((through[1] - from[1]) / dx) * (exitX - through[0]))];
    return {
      pts: [enter, ...turns, exit],
      startDir: [-inward, 1.1],
      nodes: turns.map((t, i) => ({ el: steps[i], p: t })),
    };
  },
};

/** A section's string, drawn on as the reader scrolls. */
function scrollThread(svg, route, seed, reduced) {
  const root = svg.parentElement;
  const track = svg.closest('.hero-track');
  const path = svg.querySelector('path');
  const head = svg.querySelector('.t-head');
  let S = null;
  let docTop = 0;
  let span = 1;
  let nodes = [];
  let cur = 0;
  let painted = -1;
  let headOn = null;

  const paint = () => {
    painted = cur;
    path.style.strokeDashoffset = `${S.total - cur}`;
    if (head) {
      const i = Math.max(0, indexAt(S.ls, cur));
      head.setAttribute('cx', f1(S.xs[i]));
      head.setAttribute('cy', f1(S.ys[i]));
      const on = cur > 2 && cur < S.total - 2;
      if (on !== headOn) head.style.opacity = (headOn = on) ? 1 : 0;
    }
    for (const n of nodes) {
      const on = cur >= n.at;
      if (on !== n.on) n.el.classList.toggle('on', (n.on = on));
    }
  };

  const build = () => {
    const W = svg.clientWidth;
    const H = svg.clientHeight;
    if (!W || !H) return;
    const r = route(W, H, root, prng(seed));
    const segs = segmentsOf(r.pts, r);
    S = sample(segs);
    path.setAttribute('d', pathOf(segs));
    // Dash in the same units as our own sampling.
    path.setAttribute('pathLength', S.total);
    path.style.strokeDasharray = `${S.total + 1} ${S.total + 1}`;
    // Cached page positions, so scrolling never reads layout.
    const box = track || svg;
    docTop = box.getBoundingClientRect().top + window.scrollY;
    span = track ? Math.max(1, track.offsetHeight - window.innerHeight) : 1;
    // Where along the string each node sits (the spline passes through it).
    let from = 0;
    nodes = (r.nodes || []).map(({ el, p }) => {
      let best = from;
      let bestD = Infinity;
      for (let i = from; i < S.n; i++) {
        const dd = Math.hypot(S.xs[i] - p[0], S.ys[i] - p[1]);
        if (dd < bestD) {
          bestD = dd;
          best = i;
        }
        if (dd < 6) break;
      }
      from = best;
      return { el, at: S.ls[best], on: null };
    });
    cur = reduced ? S.total : Math.min(cur, S.total);
    painted = -1;
    paint();
  };

  const targetAt = (vh, sy) => {
    // The pinned hero: drawn in step with its scroll, complete just before it lets go.
    if (track) return S.total * clamp((sy - docTop) / span / 0.85, 0, 1);
    // Elsewhere the tip leads at 62% of the viewport — nearer the bottom while
    // the section is still coming in, so the string is never left hanging.
    const top = docTop - sy;
    const line = vh * (0.62 + 0.36 * clamp(top / vh, 0, 1));
    const i = indexAt(S.reach, line - top);
    return i < 0 ? 0 : S.ls[i];
  };

  const tick = (vh, sy) => {
    if (!S) return;
    const target = targetAt(vh, sy);
    if (target === cur && painted === cur) return;
    cur += (target - cur) * 0.2;
    if (Math.abs(target - cur) < 0.5) cur = target;
    if (Math.abs(cur - painted) > 0.3) paint();
  };

  return { build, tick };
}

export default function Threads() {
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const seed = (Math.random() * 2 ** 32) >>> 0;
    const svgs = [...document.querySelectorAll('svg.thread[data-thread]')].filter((s) => ROUTES[s.dataset.thread]);
    const threads = svgs.map((s, i) => scrollThread(s, ROUTES[s.dataset.thread], seed + i * 7919, reduced));

    // Rebuild whenever layout changes (images load, the work is filtered…) — this
    // also refreshes each section's cached page position.
    let timer;
    let vh = window.innerHeight;
    const rebuild = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        vh = window.innerHeight;
        threads.forEach((t) => t.build());
      }, 150);
    };
    const ro = new ResizeObserver(rebuild);
    svgs.forEach((s) => ro.observe(s.parentElement));
    const main = document.getElementById('content');
    if (main) ro.observe(main);
    threads.forEach((t) => t.build());

    const tick = () => {
      const sy = window.scrollY;
      for (const t of threads) t.tick(vh, sy);
    };
    if (!reduced) gsap.ticker.add(tick);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);

  return null;
}
