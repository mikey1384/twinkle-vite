// Fit Lab (dev only): opens the real /grammarbles in frames of many device
// sizes, drives one screen in each, and reports anything cropped (outside the
// viewport and not inside something that scrolls) or a page that scrolls when
// the screen should fit. Mikey 10-07: every screen fits, on every device.
// Results also land on window.__fit for scripts.

const SIZES: [number, number, string][] = [
  [360, 640, 'Android small'],
  [390, 844, 'iPhone'],
  [430, 932, 'iPhone Max'],
  [844, 390, 'Phone landscape'],
  [768, 1024, 'iPad portrait'],
  [744, 1133, 'iPad mini portrait'],
  [810, 1080, 'iPad 10.2 portrait'],
  [820, 1180, 'iPad Air portrait'],
  [1024, 1366, 'iPad Pro portrait'],
  [1180, 820, 'iPad Air landscape'],
  [1024, 768, 'iPad landscape'],
  [1280, 720, 'Laptop short'],
  [1512, 771, 'MacBook (Mikey)'],
  [1440, 900, 'Laptop'],
  [1920, 1080, 'Desktop']
];

type Doc = Document;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitFor<T>(fn: () => T | null | undefined | false, ms = 12000): Promise<T> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = fn();
    if (v) return v as T;
    await sleep(150);
  }
  throw new Error('timed out');
}
const buttons = (d: Doc) => Array.from(d.querySelectorAll('button')) as HTMLButtonElement[];
const byLabel = (d: Doc, label: string) => buttons(d).find((b) => b.getAttribute('aria-label') === label);
const byText = (d: Doc, text: string) => buttons(d).find((b) => (b.textContent || '').trim().replace(/\s+/g, ' ').includes(text));
const mapNodes = (d: Doc) => buttons(d).filter((b) => b.style.left.endsWith('%'));

async function openMenu(d: Doc) {
  await waitFor(() => byLabel(d, 'Play Quest'));
}
async function openQuest(d: Doc) {
  await openMenu(d);
  byLabel(d, 'Play Quest')!.click();
  await waitFor(() => mapNodes(d).length > 0);
  await sleep(600);
}
async function openClassic(d: Doc) {
  await openMenu(d);
  byLabel(d, 'Play Classic')!.click();
  await sleep(1500);
}
async function startNode(d: Doc, pick: (nodes: HTMLButtonElement[]) => HTMLButtonElement | undefined) {
  await openQuest(d);
  const node = pick(mapNodes(d));
  if (!node) throw new Error('no node');
  node.click();
  await sleep(300);
  const play = await waitFor(() => buttons(d).find((b) => /^(Play|Play again)$/i.test((b.textContent || '').trim()) && !b.disabled));
  play.click();
  await waitFor(() => d.querySelector('canvas'));
}
// answer buttons start with their letter badge (A–D)
const choiceButtons = (d: Doc) =>
  buttons(d).filter((b) => /^[ABCD]$/.test((b.firstElementChild?.textContent || '').trim()) && !b.closest('nav'));

const SCENARIOS: Record<string, (d: Doc) => Promise<string | void>> = {
  menu: openMenu,
  'quest map': openQuest,
  'quest rankings': async (d) => {
    await openQuest(d);
    byText(d, 'Rankings')!.click();
    await sleep(1500);
  },
  'practice (asking)': async (d) => {
    await startNode(d, (n) => n[0]);
    await waitFor(() => choiceButtons(d).some((b) => !b.disabled));
  },
  'practice (miss card)': async (d) => {
    await startNode(d, (n) => n[0]);
    await waitFor(() => choiceButtons(d).some((b) => !b.disabled));
    choiceButtons(d)[3].click();
    await sleep(2500);
    return byText(d, 'Read it') || byText(d, 'Continue') ? 'miss card shown' : 'answer was right (no card)';
  },
  'boss (asking)': async (d) => {
    await startNode(d, (n) => n.find((b) => /fort/i.test(b.getAttribute('aria-label') || '')));
    await waitFor(() => choiceButtons(d).some((b) => !b.disabled), 15000);
  },
  // plays a real boss fight to its result (tries the choices in order)
  'boss to result': async (d) => {
    await startNode(d, (n) => n.find((b) => /fort/i.test(b.getAttribute('aria-label') || '')));
    const end = Date.now() + 150000;
    while (Date.now() < end && !byText(d, 'Back to map')) {
      const choice = choiceButtons(d).find((b) => !b.disabled);
      if (choice) choice.click();
      await sleep(700);
    }
    if (!byText(d, 'Back to map')) throw new Error('no result screen');
    await sleep(1500);
  },
  'classic start': openClassic,
  'classic how to play': async (d) => {
    await openClassic(d);
    byText(d, 'How to Play')!.click();
    await sleep(800);
  },
  // dev-only sample screens (fitPreview.ts)
  'classic game (preview)': async (d) => {
    await waitFor(() => d.querySelector('[data-agent-no-play]'));
    await sleep(2500);
  },
  'classic finish (preview)': async (d) => {
    await waitFor(() => d.querySelector('[data-agent-no-play]'));
    await sleep(2500);
  },
  'quest result (preview)': async (d) => {
    await waitFor(() => byText(d, 'Back to map'));
    await sleep(1500);
  },
  'classic rankings': async (d) => {
    await openClassic(d);
    byText(d, 'Rankings')!.click();
    await sleep(1500);
  },
  'classic review': async (d) => {
    await openClassic(d);
    byText(d, 'Review')!.click();
    await sleep(1500);
  }
};

// anything visible that sticks out of the viewport without a scroller to
// reach it, plus page-level scrolling (the screens are meant to fit)
function measure(d: Doc, w: Window) {
  const H = w.innerHeight;
  const W = w.innerWidth;
  const se = d.scrollingElement as HTMLElement;
  const issues: string[] = [];
  const pageScrollY = se.scrollHeight - H;
  const pageScrollX = se.scrollWidth - W;
  if (pageScrollY > 2) issues.push(`page scrolls ${pageScrollY}px down`);
  if (pageScrollX > 2) issues.push(`page scrolls ${pageScrollX}px sideways`);
  const scrolls = (el: Element | null) => {
    for (let a = el?.parentElement; a && a !== d.body; a = a.parentElement) {
      const s = w.getComputedStyle(a);
      if (/(auto|scroll)/.test(s.overflowY + s.overflowX)) return true;
    }
    return false;
  };
  // a panel that has to scroll inside itself didn't get the room it needs
  for (const el of Array.from(d.body.querySelectorAll('*'))) {
    const st = w.getComputedStyle(el);
    if (!/(auto|scroll)/.test(st.overflowY)) continue;
    const h = el as HTMLElement;
    const r = h.getBoundingClientRect();
    if (r.height < 2 || h.scrollHeight <= h.clientHeight + 2 || h === d.scrollingElement) continue;
    if (r.bottom < 0 || r.top > H) continue;
    issues.push(`scrolls inside: ${h.tagName.toLowerCase()}.${String(h.className).split(' ')[0]} ${h.clientHeight}/${h.scrollHeight}px`);
  }
  const seen = new Set<string>();
  for (const el of Array.from(d.body.querySelectorAll('button, canvas, img, input, [role="button"], p, h1, h2, h3'))) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const s = w.getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
    const out = r.bottom > H + 1 || r.right > W + 1 || r.left < -1 || r.top < -1;
    if (!out || scrolls(el)) continue;
    const label = `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 28)}" ${Math.round(r.left)},${Math.round(r.top)}→${Math.round(r.right)},${Math.round(r.bottom)}`;
    if (!seen.has(label)) {
      seen.add(label);
      issues.push(`cropped: ${label}`);
    }
  }
  return issues;
}

const grid = document.getElementById('grid')!;
const statusEl = document.getElementById('status')!;
const select = document.getElementById('scenario') as HTMLSelectElement;
for (const name of Object.keys(SCENARIOS)) select.add(new Option(name, name));
(window as any).__fit = { results: {} as Record<string, any>, running: false };

async function runOne(name: string, [w, h, label]: [number, number, string]) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  const scale = Math.min(1, 300 / w, 360 / h);
  cell.innerHTML = `<h4>${label} ${w}×${h} · <span class="res">…</span></h4>`;
  const frame = document.createElement('div');
  frame.className = 'frame';
  frame.style.width = `${Math.round(w * scale)}px`;
  frame.style.height = `${Math.round(h * scale)}px`;
  const iframe = document.createElement('iframe');
  iframe.width = String(w);
  iframe.height = String(h);
  iframe.style.transform = `scale(${scale})`;
  frame.appendChild(iframe);
  cell.appendChild(frame);
  grid.appendChild(cell);
  const res = cell.querySelector('.res') as HTMLElement;
  try {
    const preview = /\(preview\)$/.test(name)
      ? `&fitpreview=${name.replace(/ \(preview\)$/, '').replace(/ /g, '-')}`
      : '';
    iframe.src = `/grammarbles?fitlab=${Date.now()}${preview}`;
    await new Promise((r) => (iframe.onload = r));
    const d = iframe.contentDocument!;
    const note = await SCENARIOS[name](d);
    await sleep(800);
    const issues = measure(d, iframe.contentWindow!);
    res.textContent = issues.length ? `${issues.length} issue(s)` : 'fits';
    res.className = issues.length ? 'bad' : 'ok';
    res.title = issues.join('\n');
    return { label, w, h, note: note || '', issues };
  } catch (e: any) {
    res.textContent = `error: ${e?.message || e}`;
    res.className = 'bad';
    return { label, w, h, error: String(e?.message || e), issues: [] };
  }
}

async function runAll(name: string, only?: string[]) {
  const fit = (window as any).__fit;
  fit.running = true;
  grid.innerHTML = '';
  const out = [];
  for (const size of SIZES.filter(([, , l]) => !only || only.includes(l))) {
    statusEl.textContent = `${name}: ${size[2]}…`;
    out.push(await runOne(name, size));
  }
  fit.results[name] = out;
  fit.running = false;
  statusEl.textContent = `${name}: done`;
  return out;
}
document.getElementById('run')!.onclick = () => runAll(select.value);
(window as any).__fit.runAll = runAll;
(window as any).__fit.scenarios = Object.keys(SCENARIOS);
