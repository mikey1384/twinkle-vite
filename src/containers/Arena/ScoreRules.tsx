import React from 'react';
import type { ArenaScoreRules } from './types';

export default function ScoreRules({ rules }: { rules?: ArenaScoreRules }) {
  if (!rules) return null;
  return <span>
    Correct: +{rules.correct}. Wrong: {rules.incorrect}. Blank: {rules.omitted}.
    {' '}This is a practice raw score, not an official scaled score or percentile.
  </span>;
}
