import React from 'react';
import SanitizedHTML from 'react-sanitized-html';
import CardThumb from '~/components/CardThumb';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import {
  addCommasToNumber,
  getRenderedTextForVocabQuestions
} from '~/helpers/stringHelpers';
import { formatRewardMultiplier } from './PreviewPrimitives';

export default function DailyGoalsPreview({
  className,
  dailyGoals,
  variant = 'main'
}: {
  className?: string;
  dailyGoals: any;
  variant?: 'main' | 'target';
}) {
  const bonusQuestion = dailyGoals?.bonusQuestion || {};
  const word = dailyGoals?.word || dailyGoals?.card?.word || '';
  const level = Number(dailyGoals?.level || dailyGoals?.card?.level || 0);
  const levelColor = cardLevelHash[level]?.color || 'logoGreen';
  const renderedQuestion = bonusQuestion?.question
    ? getRenderedTextForVocabQuestions(
        bonusQuestion.question,
        word,
        levelColor
      )
    : '';
  const choices = Array.isArray(bonusQuestion?.choices)
    ? bonusQuestion.choices.slice(0, 4)
    : [];
  const rewardMultiplier = getRewardMultiplier(dailyGoals?.dailyTaskReward);
  const rewardMultiplierLabel = formatRewardMultiplier(rewardMultiplier);
  const rewardMultiplierTier = getRewardMultiplierTier(rewardMultiplier);
  const rootClassName = [
    'home-feed-card__daily-goals-preview',
    variant === 'target' ? 'home-feed-card__daily-goals-preview--target' : '',
    dailyGoals?.card ? 'has-media' : '',
    className || ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      {dailyGoals?.card ? (
        <div className="home-feed-card__daily-goals-card">
          <CardThumb card={dailyGoals.card} />
        </div>
      ) : null}
      <div className="home-feed-card__daily-goals-copy">
        <div className="home-feed-card__reward-chips">
          {dailyGoals?.dailyTaskReward ? (
            <span
              aria-label={`Daily goals reward multiplier x${rewardMultiplierLabel}`}
              className={`home-feed-card__reward-chip multiplier multiplier--${rewardMultiplierTier}`}
            >
              <Icon icon="bolt" />
              {`x${rewardMultiplierLabel}`}
            </span>
          ) : null}
          {Number(dailyGoals?.xpEarned || 0) > 0 ? (
            <span className="home-feed-card__reward-chip xp">
              {addCommasToNumber(Number(dailyGoals.xpEarned))} XP
            </span>
          ) : null}
          {Number(dailyGoals?.coinEarned || 0) > 0 ? (
            <span className="home-feed-card__reward-chip coins">
              <Icon icon="coins" />
              {addCommasToNumber(Number(dailyGoals.coinEarned))}
            </span>
          ) : null}
        </div>
        {word ? (
          <h3 style={{ color: Color[levelColor]?.() || Color.logoGreen() }}>
            {word}
          </h3>
        ) : null}
        {renderedQuestion ? (
          <div className="home-feed-card__bonus-question">
            <SanitizedHTML
              allowedAttributes={{ b: ['style'] }}
              html={renderedQuestion}
            />
          </div>
        ) : null}
        {choices.length > 0 ? (
          <div className="home-feed-card__choice-list">
            {choices.map((choice: string, index: number) => (
              <span key={`${choice}-${index}`}>{choice}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getRewardMultiplier(dailyTaskReward: any) {
  const multiplier = Number(dailyTaskReward?.finalMultiplier);
  return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
}

function getRewardMultiplierTier(multiplier: number) {
  if (multiplier >= 50) return 'legendary';
  if (multiplier >= 25) return 'epic';
  if (multiplier >= 10) return 'major';
  if (multiplier >= 5) return 'strong';
  if (multiplier >= 2) return 'active';
  return 'base';
}
