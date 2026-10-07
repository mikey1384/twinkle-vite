// Quest jukebox: listen to every track through the game's own music player.
import { loadManifest, playMusic, stopMusic, musicPosition, WORLD_TRACKS, BOSS_TRACKS, OVERWORLD_TRACK } from '../music';

const NAMES: Record<string, string> = {
  overworld: 'Overworld (map)',
  'boss-fort': 'Fort sub-boss',
  'boss-castle': 'Castle boss',
  'boss-final': 'Final boss (Sovereign of Syntax)'
};
const list = document.getElementById('list')!;
const fill = document.getElementById('fill') as HTMLDivElement;
const mark = document.getElementById('mark') as HTMLDivElement;
const time = document.getElementById('time')!;
const nowName = document.getElementById('nowName')!;
let playing: string | null = null;

const tracks = await loadManifest();
for (const id of [OVERWORLD_TRACK, ...WORLD_TRACKS, ...BOSS_TRACKS]) {
  const meta = tracks[id];
  const row = document.createElement('div');
  row.className = `row${meta ? '' : ' missing'}`;
  row.dataset.id = id;
  const world = WORLD_TRACKS.indexOf(id);
  row.innerHTML = `<div class="name"><b>${world >= 0 ? `World ${world + 1} · ` : ''}${meta?.title || NAMES[id] || id}</b><span class="meta">${meta ? `${meta.bpm} bpm · intro ${meta.loopStart.toFixed(1)} s + loop ${(meta.loopEnd - meta.loopStart).toFixed(1)} s` : 'not composed yet'}</span></div>`;
  if (meta) {
    const play = document.createElement('button');
    play.textContent = '▶ Play';
    play.onclick = () => start(id, 0);
    const seam = document.createElement('button');
    seam.textContent = 'Seam';
    seam.onclick = () => start(id, Math.max(0, meta.loopEnd - 6));
    row.append(play, seam);
  }
  list.append(row);
}
document.getElementById('stop')!.onclick = () => {
  stopMusic(0.3);
  playing = null;
  nowName.textContent = 'Nothing playing';
  mark.style.display = 'none';
};

function start(id: string, offset: number) {
  playing = id;
  playMusic(id, { fade: 0.15, offset });
  const meta = tracks[id];
  nowName.textContent = meta?.title || NAMES[id] || id;
  mark.style.display = 'block';
  mark.style.left = `${(meta.loopStart / meta.loopEnd) * 100}%`;
  document.querySelectorAll('.row').forEach((r) => r.classList.toggle('on', (r as HTMLElement).dataset.id === id));
}

function tick() {
  const pos = musicPosition();
  if (pos && playing) {
    const meta = tracks[pos.id];
    fill.style.width = `${(pos.at / meta.loopEnd) * 100}%`;
    time.textContent = `${pos.at.toFixed(1)} / ${meta.loopEnd.toFixed(1)} s`;
  }
  requestAnimationFrame(tick);
}
tick();
