import React, { useMemo } from 'react';
import NewStats from './NewStats';
import NewAchievementStatus from './NewAchievementStatus';
import { css } from '@emotion/css';
import { Content, User } from '~/types';
import { levels } from '~/constants/userLevels';
import { statsPerUserTypes } from '~/constants/defaultValues';
import { StatsProp } from './types';

export default function ToPanel({
  achievementsObj,
  unlockedAchievements,
  loading,
  target
}: {
  achievementsObj: Record<string, Record<string, any>>;
  unlockedAchievements: Content[];
  loading: boolean;
  target: User;
}) {
  const newAchievementTypes = useMemo(() => {
    const currentAchievementTypes = unlockedAchievements.map(
      (achievement) => achievement.type
    );

    // Get the achievements for the given user type
    const unlockableAchievementTypes =
      statsPerUserTypes[target.userType]?.achievements || [];

    // Combine current and unlockable achievement types and remove duplicates
    return Array.from(
      new Set([...currentAchievementTypes, ...unlockableAchievementTypes])
    );
  }, [unlockedAchievements, target?.userType]);

  const newStats: StatsProp = useMemo(() => {
    // Calculate total achievement points (AP)
    let totalAP = 0;
    for (const newAchievementType of newAchievementTypes) {
      totalAP += achievementsObj[newAchievementType]?.ap || 0;
    }

    // Determine the user's level based on total AP
    let userLevel = levels[0].level; // Default to the first level
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalAP >= levels[i].ap) {
        userLevel = levels[i].level;
        break;
      }
    }

    // Get the perks for the determined level
    const perks: {
      level: number;
      canEdit: boolean;
      canDelete: boolean;
      canReward: boolean;
      canPinPlaylists: boolean;
      canEditPlaylists: boolean;
      canEditRewardLevel: boolean;
    } = levels.find((level) => level.level === userLevel) || {
      level: 0,
      canEdit: false,
      canDelete: false,
      canReward: false,
      canPinPlaylists: false,
      canEditPlaylists: false,
      canEditRewardLevel: false
    };

    // Create the new stats object
    return {
      ...perks,
      username: target?.username,
      realName: target?.realName,
      title: userLevel > 1 ? statsPerUserTypes[target?.userType]?.title : null
    };
  }, [
    achievementsObj,
    target?.username,
    target?.realName,
    target?.userType,
    newAchievementTypes
  ]);

  return (
    <div
      className={css`
        width: 100%;
      `}
    >
      <div
        className={css`
          margin: 2rem 0rem 1rem 0;
          font-weight: bold;
          font-family: Roboto, sans-serif;
        `}
      >
        To
      </div>
      <div
        className={css`
          width: 100%;
          border-radius: 8px;
          border: 1px solid #ccc;
          padding: 1rem;
          margin-bottom: 1rem;
        `}
      >
        <NewStats newStats={newStats} target={target} />
        <NewAchievementStatus
          newAchievements={
            newAchievementTypes.map(
              (type) => achievementsObj[type]
            ) as Content[]
          }
          loading={loading}
        />
      </div>
    </div>
  );
}
