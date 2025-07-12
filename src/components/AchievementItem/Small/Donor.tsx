import React, { useMemo } from 'react';
import DonorBadge from '~/assets/donor.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function Donor({
  isThumb,
  thumbSize,
  data: { title, isUnlocked, progressObj, milestones },
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
    unlockMessage: string;
    milestones?: { name: string; completed: boolean }[];
    progressObj?: { label: string; currentValue: number; targetValue: number };
  };
  style?: React.CSSProperties;
}) {
  const progressPercentage = useMemo(() => {
    if (!progressObj || isUnlocked) return 0;
    const { currentValue, targetValue } = progressObj;
    return Math.min(Math.ceil(100 * (currentValue / targetValue)), 100);
  }, [progressObj, isUnlocked]);

  const progressText = useMemo(() => {
    if (!progressObj || isUnlocked) return null;
    const { currentValue, targetValue } = progressObj;
    const formattedCurrent = addCommasToNumber(currentValue);
    const formattedTarget = addCommasToNumber(targetValue);
    return `${formattedCurrent}/${formattedTarget}`;
  }, [progressObj, isUnlocked]);

  const milestonesCompleted = useMemo(() => {
    if (!milestones) return 0;
    return milestones.filter(m => m.completed).length;
  }, [milestones]);

  const showMilestones = milestones && milestones.length > 0;

  if (isThumb) {
    return (
      <ErrorBoundary componentPath="AchievementItems/Small/Donor">
        <div style={{ position: 'relative', ...style }}>
          <ItemThumbPanel
            isThumb={isThumb}
            thumbSize={thumbSize}
            itemName={title}
            badgeSrc={DonorBadge}
          />
          {progressObj && !isUnlocked && (
            <div
              className={css`
                position: absolute;
                bottom: -4px;
                left: 0;
                right: 0;
                height: 4px;
                background: ${Color.borderGray()};
                border-radius: 2px;
                overflow: hidden;
              `}
            >
              <div
                className={css`
                  height: 100%;
                  background: linear-gradient(90deg, ${Color.gold()} 0%, ${Color.orange()} 100%);
                  transition: width 0.3s ease;
                  border-radius: 2px;
                `}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary componentPath="AchievementItems/Small/Donor">
      <div style={style}>
        <ItemThumbPanel
          isThumb={isThumb}
          thumbSize={thumbSize}
          itemName={title}
          badgeSrc={DonorBadge}
        />
        {showMilestones && !isUnlocked && (
          <div
            className={css`
              margin-top: 0.5rem;
              font-size: 1.1rem;
              color: ${Color.darkGray()};
              text-align: center;
            `}
          >
            <div
              className={css`
                margin-bottom: 0.3rem;
                font-weight: bold;
                color: ${Color.black()};
              `}
            >
              Requirements: {milestonesCompleted}/{milestones.length}
            </div>
            <div
              className={css`
                width: 100%;
                height: 6px;
                background: ${Color.borderGray()};
                border-radius: 3px;
                overflow: hidden;
              `}
            >
              <div
                className={css`
                  height: 100%;
                  background: linear-gradient(90deg, ${Color.gold()} 0%, ${Color.orange()} 100%);
                  transition: width 0.3s ease;
                  border-radius: 3px;
                `}
                style={{ width: `${(milestonesCompleted / milestones.length) * 100}%` }}
              />
            </div>
            <div
              className={css`
                margin-top: 0.2rem;
                font-size: 1rem;
                color: ${Color.gray()};
              `}
            >
              {Math.round((milestonesCompleted / milestones.length) * 100)}% Complete
            </div>
          </div>
        )}
        {!showMilestones && progressObj && !isUnlocked && (
          <div
            className={css`
              margin-top: 0.5rem;
              font-size: 1.1rem;
              color: ${Color.darkGray()};
              text-align: center;
            `}
          >
            <div
              className={css`
                margin-bottom: 0.3rem;
                font-weight: bold;
                color: ${Color.black()};
              `}
            >
              {progressObj.label}: {progressText}
            </div>
            <div
              className={css`
                width: 100%;
                height: 6px;
                background: ${Color.borderGray()};
                border-radius: 3px;
                overflow: hidden;
              `}
            >
              <div
                className={css`
                  height: 100%;
                  background: linear-gradient(90deg, ${Color.gold()} 0%, ${Color.orange()} 100%);
                  transition: width 0.3s ease;
                  border-radius: 3px;
                `}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div
              className={css`
                margin-top: 0.2rem;
                font-size: 1rem;
                color: ${Color.gray()};
              `}
            >
              {progressPercentage}% Complete
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
