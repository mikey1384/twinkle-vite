// The pixel-art kit every part of the marble run draws with. One art pixel is
// U canvas pixels; sprites are built pixel by pixel on a small canvas, get the
// same 1px dark outline, and are drawn U× bigger with smoothing off. Painted
// backdrops go through a 1/U copy so they read as pixel art too.

export const U = 3;
export const W = 960;
export const H = 380;
export const INK = '#1a1426';
const OUTLINE = [26, 20, 38];

export const r3 = (v: number) => Math.round(v / U) * U;

export type Put = (x: number, y: number, col: string | null) => void;
export type Sprite = HTMLCanvasElement;

export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// draw(put) sets pixels; null clears one. Every sprite gets a dark outline.
export function makeSprite(
  w: number,
  h: number,
  draw: (put: Put) => void,
  { outline = true }: { outline?: boolean } = {}
): Sprite {
  const c = canvas(w + 2, h + 2);
  const p = c.getContext('2d')!;
  const put: Put = (x, y, col) => {
    x = Math.round(x);
    y = Math.round(y);
    if (col === null) p.clearRect(x + 1, y + 1, 1, 1);
    else {
      p.fillStyle = col;
      p.fillRect(x + 1, y + 1, 1, 1);
    }
  };
  draw(put);
  if (!outline) return c;
  const img = p.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const edge: number[] = [];
  const A = (x: number, y: number) =>
    x < 0 || y < 0 || x >= c.width || y >= c.height
      ? 0
      : d[(y * c.width + x) * 4 + 3];
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (
        A(x, y) === 0 &&
        (A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1))
      ) {
        edge.push((y * c.width + x) * 4);
      }
    }
  }
  for (const i of edge) {
    d[i] = OUTLINE[0];
    d[i + 1] = OUTLINE[1];
    d[i + 2] = OUTLINE[2];
    d[i + 3] = 255;
  }
  p.putImageData(img, 0, 0);
  return c;
}

// Filled ellipse; optional shade on the lower right and a highlight top left.
export function disc(
  put: Put,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  col: string | null,
  dark?: string,
  light?: string
) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      let c = col;
      if (dark && dx * 0.55 + dy * 0.85 > 0.5) c = dark;
      if (light && Math.hypot(dx + 0.38, dy + 0.45) < 0.26) c = light;
      put(x, y, c);
    }
  }
}

export function rect(
  put: Put,
  x: number,
  y: number,
  w: number,
  h: number,
  col: string | null
) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, col);
}

export function poly(put: Put, pts: [number, number][], col: string | null) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (
      let x = Math.floor(Math.min(...xs));
      x <= Math.ceil(Math.max(...xs));
      x++
    ) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (
          yi > y + 0.5 !== yj > y + 0.5 &&
          x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi
        ) {
          inside = !inside;
        }
      }
      if (inside) put(x, y, col);
    }
  }
}

export function line(
  put: Put,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  col: string | null,
  width = 1
) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) {
    rect(
      put,
      Math.round(x0 + ((x1 - x0) * i) / n),
      Math.round(y0 + ((y1 - y0) * i) / n),
      width,
      width,
      col
    );
  }
}

export function ring(
  put: Put,
  cx: number,
  cy: number,
  r: number,
  col: string,
  steps = 32
) {
  for (let a = 0; a < steps; a++) {
    put(
      cx + Math.round(Math.cos((a / steps) * Math.PI * 2) * r),
      cy + Math.round(Math.sin((a / steps) * Math.PI * 2) * r),
      col
    );
  }
}

export function eyesX(put: Put, x: number, y: number, col = INK) {
  for (let i = 0; i < 4; i++) {
    put(x + i, y + i, col);
    put(x + 3 - i, y + i, col);
  }
}

// a sprite filled white (hit flashes)
const whiteCache = new WeakMap<Sprite, Sprite>();
export function whiteOf(sprite: Sprite) {
  const hit = whiteCache.get(sprite);
  if (hit) return hit;
  const c = canvas(sprite.width, sprite.height);
  const p = c.getContext('2d')!;
  p.drawImage(sprite, 0, 0);
  p.globalCompositeOperation = 'source-in';
  p.fillStyle = '#fff';
  p.fillRect(0, 0, c.width, c.height);
  whiteCache.set(sprite, c);
  return c;
}

// a mirrored copy (enemies facing the other way)
const flipCache = new WeakMap<Sprite, Sprite>();
export function flipped(sprite: Sprite) {
  const hit = flipCache.get(sprite);
  if (hit) return hit;
  const c = canvas(sprite.width, sprite.height);
  const p = c.getContext('2d')!;
  p.translate(c.width, 0);
  p.scale(-1, 1);
  p.drawImage(sprite, 0, 0);
  flipCache.set(sprite, c);
  return c;
}

// A painting at 1/U size: drawn back up with smoothing off it is pixel art.
const lowCache = new Map<string, Sprite>();
export function lowRes(img: HTMLImageElement, w: number, h: number) {
  const key = `${img.src}|${Math.round(w)}|${Math.round(h)}`;
  const hit = lowCache.get(key);
  if (hit) return hit;
  const c = canvas(w / U, h / U);
  const p = c.getContext('2d')!;
  p.imageSmoothingQuality = 'high';
  p.drawImage(img, 0, 0, c.width, c.height);
  lowCache.set(key, c);
  return c;
}

const images = new Map<string, HTMLImageElement>();
export function loadImage(src: string) {
  const hit = images.get(src);
  if (hit) return hit;
  const img = new Image();
  // the paintings come from the CDN (it allows any origin)
  img.crossOrigin = 'anonymous';
  img.src = src;
  images.set(src, img);
  return img;
}
export const ready = (img?: HTMLImageElement) =>
  !!img && img.complete && img.naturalWidth > 0;

// ---- drawing on the U grid
export function drawSprite(
  g: CanvasRenderingContext2D,
  s: Sprite,
  x: number,
  y: number,
  scale = U,
  { flip = false, white = false, alpha = 1 } = {}
) {
  let img = flip ? flipped(s) : s;
  if (white) img = whiteOf(img);
  g.imageSmoothingEnabled = false;
  if (alpha !== 1) g.globalAlpha = alpha;
  g.drawImage(img, r3(x), r3(y), Math.round(s.width * scale), Math.round(s.height * scale));
  if (alpha !== 1) g.globalAlpha = 1;
}

// bottom-centre anchored sprite (feet on the ground)
export function drawStanding(
  g: CanvasRenderingContext2D,
  s: Sprite,
  cx: number,
  groundY: number,
  scale = U,
  opts?: { flip?: boolean; white?: boolean; alpha?: number }
) {
  drawSprite(g, s, cx - (s.width * scale) / 2, groundY - s.height * scale + U, scale, opts);
}

export function pxEllipse(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  col: string
) {
  g.fillStyle = col;
  for (let y = -ry; y <= ry; y += U) {
    const hw = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
    g.fillRect(r3(cx - hw), r3(cy + y), r3(hw * 2), U);
  }
}

export function pixelRing(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  frac: number,
  col: string
) {
  const steps = Math.ceil((Math.PI * 2 * r) / (U * 2));
  for (let i = 0; i < steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * Math.PI * 2;
    g.fillStyle = i / steps <= frac ? col : 'rgba(0,0,0,.22)';
    g.fillRect(r3(cx + Math.cos(a) * r) - U, r3(cy + Math.sin(a) * r) - U, U * 2, U * 2);
  }
}

export function star(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const X = r3(x);
  const Y = r3(y);
  g.fillRect(X - U, Y - r, U * 2, r * 2);
  g.fillRect(X - r, Y - U, r * 2, U * 2);
}

export const PIXEL_FONT = "'Press Start 2P', monospace";
export function pixelText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'center'
) {
  g.font = `${size}px ${PIXEL_FONT}`;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillStyle = INK;
  for (const [dx, dy] of [
    [-U, 0],
    [U, 0],
    [0, -U],
    [0, U],
    [U, U]
  ]) {
    g.fillText(text, x + dx, y + dy);
  }
  g.fillStyle = color;
  g.fillText(text, x, y);
}

// seeded randomness: levels and decorations are the same every visit
export function seeded(seed: string | number) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let x = h >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}

export function hash2(a: number, b: number) {
  return ((a * 73856093) ^ (b * 19349663)) >>> 0;
}

export function shadeHex(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
