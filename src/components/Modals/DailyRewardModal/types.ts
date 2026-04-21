export interface DailyRewardModalProps {
  onHide: () => void;
  onSetHasBonus: (hasBonus: boolean) => void;
  onSetIsDailyRewardChecked: (isChecked: boolean) => void;
  onCountdownComplete: () => void;
  openBonus?: boolean;
  onSetDailyBonusAttempted?: () => void;
}

export interface BonusQuestion {
  id: number;
  question: string;
  word: string;
  wordLevel: number;
  choices: string[];
  answerIndex: number;
}
