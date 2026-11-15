import React, { useEffect } from 'react';
import AchievementItem from './AchievementItem';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import { css, cx } from '@emotion/css';

// Compact (Live now showing): tighter thumbs; Today's Progress places the row.
const compactRowCls = css`
  display: flex;
  align-items: center;
  --achievement-thumb-gap: 0.15rem;
  --achievement-thumb-size: 3.8rem;
`;

// The badges wrap instead of overflowing a narrow column; in the narrowest
// cards they go 3 + 2 (not 4 + 1). Wide cards keep one row as before.
const badgeRowCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  @container today-card (max-width: 25.9rem) {
    --achievement-thumb-gap: 0.25rem;
  }
  @container today-card (max-width: 22.9rem) {
    max-width: calc(
      3 * (var(--achievement-thumb-size, 4rem) + 0.5rem) + 0.2rem
    );
  }
`;

const shownAchievements = [
  'mission',
  'gold',
  'grammar',
  'donor',
  'chess_legend'
];

export default function AchievementProgress({
  compact,
  myAchievementsObj,
  onSetMyAchievementsObj
}: {
  // Inline, smaller thumbs beside the daily goals while Live now shows.
  compact?: boolean;
  myAchievementsObj: {
    [key: string]: {
      isUnlocked?: boolean;
      milestones?: { name: string; completed: boolean }[];
      progressObj?: {
        label: string;
        currentValue: number;
        targetValue: number;
      };
      phases?: {
        label: string;
        type?: 'bar' | 'check';
        currentValue?: number;
        targetValue?: number;
        completed: boolean;
      }[];
    };
  };
  onSetMyAchievementsObj: (myAchievementsObj: any) => void;
}) {
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetIsAchievementsLoaded = useAppContext(
    (v) => v.user.actions.onSetIsAchievementsLoaded
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const isAchievementsLoaded = useKeyContext(
    (v) => v.myState.isAchievementsLoaded
  );

  useEffect(() => {
    if (userId) init();
    async function init() {
      const maxRetries = 3;
      const cooldown = 1000;
      let attempt = 0;
      let data;

      while (attempt < maxRetries) {
        try {
          data = await loadMyAchievements();
          const unlockedAchievementIds = [];
          for (const key in data) {
            if (data[key].isUnlocked) {
              unlockedAchievementIds.push(data[key].id);
            }
          }
          onSetUserState({
            userId,
            newState: { unlockedAchievementIds }
          });
          onSetIsAchievementsLoaded(true);
          onSetMyAchievementsObj(data);
          break;
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error);
          attempt++;
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, cooldown));
          }
        } finally {
          if (attempt >= maxRetries) {
            console.error('All retry attempts failed.');
            onSetIsAchievementsLoaded(false);
          }
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, myAttempts]);

  // Compact: nothing (not even the divider) when no badge would draw.
  if (
    compact &&
    !shownAchievements.some((key) => achievementsObj?.[key]?.type)
  ) {
    return null;
  }

  return isAchievementsLoaded ? (
    <div
      className={compact ? cx(compactRowCls, 'today-badges') : undefined}
      style={
        compact
          ? undefined
          : { width: '100%', display: 'flex', justifyContent: 'center' }
      }
    >
      <div
        className={badgeRowCls}
        style={{ marginTop: compact ? 0 : '0.5rem' }}
      >
        {shownAchievements.map((key) => {
          const isUnlocked = myAchievementsObj[key]?.isUnlocked;
          const numCompletedMilestones = myAchievementsObj[
            key
          ]?.milestones?.filter((milestone) => milestone.completed).length;
          const numMilestones = myAchievementsObj[key]?.milestones?.length;
          return (
            <AchievementItem
              key={key}
              thumbSize={compact ? '3.8rem' : undefined}
              isUnlocked={isUnlocked}
              achievement={{
                ...achievementsObj[key],
                phases: myAchievementsObj[key]?.phases,
                progressObj: myAchievementsObj[key]?.progressObj || {
                  currentValue: isUnlocked ? 1 : numCompletedMilestones,
                  targetValue: isUnlocked ? 1 : numMilestones
                }
              }}
            />
          );
        })}
      </div>
    </div>
  ) : null;
}
