import {
  U,
  W,
  H,
  INK,
  r3,
  lowRes,
  loadImage,
  ready,
  pxEllipse,
  pixelRing,
  pixelText,
  star,
  whiteOf,
  Sprite
} from '../pixel';
import { Fx } from '../fx';
import { MR, PX, MSCALE, GRADE, Grade, marbleSprite, Face } from '../marble';
import {
  bossChime,
  perfectBonus,
  missSound,
  bossIntroSound,
  bossLaughSound,
  bossDownSound,
  thump,
  note,
  whoosh
} from '../audio';
import { BossInfo, bossTimeScale } from './catalog';
import { bossDef, arenaGeometry, arenaUrl } from './registry';
import type { BossApi, BossDef, BossMove, BossState, Shot } from './types';
import './bosses';

// A fort or castle fight: the test (Mikey 10-07). Seven hits graded exactly
// like Classic (speed sets S–F, a wrong pick costs time) except that each
// boss gives more time than Classic, easing down to exactly Classic at the
// final boss. Every answer is a marble thrown at the boss; its Classic points
// are the damage. The boss's health is the pass mark (70%: 490 of 700).
// Empty it and the boss is dazed; after the 7th hit it bursts. Health left
// over: it laughs, and the stop isn't cleared yet.

export const BOSS_HITS = 7;
export const PASS_POINTS = Math.round(BOSS_HITS * 100 * 0.7);
const CLASSIC_SHORT_MS = 12000; // Classic's base time for a short question

export function gradeFor(ms: number, baseMs: number): Grade {
  if (ms < baseMs * 0.2) return 'S';
  if (ms < baseMs * 0.3) return 'A';
  if (ms < baseMs * 0.5) return 'B';
  if (ms < baseMs * 0.7) return 'C';
  if (ms < baseMs) return 'D';
  return 'F';
}

export interface BossEvents {
  onReady?(): void; // ask the next question
  onFinish?(result: { passed: boolean; points: number; grades: Grade[] }): void;
}

type Phase = 'intro' | 'enter' | 'question' | 'throw' | 'done';

interface Warning {
  x: number;
  at: number;
  until: number;
  width: number;
  color: string;
  kind: 'column' | 'shadow' | 'ring';
  fn: () => void;
}
interface Beam {
  y: number;
  at: number;
  until: number;
  color: string;
  height: number;
  dodge: 'hop' | 'duck';
}

export class BossFight {
  info: BossInfo;
  def: BossDef;
  frames: Record<string, Sprite[]>;
  fx = new Fx();
  events: BossEvents;
  arena: HTMLImageElement;
  timeScale: number;

  phase: Phase = 'intro';
  phaseAt = 0;
  started = false;
  idx = 0;
  grades: Grade[] = [];
  streak = 0;
  answered: Grade | null = null;
  baseMs: number;
  questionAt = 0;
  wrongPicks = 0;

  hp = PASS_POINTS;
  shownHp = PASS_POINTS;
  bossPhase = 1;
  bossState: BossState = 'intro';
  hurtAt = -1e9;
  windAt = -1e9;
  nextAttack = 0;
  landed = false;
  diedAt = 0;
  gone = false;
  laughAt = 0;

  shots: Shot[] = [];
  warnings: Warning[] = [];
  beams: Beam[] = [];
  timers: { at: number; fn: () => void }[] = [];
  aimNow = false;
  struck = false;

  // marble
  mx = -60;
  my = 0;
  vy = 0;
  ducking = 0;
  turn = 0;
  squash = 1;
  hidden = false;
  impacted = false;
  hurtUntil = 0;
  flashAt = -1e9;
  t = 0;
  // an iced floor: the marble slides on momentum instead of holding its spot
  iceUntil = 0;
  slideV = 0;

  geo = { floorY: 304, ledgeY: 226, bossX: 830 };
  pose = { x: 830, y: 226, w: 160, h: 160 };

  constructor(info: BossInfo, events: BossEvents = {}) {
    this.info = info;
    this.def = bossDef(info.id) || bossDef('plural-slime')!;
    this.frames = this.def.frames();
    this.events = events;
    this.arena = loadImage(arenaUrl(info.arena));
    this.timeScale = bossTimeScale(info.id);
    this.baseMs = CLASSIC_SHORT_MS * this.timeScale;
  }

  // Classic's reading pause: the question shows alone, then the choices
  // appear and the clock starts (the same pause the server allows for)
  revealMs = 1500;
  get revealed() {
    return this.phase === 'question' && this.t >= this.questionAt;
  }
  // pick up a fight reopened after a reload: the hits so far already landed
  resume(grades: Grade[]) {
    this.grades = grades.slice(0, BOSS_HITS);
    this.idx = this.grades.length;
    this.hp = PASS_POINTS - this.points;
    this.shownHp = Math.max(0, this.hp);
  }

  get canAnswer() {
    return this.revealed && !this.answered;
  }
  get points() {
    return this.grades.reduce((s, gr) => s + GRADE[gr][1], 0);
  }

  // the server sends each question's time limit (Classic's base time for its
  // choices × this boss's scale) and its reading pause
  // usedMs: time this hit's clock already ran before the fight was reopened
  // (the server keeps it), so the ring starts that far down
  setQuestion({
    baseTimeMs,
    revealDelayMs,
    usedMs = 0
  }: {
    baseTimeMs: number;
    revealDelayMs: number;
    usedMs?: number;
  }) {
    this.baseMs = baseTimeMs;
    this.revealMs = revealDelayMs;
    this.usedMs = usedMs;
  }
  usedMs = 0;
  // after a hit that took wrong clicks, the explanation is read before the
  // next question comes on (the server adds the same time to its clock)
  holdMs = 0;

  // the server's word is final: a graded pick lands even if this frame's
  // own reading pause has not quite run out
  answerRight(grade?: Grade, holdMs = 0) {
    if (this.phase !== 'question' || this.answered) return;
    this.holdMs = holdMs;
    const g =
      grade ||
      gradeFor(this.t - this.questionAt + this.wrongPicks * 2000, this.baseMs);
    this.answered = g;
    if (g === 'F') {
      missSound();
      this.streak = 0;
    } else if (this.idx === BOSS_HITS - 1 && this.streak === BOSS_HITS - 1) {
      this.streak++;
      perfectBonus();
    } else {
      bossChime(this.streak);
      this.streak++;
    }
    this.phase = 'throw';
    this.phaseAt = this.t;
  }

  answerWrong() {
    if (this.phase !== 'question' || this.answered) return;
    this.wrongPicks++;
    this.streak = 0;
    note(55, { instrument: 'marimba', level: 0.12 });
    this.attack(this.t, true);
  }

  statusLine() {
    return `${this.info.name.toUpperCase()} · HIT ${Math.min(this.idx + 1, BOSS_HITS)}/${BOSS_HITS} · ${this.points}/${PASS_POINTS} · TIME ×${this.timeScale}${this.bossPhase === 2 ? ' · PHASE 2' : ''}`;
  }

  // ---- the api handed to boss moves
  private api(aim: boolean): BossApi {
    const f = this;
    return {
      t: f.t,
      fx: f.fx,
      W,
      H,
      floorY: f.geo.floorY,
      ledgeY: f.geo.ledgeY,
      bossX: f.pose.x,
      bossTop: f.pose.y - f.pose.h,
      bossW: f.pose.w,
      bossH: f.pose.h,
      marbleX: f.mx,
      marbleY: f.my,
      menace: f.info.menace,
      phase: f.bossPhase,
      aim,
      spawn(s) {
        s.born = f.t;
        if (aim && !s.hit && s.dodge !== 'none') {
          // the first shot of an aimed move flies straight at the marble
          s.hit = true;
          const frames = 34;
          const tx = f.mx - (s.frames[0].width * (s.scale || U)) / 2;
          const ty =
            f.geo.floorY - MR - (s.frames[0].height * (s.scale || U)) / 2;
          s.vx = (tx - s.x) / frames;
          s.vy = s.g
            ? (ty - s.y - (s.g * frames * frames) / 2) / frames
            : (ty - s.y) / frames;
          s.bounce = 0;
          s.onFloor = false;
          aim = false;
        }
        f.shots.push(s);
        return s;
      },
      warn(x, ms, fn, opts = {}) {
        f.warnings.push({
          x,
          at: f.t,
          until: f.t + ms,
          width: opts.width || 60,
          color: opts.color || '#ff4d6d',
          kind: opts.kind || 'column',
          fn
        });
      },
      after(ms, fn) {
        f.timers.push({ at: f.t + ms, fn });
      },
      shake: (mag, ms) => f.fx.shake(f.t, mag, ms),
      flash: (ms, color) => f.fx.flash(f.t, ms, color),
      tint: (ms, color) => f.fx.tint(f.t, ms, color),
      beam(y, ms, opts = {}) {
        f.beams.push({
          y,
          at: f.t,
          until: f.t + ms,
          color: opts.color || '#ff4d6d',
          height: opts.height || 18,
          dodge: opts.dodge || 'hop'
        });
        if (aim) f.hurtMarble();
      },
      strikeMarble() {
        if (aim) f.hurtMarble();
      },
      iceFloor(ms) {
        f.iceUntil = Math.max(f.iceUntil, f.t + ms);
      },
      sound: { thump, note, whoosh }
    };
  }

  private attack(t: number, aimed: boolean) {
    const moves = this.def.moves.filter(
      (m) => !m.phase || m.phase === this.bossPhase
    );
    if (!moves.length) return;
    const total = moves.reduce((s, m) => s + (m.weight || 1), 0);
    let r = Math.random() * total;
    let move: BossMove = moves[0];
    for (const m of moves) {
      r -= m.weight || 1;
      if (r <= 0) {
        move = m;
        break;
      }
    }
    this.windAt = t;
    this.bossState = 'wind';
    const pace =
      Math.max(1500, 2900 - this.info.menace * 130) *
      (this.bossPhase === 2 ? 0.75 : 1);
    this.nextAttack = t + pace * (0.8 + Math.random() * 0.4);
    this.timers.push({
      at: t + (aimed ? Math.min(move.windup, 300) : move.windup),
      fn: () => {
        this.struck = false;
        move.run(this.api(aimed));
        if (this.bossState === 'wind') this.bossState = 'idle';
      }
    });
    // big bosses sometimes chain a second move
    if (
      !aimed &&
      this.info.menace >= 7 &&
      Math.random() < (this.info.menace - 6) * 0.12
    ) {
      const second = moves[Math.floor(Math.random() * moves.length)];
      this.timers.push({
        at: t + move.windup + 700,
        fn: () => second.run(this.api(false))
      });
    }
  }

  private hurtMarble() {
    if (this.struck) return;
    this.struck = true;
    this.flashAt = this.t;
    this.hurtUntil = this.t + 700;
    this.mx -= 30;
    this.squash = 0.65;
    this.fx.shake(this.t, 7, 220);
    thump(0.7);
    this.fx.burst('dust', 10, this.mx, this.my);
    this.fx.text('OUCH', this.mx, this.my - 46, '#ff9db0', 12);
  }

  // ---- per frame
  private update(t: number) {
    if (!this.started) {
      this.started = true;
      this.phaseAt = t;
      bossIntroSound(this.info.menace);
    }
    this.t = t;
    for (const tm of this.timers.filter((x) => x.at <= t)) {
      this.timers.splice(this.timers.indexOf(tm), 1);
      tm.fn();
    }
    for (const w of this.warnings.filter((x) => x.until <= t)) {
      this.warnings.splice(this.warnings.indexOf(w), 1);
      w.fn();
    }
    this.beams = this.beams.filter((b) => b.until > t);
    this.updateBoss(t);
    this.updateMarble(t);
  }

  private updateBoss(t: number) {
    const since = t - this.phaseAt;
    if (this.phase === 'intro') {
      // 3 s + the 0.6 s roll-in = the server's intro (BOSS_INTRO_MS), so the
      // choices open on both clocks at the same moment
      const introMs = 3000;
      if (since > introMs) {
        this.bossState = 'idle';
        this.nextAttack = t + 1600;
        this.startQuestion(t);
      }
    }
    if (this.hp <= 0 && this.bossState !== 'dying' && !this.gone)
      this.bossState = 'dazed';
    else if (this.bossState === 'hurt' && t - this.hurtAt > 260)
      this.bossState = 'idle';
    if (this.phase === 'question' && this.hp > 0 && t > this.nextAttack)
      this.attack(t, false);
    // phase 2 when health runs low on bigger bosses
    if (
      this.bossPhase === 1 &&
      this.info.menace >= 5 &&
      this.hp > 0 &&
      this.hp <= PASS_POINTS * 0.5
    ) {
      this.bossPhase = 2;
      this.fx.flash(t, 160, 'rgba(255,60,90,.45)');
      this.fx.shake(t, 12, 600);
      this.fx.text(
        "IT'S ANGRY!",
        this.pose.x,
        this.pose.y - this.pose.h - 30,
        '#ff4d6d',
        16
      );
      thump(1.2);
      note(40, { instrument: 'pad', level: 0.16, hold: 1 });
    }
    this.shownHp += (Math.max(0, this.hp) - this.shownHp) * 0.12;
    if (this.bossState === 'dying' && !this.gone && t - this.diedAt > 520)
      this.explode(t);
  }

  private startQuestion(t: number) {
    this.answered = null;
    this.wrongPicks = 0;
    this.impacted = false;
    this.hidden = false;
    this.mx = -40;
    this.turn = 0;
    this.phase = 'enter';
    this.phaseAt = t;
  }

  private updateMarble(t: number) {
    const floor = this.geo.floorY - MR;
    const since = t - this.phaseAt;
    const startX = 150;
    if (this.phase === 'enter') {
      const k = Math.min(1, since / 600);
      const x = -40 + (startX + 40) * k;
      this.turn += (x - this.mx) / MR;
      this.mx = x;
      if (k >= 1) {
        this.phase = 'question';
        this.questionAt = t + this.revealMs - this.usedMs;
        this.usedMs = 0;
        this.events.onReady?.();
      }
    } else if (this.phase === 'question') {
      let x: number;
      if (t < this.iceUntil) {
        // on ice it can't hold still: it drifts on, overshoots and wobbles
        // back, leaving a glint of frost where it skids
        this.slideV += (startX + Math.sin(t / 420) * 46 - this.mx) * 0.004;
        this.slideV *= 0.985;
        x = Math.max(70, Math.min(300, this.mx + this.slideV));
        if (x === 70 || x === 300) this.slideV *= -0.5;
        if (Math.abs(this.slideV) > 1.2 && Math.random() < 0.3) {
          this.fx.add({
            kind: 'snow',
            x: this.mx - Math.sign(this.slideV) * MR,
            y: floor + MR - 3,
            vx: -this.slideV * 0.3,
            vy: -0.6,
            life: 0.6
          });
        }
      } else {
        this.slideV = 0;
        x = this.mx + (startX + Math.sin(t / 700) * 12 - this.mx) * 0.08;
      }
      this.turn += (x - this.mx) / MR;
      this.mx = x;
    } else if (this.phase === 'throw') {
      this.updateThrow(t, since, startX, floor);
    }
    // dodging: hop over low shots and beams, duck under high ones
    if (this.phase !== 'throw' && this.my >= floor - 1 && !this.hidden) {
      for (const s of this.shots) {
        if (s.hit || s.dodge === 'none' || s.done) continue;
        const sw = s.frames[0].width * (s.scale || U);
        const sh = s.frames[0].height * (s.scale || U);
        const ahead =
          s.x + sw > this.mx - 30 && s.x < this.mx + 120 && (s.vx || 0) <= 0.5;
        if (!ahead) continue;
        if (s.dodge === 'duck' || s.y + sh < floor - 10) {
          if (s.y + sh > floor - MR - 30) this.ducking = t + 300;
        } else if (s.y + sh > floor - 130) {
          this.vy = -10;
          break;
        }
      }
      for (const b of this.beams) {
        if (t - b.at > 200) continue;
        if (b.dodge === 'duck') this.ducking = t + (b.until - t);
        else if (this.vy === 0) this.vy = -11;
      }
    }
    if (this.phase !== 'throw') {
      if (this.vy !== 0 || this.my < floor) {
        this.vy += 0.7;
        this.my += this.vy;
        if (this.my >= floor) {
          this.my = floor;
          this.vy = 0;
          this.squash = 0.8;
        }
      } else this.my = floor;
    }
    if (t < this.ducking) this.squash = Math.min(this.squash, 0.62);
    this.squash += (1 - this.squash) * 0.18;
  }

  private updateThrow(t: number, since: number, startX: number, floor: number) {
    const g = this.answered!;
    const ARC: Record<Grade, [number, number, number]> = {
      S: [380, 150, 2],
      A: [430, 110, 1],
      B: [500, 70, 1],
      C: [580, 40, 0],
      D: [660, 22, 0],
      F: [950, 0, 0]
    };
    const [dur, h, spins] = ARC[g];
    const wind = 260;
    const fromX = startX - 24;
    // aim at the boss's body; a boss drawn away from its ledge says where it is
    const away = this.def.target?.(t);
    const hitX = away ? away.x : this.pose.x - this.pose.w * 0.3;
    const hitY = away ? away.y : this.pose.y - this.pose.h * 0.45;
    if (since < wind) {
      this.mx += (fromX - this.mx) * 0.25;
      this.squash = 0.8;
      this.my = floor;
    } else if (!this.impacted) {
      const k = Math.min(1, (since - wind) / dur);
      this.mx = fromX + (hitX - fromX) * k;
      this.my = floor + (hitY - floor) * k - h * 4 * k * (1 - k);
      this.turn = spins * Math.PI * 2 * k;
      if (k >= 1) this.impact(t);
    }
    if (since > 1500 + this.holdMs) {
      this.grades.push(g);
      this.idx++;
      this.my = floor;
      if (this.idx < BOSS_HITS) this.startQuestion(t);
      else this.finish(t);
    }
  }

  private impact(t: number) {
    const g = this.answered!;
    this.impacted = true;
    this.hidden = true;
    const pts = GRADE[g][1];
    const big = { S: 1, A: 0.8, B: 0.6, C: 0.45, D: 0.35, F: 0.15 }[g];
    const before = this.hp;
    this.hp -= pts;
    this.hurtAt = t;
    if (this.hp > 0) this.bossState = 'hurt';
    this.fx.shake(t, Math.round(4 + big * 12), 140 + big * 260);
    thump(0.4 + big * 0.8);
    this.fx.text(
      `-${pts}`,
      this.mx,
      this.my - 40,
      GRADE[g][0],
      g === 'S' ? 22 : 16
    );
    this.fx.burst(
      g === 'F' ? 'dust' : 'shard',
      g === 'F' ? 8 : 10 + Math.round(big * 16),
      this.mx,
      this.my,
      { color: GRADE[g][0], speed: 0.8 + big }
    );
    if (g === 'S')
      this.fx.burst('star', 12, this.mx, this.my, { color: GRADE.S[0] });
    if (this.hp <= 0 && before > 0) {
      this.fx.text(
        'BREAK!',
        this.pose.x,
        this.pose.y - this.pose.h - 24,
        '#ffcb32',
        20
      );
      this.fx.flash(t, 120);
      this.shots = [];
      this.warnings = [];
      this.beams = [];
    }
  }

  private finish(t: number) {
    this.phase = 'done';
    const passed = this.hp <= 0;
    if (passed) {
      this.bossState = 'dying';
      this.diedAt = t;
    } else {
      this.bossState = 'laugh';
      this.laughAt = t;
      bossLaughSound();
    }
    this.events.onFinish?.({
      passed,
      points: this.points,
      grades: this.grades
    });
  }

  private explode(t: number) {
    this.gone = true;
    const sprite = this.def.pose(t, 'hurt', this.frames).frame;
    const p = sprite.getContext('2d')!;
    const d = p.getImageData(0, 0, sprite.width, sprite.height).data;
    const sc = this.pose.w / sprite.width;
    for (let y = 0; y < sprite.height; y += 2) {
      for (let x = 0; x < sprite.width; x += 2) {
        const i = (y * sprite.width + x) * 4;
        if (!d[i + 3]) continue;
        const px = this.pose.x - this.pose.w / 2 + x * sc;
        const py = this.pose.y - this.pose.h + y * sc;
        const a = Math.atan2(
          py - (this.pose.y - this.pose.h / 2),
          px - this.pose.x
        );
        const sp = 2 + Math.random() * 5;
        this.fx.add({
          kind: 'frag',
          x: px,
          y: py,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 3,
          life: 1.4,
          color: `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`,
          size: Math.max(U, Math.round((sc * 2) / U) * U)
        });
      }
    }
    this.fx.flash(t, 260);
    this.fx.shake(t, 14, 500);
    bossDownSound();
  }

  // ---- drawing
  frame(g: CanvasRenderingContext2D, t: number) {
    this.update(t);
    const [sx, sy] = this.fx.shakeOffset(t);
    g.save();
    g.translate(sx, sy);
    g.fillStyle = INK;
    g.fillRect(-40, -40, W + 80, H + 80);
    this.drawArena(g, t);
    this.drawWarnings(g, t);
    this.drawBoss(g, t);
    this.drawBeams(g, t);
    this.drawMarble(g, t);
    this.drawShots(g, t);
    this.fx.draw(g, 0);
    g.restore();
    if (this.phase === 'intro') this.drawIntro(g, t);
    else if (!this.gone || t - this.diedAt < 1000) this.drawHud(g, t);
    this.fx.overlay(g, t, W, H);
  }

  private vignette: HTMLCanvasElement | null = null;
  private drawArena(g: CanvasRenderingContext2D, t: number) {
    const geo = arenaGeometry(this.info.arena);
    const img = this.arena;
    if (ready(img)) {
      const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const dw = Math.round(img.naturalWidth * sc);
      const dh = Math.round(img.naturalHeight * sc);
      const ox = Math.round((W - dw) / 2);
      const oy = H - dh;
      g.imageSmoothingEnabled = false;
      g.drawImage(lowRes(img, dw, dh), ox, oy, dw, dh);
      this.geo = {
        floorY: r3(oy + dh * geo.floor),
        ledgeY: r3(oy + dh * geo.ledge),
        bossX: r3(ox + dw * geo.ledgeX)
      };
    } else {
      g.fillStyle = this.info.node === 'castle' ? '#2a1f45' : '#4a3a2a';
      g.fillRect(0, 0, W, H);
      this.geo = { floorY: r3(H * 0.8), ledgeY: r3(H * 0.6), bossX: W - 170 };
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.fillRect(W - 300, this.geo.ledgeY, 300, H);
    }
    if (!this.vignette) {
      const v = document.createElement('canvas');
      v.width = W;
      v.height = H;
      const p = v.getContext('2d')!;
      const gr = p.createRadialGradient(
        W / 2,
        H * 0.55,
        H * 0.35,
        W / 2,
        H * 0.55,
        W * 0.62
      );
      gr.addColorStop(0, 'rgba(10,4,20,0)');
      gr.addColorStop(1, 'rgba(10,4,20,.72)');
      p.fillStyle = gr;
      p.fillRect(0, 0, W, H);
      this.vignette = v;
    }
    // darker and redder as the menace grows, and in phase 2
    g.globalAlpha = Math.min(
      1,
      0.8 +
        this.info.menace * 0.02 +
        Math.sin(t / 340) * 0.08 +
        Math.sin(t / 97) * 0.04
    );
    g.drawImage(this.vignette, 0, 0);
    g.globalAlpha = 1;
    if (this.bossPhase === 2 && !this.gone) {
      g.fillStyle = `rgba(160,20,60,${0.1 + Math.sin(t / 260) * 0.05})`;
      g.fillRect(0, 0, W, H);
    }
  }

  private bossPlace(t: number) {
    const f = this.frames;
    const base = this.def.pose(t, 'idle', f).frame;
    const w = base.width * this.def.scale;
    const h = base.height * this.def.scale;
    let x = Math.min(this.geo.bossX, r3(W - w / 2 - 6));
    let y = this.geo.ledgeY - (this.def.hover || 0);
    if (this.phase === 'intro') {
      const since = t - this.phaseAt;
      const k = Math.min(1, Math.max(0, (since - 250) / 450));
      const intro = this.def.intro || (this.def.hover ? 'fly' : 'drop');
      if (intro === 'drop') y -= (1 - k * k) * 420;
      if (intro === 'fly') x += (1 - k) * 380;
      if (intro === 'rise') y += (1 - k) * 200;
      if (k >= 1 && !this.landed) {
        this.landed = true;
        if (intro === 'drop') {
          this.fx.shake(t, 6 + this.info.menace, 300);
          this.fx.burst('dust', 16, x, this.geo.ledgeY - 4);
        }
      }
    }
    const kb = t - this.hurtAt;
    if (kb < 300) x += Math.round(((1 - kb / 300) * 18) / U) * U;
    if (this.bossState === 'laugh') y -= Math.abs(Math.sin(t / 110)) * 14;
    return { x, y, w, h };
  }

  private drawBoss(g: CanvasRenderingContext2D, t: number) {
    if (this.gone) return;
    const place = this.bossPlace(t);
    const state: BossState = this.phase === 'intro' ? 'intro' : this.bossState;
    const pose = this.def.pose(t, state, this.frames);
    const w = pose.frame.width * this.def.scale * (pose.sx || 1);
    const h = pose.frame.height * this.def.scale * (pose.sy || 1);
    const x = place.x + (pose.dx || 0);
    let y = place.y + (pose.dy || 0);
    if (state === 'dazed') y += 2 * U;
    this.pose = { x, y, w, h };
    const api = this.api(false);
    // shadow on the ledge
    pxEllipse(
      g,
      x,
      this.geo.ledgeY - 2,
      w * 0.38 * (this.def.hover ? 0.7 : 1),
      2 * U,
      'rgba(0,0,0,.28)'
    );
    if (this.phase === 'intro' && this.info.menace >= 8) {
      // the biggest bosses appear as a silhouette first
      const since = t - this.phaseAt;
      if (since < 1200) g.globalAlpha = Math.min(1, since / 1200);
    }
    g.save();
    g.imageSmoothingEnabled = false;
    g.translate(r3(x), r3(y));
    const tilt =
      (pose.tilt || 0) + (state === 'dazed' ? Math.sin(t / 300) * 0.12 : 0);
    if (tilt) g.rotate(tilt);
    if (pose.flip) g.scale(-1, 1);
    const flashing =
      t - this.hurtAt < 120 ||
      (state === 'dying' && Math.floor(t / 70) % 2 === 0);
    g.globalAlpha *= pose.alpha ?? 1;
    g.drawImage(
      flashing ? whiteOf(pose.frame) : pose.frame,
      Math.round(-w / 2),
      Math.round(-h),
      Math.round(w),
      Math.round(h)
    );
    g.restore();
    g.globalAlpha = 1;
    this.def.drawExtra?.(g, t, api, state);
    if (state === 'dazed') {
      for (let i = 0; i < 3; i++) {
        const a = t / 260 + (i * Math.PI * 2) / 3;
        g.fillStyle = i % 2 ? '#fff' : '#ffcb32';
        star(g, x + Math.cos(a) * w * 0.32, y - h - 10 + Math.sin(a) * 9, 6);
      }
    }
  }

  private drawWarnings(g: CanvasRenderingContext2D, t: number) {
    for (const w of this.warnings) {
      const k = (t - w.at) / (w.until - w.at);
      const blink = 0.35 + Math.abs(Math.sin(t / (90 - k * 50))) * 0.45;
      g.globalAlpha = blink;
      g.fillStyle = w.color;
      if (w.kind === 'column') {
        g.fillRect(r3(w.x - w.width / 2), 0, r3(w.width), this.geo.floorY);
        g.globalAlpha = 1;
        g.fillRect(
          r3(w.x - w.width / 2),
          this.geo.floorY - U * 2,
          r3(w.width),
          U * 2
        );
      } else if (w.kind === 'shadow') {
        pxEllipse(
          g,
          w.x,
          this.geo.floorY - U,
          (w.width / 2) * (0.4 + k * 0.6),
          U * 3,
          'rgba(0,0,0,.5)'
        );
      } else {
        pixelRing(
          g,
          w.x,
          this.geo.floorY - MR,
          w.width * (1 - k) + 10,
          1,
          w.color
        );
      }
      g.globalAlpha = 1;
    }
  }

  private drawBeams(g: CanvasRenderingContext2D, t: number) {
    for (const b of this.beams) {
      const k = (t - b.at) / (b.until - b.at);
      const hh = r3(
        b.height * (k < 0.1 ? k * 10 : k > 0.85 ? (1 - k) / 0.15 : 1)
      );
      g.fillStyle = b.color;
      g.globalAlpha = 0.35;
      g.fillRect(0, r3(b.y - hh), W, hh * 2);
      g.globalAlpha = 1;
      g.fillRect(0, r3(b.y - hh / 2), W, Math.max(U, hh));
      g.fillStyle = '#ffffff';
      g.fillRect(0, r3(b.y - U / 2), W, U);
    }
  }

  private drawShots(g: CanvasRenderingContext2D, t: number) {
    const floor = this.geo.floorY;
    const api = this.api(false);
    for (const s of this.shots) {
      if (s.done) continue;
      s.update?.(s, t, api);
      s.x += s.vx || 0;
      s.y += s.vy || 0;
      s.vy = (s.vy || 0) + (s.g || 0);
      const sc = s.scale || U;
      const fr = s.frames[Math.floor(t / (s.frameMs || 90)) % s.frames.length];
      const sw = fr.width * sc;
      const sh = fr.height * sc;
      if (s.onFloor) s.y = floor - sh;
      else if (s.bounce && !s.hit && s.y + sh > floor) {
        s.y = floor - sh;
        s.vy = -(s.vy || 0) * s.bounce;
        s.vx = (s.vx || 0) * 0.97;
      }
      if (s.glow) {
        // a soft halo that adds light rather than covering what's behind
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.3;
        pxEllipse(g, s.x + sw / 2, s.y + sh / 2, sw * 0.8, sh * 0.8, s.glow);
        g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
      }
      g.save();
      g.imageSmoothingEnabled = false;
      if (s.spin) {
        s.angle = (s.angle || 0) + s.spin;
        g.translate(r3(s.x + sw / 2), r3(s.y + sh / 2));
        g.rotate(Math.round(s.angle / (Math.PI / 4)) * (Math.PI / 4));
        g.drawImage(fr, -sw / 2, -sh / 2, sw, sh);
      } else g.drawImage(fr, r3(s.x), r3(s.y), sw, sh);
      g.restore();
      if (
        s.hit &&
        Math.abs(s.x + sw / 2 - this.mx) < MR + sw / 3 &&
        Math.abs(s.y + sh / 2 - this.my) < MR + sh / 3
      ) {
        s.done = true;
        this.hurtMarble();
      }
      if (s.life && t - (s.born || 0) > s.life) s.done = true;
    }
    this.shots = this.shots.filter(
      (s) =>
        !s.done &&
        s.x > -120 &&
        s.x < W + 120 &&
        s.y < H + 60 &&
        s.y > -400 &&
        t - (s.born || 0) < 8000
    );
  }

  private drawMarble(g: CanvasRenderingContext2D, t: number) {
    if (this.hidden || this.phase === 'intro') return;
    const floor = this.geo.floorY;
    const elapsed = Math.max(0, t - this.questionAt) + this.wrongPicks * 2000;
    const live =
      this.phase === 'question'
        ? gradeFor(elapsed, this.baseMs)
        : this.answered || 'S';
    const struggling = this.phase === 'question' && 'CDF'.includes(live);
    const air = floor - MR - this.my;
    pxEllipse(
      g,
      this.mx,
      floor - U,
      MR * Math.max(0.35, 1 - Math.max(0, air) / 200),
      U * 2,
      'rgba(0,0,0,.2)'
    );
    if (this.phase === 'question')
      pixelRing(
        g,
        this.mx,
        this.my,
        MR + 9,
        Math.max(0, 1 - elapsed / this.baseMs),
        GRADE[live][0]
      );
    const filled = this.phase === 'throw';
    const face: Face =
      struggling || t < this.hurtUntil
        ? 'strained'
        : live === 'B'
          ? 'steady'
          : 'happy';
    if (this.phase === 'question' && !this.vy)
      this.turn +=
        (Math.round(this.turn / (Math.PI * 2)) * Math.PI * 2 - this.turn) *
        0.15;
    const sprite = marbleSprite(
      filled ? this.answered : null,
      face,
      this.turn + (struggling ? Math.sin(t / 90) * 0.12 : 0)
    );
    const w = (PX * MSCALE) / Math.sqrt(this.squash);
    const h = PX * MSCALE * this.squash;
    g.imageSmoothingEnabled = false;
    const cx = this.mx + (struggling ? Math.sin(t / 70) * 1.5 : 0);
    g.drawImage(
      sprite,
      r3(cx - w / 2),
      r3(this.my + MR - h),
      Math.round(w),
      Math.round(h)
    );
    if (t - this.flashAt < 300) {
      g.globalAlpha = 0.5;
      pxEllipse(g, cx, this.my, MR + 3, MR + 3, '#ff3c5a');
      g.globalAlpha = 1;
    }
  }

  private drawHud(g: CanvasRenderingContext2D, t: number) {
    const castle = this.info.node === 'castle';
    const w = castle ? 420 : 360;
    const x = W / 2 - w / 2;
    const y = 30;
    const h = castle ? 21 : 18;
    pixelText(
      g,
      this.info.name.toUpperCase(),
      x,
      y - 8,
      castle ? 12 : 11,
      castle ? '#ffcb32' : '#fff',
      'left'
    );
    g.fillStyle = castle ? '#ffcb32' : INK;
    g.fillRect(x - U * 2, y - U * 2, w + U * 4, h + U * 4);
    g.fillStyle = INK;
    g.fillRect(x - U, y - U, w + U * 2, h + U * 2);
    g.fillStyle = '#3a2a52';
    g.fillRect(x, y, w, h);
    const fw = r3((w * this.shownHp) / PASS_POINTS);
    g.fillStyle = this.bossPhase === 2 ? '#ff2d55' : '#ff4d6d';
    g.fillRect(x, y, fw, h);
    g.fillStyle = '#ff9db0';
    g.fillRect(x, y, fw, U);
    g.fillStyle = 'rgba(26,20,38,.45)';
    for (let k = 1; k < BOSS_HITS; k++)
      g.fillRect(r3(x + (w * k) / BOSS_HITS), y, U, h);
    if (this.hp <= 0 && !this.gone) {
      g.globalAlpha = 0.6 + Math.sin(t / 120) * 0.4;
      pixelText(g, 'DAZED!', x + w, y - 8, 11, '#ffcb32', 'right');
      g.globalAlpha = 1;
    }
    // the seven hits so far
    for (let i = 0; i < BOSS_HITS; i++) {
      const gr = this.grades[i];
      const cx = W - 30 - (BOSS_HITS - 1 - i) * 22;
      g.fillStyle = INK;
      g.fillRect(cx - 9, H - 30, 18, 18);
      g.fillStyle = gr ? GRADE[gr][0] : '#3a2a52';
      g.fillRect(cx - 6, H - 27, 12, 12);
    }
  }

  private drawIntro(g: CanvasRenderingContext2D, t: number) {
    const since = t - this.phaseAt;
    const big = this.info.menace >= 8;
    const total = big ? 3000 : 2000;
    if (big && since < 900) {
      g.fillStyle = `rgba(0,0,0,${0.85 - since / 1200})`;
      g.fillRect(0, 0, W, H);
    }
    const bar =
      Math.min(1, since / 250) *
      (since > total - 250 ? Math.max(0, (total - since) / 250) : 1) *
      (big ? 60 : 46);
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, r3(bar));
    g.fillRect(0, H - r3(bar), W, r3(bar));
    if (since > 700 && since < total - 100) {
      g.globalAlpha = Math.min(1, (since - 700) / 150);
      const title =
        this.info.node === 'castle' ? 'CASTLE' : `FORT ${this.info.index}`;
      pixelText(g, title, W / 2, H / 2 - 40, 14, '#ffcb32');
      pixelText(
        g,
        this.info.name.toUpperCase(),
        W / 2,
        H / 2,
        big ? 28 : 24,
        '#fff'
      );
      if (big)
        pixelText(g, 'THE TEST BEGINS', W / 2, H / 2 + 34, 10, '#ff9db0');
      g.globalAlpha = 1;
    }
  }
}
