// Canvas drawing for 지우개 따먹기. Everything here is code-drawn (a varnished
// school desk, plain erasers, crumbs); the boss cards are the only images.
import { ARENA } from '../theme';
import {
  ERASER_H,
  ERASER_W,
  mulberry32,
  type Desk,
  type EraserBody
} from './physics';

export interface EraserLook {
  // a won boss card, or null for a plain eraser
  examKey: string | null;
  label: string;
  // card colour (boss) or sleeve colour (plain)
  color: string;
  // plain eraser rubber colour
  rubber?: string;
}

export interface Crumb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

export interface View {
  // CSS pixels per world unit, and where the desk's top-left sits
  scale: number;
  ox: number;
  oy: number;
}

// fit the desk (plus a margin for erasers sliding off) into the canvas
export function fitView(desk: Desk, width: number, height: number): View {
  const margin = 9;
  const scale = Math.min(
    width / (desk.w + margin * 2),
    height / (desk.h + margin * 2)
  );
  return {
    scale,
    ox: (width - desk.w * scale) / 2,
    oy: (height - desk.h * scale) / 2
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The desk: honey varnished plywood with grain, two knots, a pencil groove,
// a carved heart and a pencil line down the middle, the way every shared
// classroom desk had one. Drawn once per size into its own canvas.
export function paintDesk(desk: Desk, view: View, dpr: number) {
  const w = Math.round(desk.w * view.scale);
  const h = Math.round(desk.h * view.scale);
  const pad = 10;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((w + pad * 2) * dpr);
  canvas.height = Math.round((h + pad * 2) * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(dpr, dpr);
  ctx.translate(pad, pad);
  const rng = mulberry32(Math.round(desk.w * 7 + desk.h));
  const radius = Math.max(6, w * 0.02);

  // hard ink shadow, then the top
  ctx.fillStyle = ARENA.line;
  roundRect(ctx, 6, 7, w, h, radius);
  ctx.fill();
  ctx.save();
  roundRect(ctx, 0, 0, w, h, radius);
  ctx.clip();
  ctx.fillStyle = '#d9a46a';
  ctx.fillRect(0, 0, w, h);

  // grain runs along the long side
  const along = w >= h;
  const length = along ? w : h;
  const across = along ? h : w;
  const lines = Math.round(across / 5);
  for (let i = 0; i < lines; i++) {
    const base = (i / lines) * across + rng() * 4;
    const wave = 1.5 + rng() * 4;
    const freq = 0.004 + rng() * 0.01;
    const phase = rng() * Math.PI * 2;
    ctx.beginPath();
    for (let t = 0; t <= length; t += 6) {
      const off = base + Math.sin(t * freq + phase) * wave;
      if (along) {
        if (t === 0) ctx.moveTo(t, off);
        else ctx.lineTo(t, off);
      } else if (t === 0) ctx.moveTo(off, t);
      else ctx.lineTo(off, t);
    }
    ctx.strokeStyle = `rgba(122, 70, 30, ${0.1 + rng() * 0.18})`;
    ctx.lineWidth = 0.8 + rng() * 1.8;
    ctx.stroke();
  }
  // knots
  for (let k = 0; k < 2; k++) {
    const kx = (0.2 + rng() * 0.6) * w;
    const ky = (0.15 + rng() * 0.7) * h;
    for (let ring = 4; ring >= 1; ring--) {
      ctx.beginPath();
      ctx.ellipse(
        kx,
        ky,
        ring * (along ? 6 : 3),
        ring * (along ? 3 : 6),
        0,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = `rgba(110, 60, 25, ${0.12 + ring * 0.04})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
  // varnish sheen band
  ctx.fillStyle = 'rgba(255, 240, 210, 0.18)';
  if (along) ctx.fillRect(0, h * 0.12, w, h * 0.08);
  else ctx.fillRect(w * 0.12, 0, w * 0.08, h);

  // pencil groove along the far edge
  ctx.fillStyle = 'rgba(90, 50, 20, 0.35)';
  if (along) roundRect(ctx, w * 0.3, 8, w * 0.4, 7, 3.5);
  else roundRect(ctx, 8, h * 0.3, 7, h * 0.4, 3.5);
  ctx.fill();

  // the pencil line down the middle of a shared desk
  ctx.setLineDash([10, 7]);
  ctx.strokeStyle = 'rgba(60, 60, 70, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (along) {
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2 + 3, h);
  } else {
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2 + 3);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // a carved heart in a corner
  const hx = w * 0.86;
  const hy = h * 0.88;
  const hs = Math.max(8, Math.min(w, h) * 0.05);
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.9);
  ctx.bezierCurveTo(
    hx - hs * 1.4,
    hy,
    hx - hs * 0.6,
    hy - hs,
    hx,
    hy - hs * 0.3
  );
  ctx.bezierCurveTo(
    hx + hs * 0.6,
    hy - hs,
    hx + hs * 1.4,
    hy,
    hx,
    hy + hs * 0.9
  );
  ctx.strokeStyle = 'rgba(95, 50, 20, 0.5)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // darker bevel near the edges: the drop
  ctx.strokeStyle = 'rgba(80, 40, 10, 0.35)';
  ctx.lineWidth = 8;
  roundRect(ctx, 0, 0, w, h, radius);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = ARENA.line;
  ctx.lineWidth = 3;
  roundRect(ctx, 0, 0, w, h, radius);
  ctx.stroke();
  return canvas;
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export function drawEraser(
  ctx: CanvasRenderingContext2D,
  e: EraserBody,
  view: View,
  look: EraserLook,
  image: HTMLImageElement | null,
  {
    lift = 0,
    fall = 0,
    ring = null
  }: { lift?: number; fall?: number; ring?: string | null }
) {
  const sx = view.ox + e.x * view.scale;
  const sy = view.oy + e.y * view.scale;
  const grow = (1 + 0.1 * lift) * (1 - 0.55 * fall);
  const w = ERASER_W * view.scale * grow;
  const h = ERASER_H * view.scale * grow;
  const thick = Math.max(3, w * 0.22);
  const r = Math.max(2, w * 0.08);
  const line = Math.max(2, Math.min(3.5, w * 0.06));

  ctx.save();
  ctx.globalAlpha = 1 - fall;
  ctx.translate(sx, sy + fall * view.scale * 6);

  // hard shadow, longer when it sits up on the other eraser
  ctx.save();
  ctx.translate(3 + lift * 6, 4 + thick + lift * 7);
  ctx.rotate(e.a);
  ctx.fillStyle = 'rgba(29, 27, 24, 0.85)';
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fill();
  ctx.restore();

  const sideColor = look.examKey
    ? shade(look.color, -55)
    : shade(look.rubber || '#f1ece2', -60);
  // the block's side, seen below the top face
  ctx.save();
  ctx.translate(0, thick);
  ctx.rotate(e.a);
  ctx.fillStyle = sideColor;
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fill();
  ctx.lineWidth = line;
  ctx.strokeStyle = ARENA.line;
  ctx.stroke();
  ctx.restore();

  // top face
  ctx.save();
  ctx.rotate(e.a);
  ctx.save();
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.clip();
  if (look.examKey) {
    ctx.fillStyle = look.color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    if (image && image.complete && image.naturalWidth) {
      ctx.drawImage(image, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = '#fff';
      ctx.font = `900 ${Math.round(w * 0.22)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(look.label.slice(0, 4), 0, 0);
    }
  } else {
    // a plain school eraser: rubber with a printed paper sleeve
    ctx.fillStyle = look.rubber || '#f6f2ea';
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = look.color;
    ctx.fillRect(-w / 2, -h * 0.12, w, h * 0.62);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-w / 2, -h * 0.12 + h * 0.07, w, h * 0.05);
    ctx.save();
    ctx.translate(0, h * 0.22);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.max(7, Math.round(w * 0.2))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(look.label, 0, 0);
    ctx.restore();
  }
  // rubbed corner highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(-w / 2, -h / 2, w, h * 0.06);
  ctx.restore();
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.lineWidth = line;
  ctx.strokeStyle = ARENA.line;
  ctx.stroke();
  if (ring) {
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = ring;
    roundRect(ctx, -w / 2 - 6, -h / 2 - 6, w + 12, h + 12 + thick, r + 4);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  ctx.restore();
}

// The slingshot: a rubber band pulled back behind the eraser, a dotted aim
// line ahead of it, and a power ring that fills (and turns red near full).
export function drawAim(
  ctx: CanvasRenderingContext2D,
  e: EraserBody,
  view: View,
  angle: number,
  power: number,
  color: string
) {
  const sx = view.ox + e.x * view.scale;
  const sy = view.oy + e.y * view.scale;
  const unit = view.scale;
  const pull = power * 30 * unit;
  const ahead = (14 + power * 40) * unit;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // band
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = ARENA.line;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx - cos * pull, sy - sin * pull);
  ctx.stroke();
  ctx.strokeStyle = '#e8577e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = ARENA.line;
  ctx.beginPath();
  ctx.arc(sx - cos * pull, sy - sin * pull, 5, 0, Math.PI * 2);
  ctx.fill();

  // aim dots
  const dots = 9;
  for (let i = 1; i <= dots; i++) {
    const t = i / dots;
    const dx = sx + cos * (ERASER_H * 0.6 * unit + ahead * t);
    const dy = sy + sin * (ERASER_H * 0.6 * unit + ahead * t);
    ctx.beginPath();
    ctx.arc(dx, dy, Math.max(2, 4.2 - t * 2.2), 0, Math.PI * 2);
    ctx.fillStyle = ARENA.paper;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = ARENA.line;
    ctx.stroke();
  }

  // power ring
  const ringR = (ERASER_H * 0.5 + 6) * unit;
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(29, 27, 24, 0.25)';
  ctx.beginPath();
  ctx.arc(sx, sy, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = power > 0.85 ? ARENA.accent : color;
  ctx.beginPath();
  ctx.arc(sx, sy, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * power);
  ctx.stroke();
  ctx.restore();
}

export function drawCrumbs(
  ctx: CanvasRenderingContext2D,
  crumbs: Crumb[],
  view: View
) {
  crumbs.forEach((c) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, c.life * 2));
    ctx.fillStyle = c.color;
    const s = c.size * view.scale;
    ctx.fillRect(
      view.ox + c.x * view.scale - s / 2,
      view.oy + c.y * view.scale - s / 2,
      s,
      s
    );
  });
  ctx.globalAlpha = 1;
}

export function spawnCrumbs(
  crumbs: Crumb[],
  x: number,
  y: number,
  strength: number,
  colors: string[],
  rng: () => number
) {
  const count = Math.min(16, 3 + Math.round(strength / 8));
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const speed = 10 + rng() * (12 + strength * 0.35);
    crumbs.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + rng() * 0.35,
      size: 0.8 + rng() * 1.1,
      color: colors[i % colors.length]
    });
  }
  if (crumbs.length > 80) crumbs.splice(0, crumbs.length - 80);
}

export function updateCrumbs(crumbs: Crumb[], dt: number) {
  for (let i = crumbs.length - 1; i >= 0; i--) {
    const c = crumbs[i];
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vx *= 1 - 5 * dt;
    c.vy *= 1 - 5 * dt;
    c.life -= dt;
    if (c.life <= 0) crumbs.splice(i, 1);
  }
}
