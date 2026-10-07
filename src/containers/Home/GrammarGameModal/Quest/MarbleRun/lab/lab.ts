// Marble Lab: a dev page to play any level or boss without the app.
// Open /src/containers/Home/GrammarGameModal/Quest/MarbleRun/lab/index.html
// on the dev server. Right/Wrong answer with the buttons or arrow keys.
import { THEMES } from '../level/themes';
import { PracticeRun } from '../level/runner';
import { BOSSES } from '../boss/catalog';

const cv = document.getElementById('stage') as HTMLCanvasElement;
const g = cv.getContext('2d')!;
const pick = document.getElementById('pick') as HTMLSelectElement;
const statusEl = document.getElementById('status')!;
const infoEl = document.getElementById('info')!;

interface Item { key: string; label: string }
const items: Item[] = [];
let html = '';
for (let w = 1; w <= 10; w++) {
  html += `<optgroup label="World ${w}">`;
  THEMES.filter((t) => t.world === w).forEach((t, i) => {
    const key = `level:${t.id}`;
    items.push({ key, label: t.name });
    html += `<option value="${key}">Stop ${i + 1} · ${t.name} (${t.mode})</option>`;
  });
  BOSSES.filter((b) => b.world === w).forEach((b) => {
    const key = `boss:${b.id}`;
    items.push({ key, label: b.name });
    html += `<option value="${key}">${b.node === 'castle' ? 'Castle' : `Fort ${b.index}`} · ${b.name}</option>`;
  });
  html += '</optgroup>';
}
pick.innerHTML = html;

let run: PracticeRun | null = null;
let auto = false;
let nextAutoAt = 0;
let boss: any = null;

async function load(key: string) {
  location.hash = key;
  pick.value = key;
  run = null;
  boss = null;
  const [kind, id] = key.split(':');
  if (kind === 'level') {
    const theme = THEMES.find((t) => t.id === id)!;
    run = new PracticeRun(theme, id, {});
    infoEl.textContent = `${theme.name}: ${theme.mode} · ${theme.terrain} · ${theme.light}${theme.weather ? ` · ${theme.weather}` : ''} · obstacles ${theme.obstacles.join(', ')} · enemies ${theme.enemies.join(', ')}`;
  } else {
    const mod = await import('../boss/fight');
    const info = BOSSES.find((b) => b.id === id)!;
    boss = new mod.BossFight(info, {});
    infoEl.textContent = `${info.name} (menace ${info.menace}): ${info.moves}`;
  }
}

// for screenshot scripts: reach into the current level or fight
(window as any).__lab = { get run() { return run; }, get boss() { return boss; } };

function answer(ok: boolean) {
  if (run) run.answer(ok);
  if (boss) {
    if (ok) boss.answerRight();
    else boss.answerWrong();
  }
}

function step(i: number) {
  const at = items.findIndex((it) => it.key === pick.value);
  load(items[(at + i + items.length) % items.length].key);
}

document.getElementById('ok')!.onclick = () => answer(true);
document.getElementById('no')!.onclick = () => answer(false);
document.getElementById('restart')!.onclick = () => load(pick.value);
document.getElementById('prev')!.onclick = () => step(-1);
document.getElementById('next')!.onclick = () => step(1);
document.getElementById('auto')!.onclick = (e) => {
  auto = !auto;
  (e.target as HTMLButtonElement).textContent = `Auto: ${auto ? 'on' : 'off'}`;
};
pick.onchange = () => load(pick.value);
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') answer(true);
  if (e.key === 'ArrowLeft') answer(false);
  if (e.key === 'r') load(pick.value);
});

function frame(t: number) {
  if (run) {
    run.frame(g, t);
    statusEl.textContent = `${run.state.toUpperCase()} · GRADE ${run.grade || 'GLASS'} · MISSES ${run.misses} · NEXT: ${run.obstacle.label}`;
    if (auto && run.state === 'wait' && !run.busy && t > nextAutoAt) {
      nextAutoAt = t + 600;
      run.answer(Math.random() > 0.3);
    }
  }
  if (boss) {
    boss.frame(g, t);
    statusEl.textContent = boss.statusLine();
    if (auto && boss.canAnswer && t > nextAutoAt) {
      nextAutoAt = t + 900 + Math.random() * 2500;
      if (Math.random() > 0.2) boss.answerRight();
      else boss.answerWrong();
    }
  }
  requestAnimationFrame(frame);
}

load(location.hash.slice(1) || items[0].key);
requestAnimationFrame(frame);
