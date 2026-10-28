import { W, H, INK, U, drawSprite, loadImage, lowRes, ready, pxEllipse, pixelText, r3 } from './pixel';
import { marbleSprite } from './marble';
import { Fx } from './fx';
import { ghostSprite } from './level/obstacles/special';
import { gqMedia } from '../../media';

// Nemesis uses its existing, untimed first-attempt scoring. This is only
// the battle presentation of confirmed answers: one hit per right answer,
// no invented letter grade, damage award, retry, or seven-hit boss cutoff.
export class GhostReviewBattle {
  private readonly backdrop = loadImage(gqMedia('img/grammar-quest/levels/w8-ghost-house.png'));
  private readonly ghosts = {
    look: [ghostSprite('look', 0), ghostSprite('look', 1)],
    shy: [ghostSprite('shy', 0), ghostSprite('shy', 1)],
    boo: [ghostSprite('boo', 0), ghostSprite('boo', 1)]
  };
  private readonly answers = new Map<number, boolean>();
  private readonly fx = new Fx();
  private shot: { correct: boolean; at: number | null; landed: boolean } | null = null;
  private shownStrength: number;
  private settled = false;

  constructor(
    readonly total: number,
    saved: { position: number; isCorrect: boolean }[],
    private readonly onSettled: () => void
  ) {
    for (const answer of saved) this.answers.set(answer.position, answer.isCorrect);
    this.shownStrength = this.strength;
  }

  get strength() {
    return Math.max(0, this.total - [...this.answers.values()].filter(Boolean).length);
  }

  get busy() {
    return this.shot !== null;
  }

  answer(position: number, correct: boolean) {
    if (this.busy || this.answers.has(position)) return false;
    this.answers.set(position, correct);
    this.shot = { correct, at: null, landed: false };
    this.settled = false;
    return true;
  }

  next() {
    this.settled = false;
  }

  frame(g: CanvasRenderingContext2D, t: number) {
    const shot = this.shot;
    if (shot && shot.at === null) shot.at = t;
    const elapsed = shot ? t - shot.at! : 0;
    const flight = Math.min(1, elapsed / 850);
    if (shot && !shot.landed && flight >= 1) {
      shot.landed = true;
      if (shot.correct) {
        this.fx.burst('star', 18, 730, 205, { color: '#ffe18a' });
        this.fx.text('HIT!', 710, 125, '#ffe18a', 20);
        this.fx.shake(t, 5, 180);
      } else {
        this.fx.burst('puff', 12, 730, 205, { color: '#d7b8ff' });
        this.fx.text('BOO!', 710, 125, '#e5ccff', 20);
      }
    }
    if (!shot || shot.landed) this.shownStrength += (this.strength - this.shownStrength) * 0.15;
    if (shot && elapsed >= 1350) {
      this.shot = null;
      this.settled = true;
      this.onSettled();
    }

    g.save();
    const [dx, dy] = this.fx.shakeOffset(t);
    g.translate(dx, dy);
    g.fillStyle = INK;
    g.fillRect(-10, -10, W + 20, H + 20);
    if (ready(this.backdrop)) {
      const width = Math.max(W, Math.round(this.backdrop.naturalWidth * H / this.backdrop.naturalHeight));
      g.imageSmoothingEnabled = false;
      g.drawImage(lowRes(this.backdrop, width, H), (W - width) / 2, 0, width, H);
    }
    // The same stepped wood floor and pixel silhouettes as Quest's levels.
    g.fillStyle = '#35243e';
    g.fillRect(0, 316, W, 64);
    g.fillStyle = '#8c6387';
    g.fillRect(0, 316, W, 6);
    g.fillStyle = '#53344e';
    for (let y = 328; y < H; y += 24) g.fillRect(0, y, W, 3);
    for (let x = 24; x < W; x += 96) g.fillRect(x, 322, 3, H - 322);

    // Ghost wisps stay ornamental; they never impose a time penalty.
    for (let i = 0; i < 12; i++) {
      const x = (i * 89 + t * 0.012) % (W + 60) - 30;
      const y = 280 + Math.sin(t / 900 + i) * 18;
      pxEllipse(g, x, y, 36, 6, 'rgba(217,198,255,.14)');
    }
    const complete = this.answers.size >= this.total;
    const defeated = complete && this.strength === 0 && (!shot || shot.landed);
    const hit = shot?.landed && shot.correct;
    const face = hit || defeated ? 'shy' : shot?.landed && !shot.correct ? 'boo' : 'look';
    const ghost = this.ghosts[face][Math.floor(t / 260) % 2];
    const recoil = hit ? Math.sin(Math.min(1, (elapsed - 850) / 500) * Math.PI) * 38 : 0;
    const gx = 730 + recoil;
    const gy = 204 + Math.sin(t / 520) * 12;
    pxEllipse(g, gx, 312, 90, 9, 'rgba(0,0,0,.24)');
    drawSprite(g, ghost, gx - ghost.width * 3.5, gy - ghost.height * 3.5, 7,
      { alpha: defeated ? 0.22 : 1 });

    if (shot) {
      const x = 165 + (shot.correct ? 565 : 860) * flight;
      const y = 276 + (205 - 276) * flight - 440 * flight * (1 - flight);
      if (flight < 1) {
        const marble = marbleSprite(null, 'happy', flight * Math.PI * 5);
        drawSprite(g, marble, r3(x - 32), r3(y - 32), 64 / marble.width);
        if (Math.random() < 0.45) this.fx.add({ kind: 'sparkle', x, y, life: 0.4, color: '#c4eaff' });
      }
    } else if (!this.settled && !complete) {
      pxEllipse(g, 165, 311, 36, 6, 'rgba(0,0,0,.25)');
      const marble = marbleSprite(null, 'steady', 0);
      drawSprite(g, marble, 129, 240 - Math.abs(Math.sin(t / 330)) * U, 72 / marble.width);
    }

    g.fillStyle = 'rgba(26,20,38,.86)';
    g.fillRect(246, 18, 468, 78);
    pixelText(g, 'THE NEMESIS', W / 2, 40, 17, '#f4e8ff');
    g.fillStyle = '#4c345e';
    g.fillRect(274, 57, 412, 18);
    g.fillStyle = '#c29bea';
    g.fillRect(277, 60, Math.max(0, 406 * this.shownStrength / Math.max(1, this.total)), 12);
    if (complete && !shot) pixelText(g, this.strength === 0 ? 'PERFECT REVIEW!' : 'REVIEW COMPLETE', W / 2, 354, 16, '#ffe6a0');
    this.fx.draw(g);
    g.restore();
  }
}
