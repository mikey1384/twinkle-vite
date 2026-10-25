import { ARENA } from './theme';
import { arenaMediaURL } from './media';

// Each boss is drawn as an early-90s eraser card with its codename (Codex
// imagegen; art notes in work/mock-test-arena-20261024/reference_art).
export const BOSSES: Record<
  string,
  { name: string; nameEn: string; color: string }
> = {
  'c1-advanced': {
    name: '영문학 시험관',
    nameEn: 'The Advanced English Examiner',
    color: '#467c77'
  },
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
  },
  'suneung28-intsoc': {
    name: '사탐 강사',
    nameEn: 'The Social Studies Star Lecturer',
    color: '#e07b28'
  },
  'suneung28-intsci': {
    name: '과탐 강사',
    nameEn: 'The Science Star Lecturer',
    color: '#c2408a'
  },
  'naesin-h1-kor': {
    name: '담임 선생님',
    nameEn: 'The Homeroom Teacher',
    color: '#a63a2e'
  },
  'naesin-h1-math': {
    name: '수학 선생님',
    nameEn: 'The Math Teacher',
    color: '#2b4c8c'
  },
  'naesin-h1-eng': {
    name: '영어 선생님',
    nameEn: 'The English Teacher',
    color: '#e88fb4'
  },
  'naesin-h1-intsoc': {
    name: '지리 선생님',
    nameEn: 'The Geography Teacher',
    color: '#8e9a2e'
  },
  'naesin-h1-intsci': {
    name: '생물 선생님',
    nameEn: 'The Biology Teacher',
    color: '#a8d13a'
  },
  'hanja-kta-6': {
    name: '훈장님',
    nameEn: 'The Village Schoolmaster',
    color: '#5c6b7a'
  },
  'kmc-prelim-m1': {
    name: '경시 코치',
    nameEn: 'The Olympiad Coach',
    color: '#d7263d'
  },
  'lt-eng-e6': {
    name: '어학원 원장',
    nameEn: 'The Academy Director',
    color: '#39b5c9'
  },
  'lt-math-e6': {
    name: '레테 선생님',
    nameEn: 'The Placement Test Teacher',
    color: '#b07a4a'
  },
  'tosel-ba': {
    name: '듣기 평가관',
    nameEn: 'The Listening Examiner',
    color: '#e3cf3a'
  },
  'a2-key-schools': {
    name: '어학 시험관',
    nameEn: 'The Language Examiner',
    color: '#7fcfb0'
  },
  'toefl-junior': {
    name: '단어 교관',
    nameEn: 'The Vocabulary Drill Sergeant',
    color: '#c8c8c8'
  },
  'ielts-academic': {
    name: '면접 시험관',
    nameEn: 'The Speaking Examiner',
    color: '#2f5fd0'
  },
  'sat-rw': {
    name: '입시 컨설턴트',
    nameEn: 'The Admissions Counselor',
    color: '#6e1f2a'
  },
  'sat-math': {
    name: '수학 튜터',
    nameEn: 'The Math Tutor',
    color: '#b58ad6'
  },
  'gmat-quant': {
    name: '경영대 교수',
    nameEn: 'The Business Professor',
    color: '#e0cda0'
  },
  'gmat-verbal': {
    name: '논리 교수',
    nameEn: 'The Logic Professor',
    color: '#7a2e5a'
  },
  'lsat': {
    name: '법대 교수',
    nameEn: 'The Law Professor',
    color: '#1f7a4d'
  }
};

// a boss's eraser-card portrait (3:4)
export function bossCardURL(examKey: string) {
  return arenaMediaURL(`img/bosses/${examKey}.jpg`);
}
