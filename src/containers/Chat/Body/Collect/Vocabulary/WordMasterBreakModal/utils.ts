import { RouletteSegment } from '~/components/Roulette';
import { Color } from '~/constants/css';
import { BreakGuideRowData } from './types';

export const BREAK_GUIDE_ROWS: BreakGuideRowData[] = [
  {
    breakNum: 1,
    label: 'Break 1',
    title: 'Daily Tasks',
    description: 'Finish Wordle, Grammarbles, and AI Story.',
    tone: 'logoBlue'
  },
  {
    breakNum: 2,
    label: 'Break 2',
    title: 'Daily Reflection',
    description: "Complete today's reflection.",
    tone: 'brownOrange'
  },
  {
    breakNum: 3,
    label: 'Break 3',
    title: 'Chess Puzzle',
    description: 'Solve a chess puzzle (your current highest level).',
    tone: 'darkOceanBlue'
  },
  {
    breakNum: 4,
    label: 'Break 4',
    title: 'Omok Moves',
    description:
      'Reply to pending omok moves and send a first move to a user active within 7 days.',
    tone: 'orange'
  },
  {
    breakNum: 5,
    label: 'Break 5',
    title: 'Grammarbles Full Run',
    description:
      'Clear all 5 Grammarbles levels today. Failing locks Word Master for the day.',
    tone: 'gold'
  },
  {
    breakNum: 6,
    label: 'Break 6+',
    title: 'Timed Vocab Quiz',
    description:
      'Quiz length grows from 1 to 5 questions (30s per question). Wrong answer locks Word Master for the day.',
    tone: 'rose'
  }
];

export const BREAK_PASS_ROULETTE_SEGMENTS: RouletteSegment[] = [
  {
    key: 'full',
    label: '1M',
    weight: 70,
    gradient: ['#4A4A4A', '#2D2D2D'] as const
  },
  {
    key: 'discount',
    label: '100K',
    weight: 25,
    gradient: ['#32CD32', '#228B22'] as const
  },
  {
    key: 'free',
    label: 'FREE',
    weight: 5,
    gradient: ['#FFD700', '#FFA500'] as const
  }
];

export function formatCoins(amount: number) {
  if (!amount) return '0';
  return amount.toLocaleString('en-US');
}

export function getBreakAccent(breakType?: string) {
  const tone = getBreakTone(breakType);
  return {
    main: getToneColor(tone),
    soft: getToneColor(tone, 0.12)
  };
}

export function getBreakTone(breakType?: string) {
  switch (breakType) {
    case 'daily_tasks':
      return 'logoBlue';
    case 'daily_reflection':
      return 'brownOrange';
    case 'chess_puzzle':
      return 'darkOceanBlue';
    case 'pending_moves':
      return 'orange';
    case 'grammarbles':
      return 'gold';
    case 'vocab_quiz':
      return 'rose';
    default:
      return 'logoBlue';
  }
}

export function getToneColor(tone?: string, opacity = 1) {
  if (tone && typeof Color[tone] === 'function') {
    return Color[tone](opacity);
  }
  return Color.logoBlue(opacity);
}
