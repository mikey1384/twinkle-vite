import React from 'react';
import SanitizedHTML from 'react-sanitized-html';
import CardThumb from '~/components/CardThumb';
import Icon from '~/components/Icon';
import RewardChips, { rewardChipClass } from '~/components/RewardChips';
import { Color } from '~/constants/css';
import { cardLevelHash } from '~/constants/defaultValues';
import { getRenderedTextForVocabQuestions } from '~/helpers/stringHelpers';
import {
  formatRewardMultiplier,
  getDailyTaskRewardMultiplier,
  getDailyTaskRewardMultiplierTier
} from '~/helpers/dailyTaskRewardDisplay';

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
  const rewardMultiplier = getDailyTaskRewardMultiplier(
    dailyGoals?.dailyTaskReward
  );
  const rewardMultiplierLabel = formatRewardMultiplier(rewardMultiplier);
  const rewardMultiplierTier =
    getDailyTaskRewardMultiplierTier(rewardMultiplier);
  const rootClassName = [
    'home-feed-card__daily-goals-preview',
    variant === 'target' ? 'home-feed-card__daily-goals-preview--target' : '',
    dailyGoals?.card ? 'has-media' : '',
    className || ''
  ]
    .filter(Boolean)
    .join(' ');
  const cardThumbStyle: React.CSSProperties = {
    aspectRatio: '5 / 7',
    height: 'var(--home-feed-daily-goals-thumb-height)',
    maxHeight: '100%',
    width: 'var(--home-feed-daily-goals-thumb-width)'
  };

  return (
    <div className={rootClassName}>
      {dailyGoals?.card ? (
        <div className="home-feed-card__daily-goals-card">
          <CardThumb card={dailyGoals.card} style={cardThumbStyle} />
        </div>
      ) : null}
      <div className="home-feed-card__daily-goals-copy">
        <div className="home-feed-card__reward-chips">
          {dailyGoals?.dailyTaskReward ? (
            <span
              aria-label={`Daily goals reward multiplier x${rewardMultiplierLabel}`}
              className={`${rewardChipClass} home-feed-card__reward-chip multiplier multiplier--${rewardMultiplierTier}`}
            >
              <Icon icon="bolt" />
              {`x${rewardMultiplierLabel}`}
            </span>
          ) : null}
          <RewardChips
            xp={Number(dailyGoals?.xpEarned)}
            coins={Number(dailyGoals?.coinEarned)}
            className="home-feed-card__reward-chip"
          />
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
