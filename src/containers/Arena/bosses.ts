import { ARENA } from './theme';
import { arenaMediaURL } from './media';

// Each boss is drawn as an early-90s eraser card with its codename (Codex
// imagegen; art notes in work/mock-test-arena-20261024/reference_art).
export const BOSSES: Record<
  string,
  { name: string; nameEn: string; color: string }
> = {
  'suneung-kor': {
    name: '국어 선생님',
    nameEn: 'The Literature Teacher',
    color: '#d9a72b'
  },
  'suneung-math': {
    name: '수학 강사',
    nameEn: 'The Star Math Lecturer',
    color: '#2e9c94'
  },
  'suneung-eng': {
    name: '수능 감독관',
    nameEn: 'The CSAT Proctor',
    color: ARENA.violet
  },
  'suneung-khist': {
    name: '한국사 강사',
    nameEn: 'The History Lecturer',
    color: ARENA.coral
  },
  'khist-cert-advanced': {
    name: '사학 교수',
    nameEn: 'The History Professor',
    color: ARENA.sky
  },
  'khist-cert-basic': {
    name: '사회 선생님',
    nameEn: 'The Social Studies Teacher',
    color: '#5dbb63'
  }
};

// a boss's eraser-card portrait (3:4)
export function bossCardURL(examKey: string) {
  return arenaMediaURL(`img/bosses/${examKey}.jpg`);
}
