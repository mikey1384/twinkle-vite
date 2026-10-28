import { canvas, type Sprite } from '../pixel';
import { bossFor, type BossInfo } from './catalog';
import { bossDef, registerBoss } from './registry';
import './bosses/chalk-specter';

// A rival skin of the existing ghost, with its complete moveset, poses,
// particles and arena. Never fork its animation or attack implementation.
const specter = bossDef('chalk-specter')!;
const palette = new Map(Object.entries({
  f2f2ea: 'd6bdff',
  b8c4d0: '9476bd',
  ffffff: 'fff4ff',
  d8dee6: 'b99ddf',
  '3d6a52': 'd6a349',
  '28493a': '946021',
  '5f9a7a': 'ffe18a',
  '7fd8ff': 'ffdc68'
}).map(([from, to]) => [parseInt(from, 16), parseInt(to, 16)]));
const skins = new WeakMap<Sprite, Sprite>();

function rivalSkin(sprite: Sprite) {
  const cached = skins.get(sprite);
  if (cached) return cached;
  const skin = canvas(sprite.width, sprite.height);
  const g = skin.getContext('2d')!;
  g.drawImage(sprite, 0, 0);
  const pixels = g.getImageData(0, 0, skin.width, skin.height);
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const color = palette.get((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    if (color == null) continue;
    data[i] = color >> 16;
    data[i + 1] = (color >> 8) & 255;
    data[i + 2] = color & 255;
  }
  g.putImageData(pixels, 0, 0);
  skins.set(sprite, skin);
  return skin;
}

registerBoss({
  ...specter,
  id: 'nemesis-specter',
  pose(t, state, frames) {
    const pose = specter.pose(t, state, frames);
    return { ...pose, frame: rivalSkin(pose.frame) };
  }
});

export const NEMESIS_BOSS: BossInfo = {
  ...bossFor(9, 'fort', 2),
  id: 'nemesis-specter',
  name: 'The Nemesis'
};
