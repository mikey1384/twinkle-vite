import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import {
  buildAIStoryRow,
  formatMultiplier,
  getBoostStreakMultiplier
} from '~/components/DailyRewardBoostStrip';
import { useNotiContext } from '~/contexts';
import { ARENA } from '../../theme';

// Arena's own Basic / Excellence board (Mikey 10-24: AI Story moved into
// Arena and takes its look, as Grammarbles got its own board). The targets
// come from the site strip's row builder, so the two never disagree.
export default function ArenaGoals({
  dailyTask,
  loading,
  streak
}: {
  dailyTask: any;
  loading: boolean;
  streak: number;
}) {
  const rewardViewed = useNotiContext(
    (v) => !!v.state.todayStats?.dailyRewardResultViewed
  );
  const row = buildAIStoryRow(dailyTask, loading);
  const multiplier = getBoostStreakMultiplier(streak);
  const streakDays = Math.max(0, Math.floor(Number(streak) || 0));
  const goals = [
    {
      key: 'basic',
      icon: 'check',
      name: 'Basic',
      met: row.basicAchieved,
      text: row.title
    },
    {
      key: 'excellence',
      icon: 'star',
      name: 'Excellence',
      met: row.excellenceAchieved,
      // the strip's line names the goal; here the row already does
      text: row.description
        .replace(/^Excellence target:\s*/, '')
        .replace(/^./, (c) => c.toUpperCase())
    }
  ];
  return (
    <section className={boardCls}>
      <header className={headCls}>
        <span>Today&apos;s goals</span>
        <span className={streakCls}>
          {streakDays}-day streak · ×{formatMultiplier(multiplier)}
        </span>
      </header>
      {goals.map((goal) => (
        <div key={goal.key} className={cx(goalCls, goal.met && goalMetCls)}>
          <span className={cx(dotCls, goal.met && dotMetCls)}>
            <Icon icon={goal.icon} />
          </span>
          <div>
            <b>{goal.name}</b>
            <p>
              {row.isLoading ? (
                <>
                  <Icon icon="spinner" pulse /> Loading today&apos;s target
                </>
              ) : (
                goal.text
              )}
            </p>
          </div>
        </div>
      ))}
      <p className={footCls}>
        Each goal pays ×{formatMultiplier(multiplier)}, up to ×
        {formatMultiplier(multiplier * multiplier)} in total{' '}
        {rewardViewed ? 'tomorrow' : 'today'}.
      </p>
    </section>
  );
}

const boardCls = css`
  width: 100%;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  overflow: hidden;
`;

const headCls = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  background: ${ARENA.train};
  border-bottom: 3px solid ${ARENA.line};
  color: #fff;
  font-size: 1.6rem;
  font-weight: 900;
  text-shadow: 1px 1px 0 ${ARENA.line};
`;

const streakCls = css`
  padding: 0.2rem 0.7rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  font-size: 1.15rem;
  text-shadow: none;
  white-space: nowrap;
`;

const goalCls = css`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem 1.2rem;
  border-bottom: 2px dashed ${ARENA.inkSoft};
  b {
    font-size: 1.5rem;
    font-weight: 900;
  }
  p {
    margin: 0.2rem 0 0;
    font-size: 1.3rem;
    line-height: 1.4;
    color: ${ARENA.inkSoft};
  }
`;

const goalMetCls = css`
  background: #eaf6ee;
`;

const dotCls = css`
  flex: none;
  width: 2.8rem;
  height: 2.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${ARENA.line};
  border-radius: 50%;
  background: #fff;
  color: ${ARENA.inkSoft};
  font-size: 1.2rem;
`;

const dotMetCls = css`
  background: ${ARENA.train};
  color: #fff;
`;

const footCls = css`
  margin: 0;
  padding: 0.8rem 1.2rem 1rem;
  font-size: 1.15rem;
  line-height: 1.4;
  color: ${ARENA.inkSoft};
`;
