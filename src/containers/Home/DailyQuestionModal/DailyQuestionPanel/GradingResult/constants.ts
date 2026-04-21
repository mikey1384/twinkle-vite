import { keyframes } from '@emotion/css';

export const DEFAULT_XP_NUMBER_COLOR = 'rgba(97, 226, 101, 1)';
export const DEFAULT_REWARD_COLOR = 'rgba(255, 203, 50, 1)';

export const gradeColors: Record<string, string> = {
  Masterpiece: '#FFD700',
  Pass: '#4CAF50',
  Fail: '#f44336'
};

export const gradeLabels: Record<string, string> = {
  Masterpiece: 'Masterpiece',
  Pass: 'Pass',
  Fail: 'Fail'
};

export const masterpieceTypeLabels: Record<string, string> = {
  heart: 'Masterpiece (Heart)',
  mind: 'Masterpiece (Mind)',
  heart_and_mind: 'Masterpiece (Heart & Mind)'
};

export const gradeSymbols: Record<string, string> = {
  Masterpiece: '★',
  Pass: '✓',
  Fail: '✗'
};

export const fireAnimation = keyframes`
  0%, 100% { transform: scale(1) rotate(-3deg); }
  50% { transform: scale(1.1) rotate(3deg); }
`;

export const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;
