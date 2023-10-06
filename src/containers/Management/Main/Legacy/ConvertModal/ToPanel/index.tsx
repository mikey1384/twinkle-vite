import React, { useMemo } from 'react';
import NewStats from './NewStats';
import NewAchievementStatus from './NewAchievementStatus';
import { css } from '@emotion/css';
import { Content, User } from '~/types';
import { levels } from '~/constants/userLevels';
import { StatsProp } from './types';

const newStatsPerUserTypes: {
  [role: string]: {
    title: string | null;
    achievements: string[];
  };
} = {
  moderator: {
    title: 'moderator',
    achievements: ['teenager']
  },
  programmer: {
    title: 'programmer',
    achievements: ['teenager']
  },
  ['senior programmer']: {
    title: null,
    achievements: ['teenager', 'adult']
  },
  ["mikey's friend"]: {
    title: null,
    achievements: ['teenager', 'adult']
  },
  teacher: {
    title: 'teacher',
    achievements: ['teenager', 'adult', 'mentor']
  },
  headteacher: {
    title: 'headteacher',
    achievements: ['teenager', 'adult', 'mentor', 'sage']
  },
  headmaster: {
    title: 'headmaster',
    achievements: ['teenager', 'adult', 'mentor', 'sage', 'twinkle_founder']
  }
};

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
  const newStats: StatsProp = useMemo(() => {
    const currentAchievementTypes = unlockedAchievements.map(
      (achievement) => achievement.type
    );

    // Get the achievements for the given user type
    const unlockableAchievementTypes =
      newStatsPerUserTypes[target.userType]?.achievements || [];

    // Combine current and unlockable achievement types and remove duplicates
    const uniqueAchievementTypes = Array.from(
      new Set([...currentAchievementTypes, ...unlockableAchievementTypes])
    );

    // Calculate total achievement points (AP)
    let totalAP = 0;
    for (const uniqueAchievementType of uniqueAchievementTypes) {
      totalAP += achievementsObj[uniqueAchievementType]?.ap || 0;
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
      title: newStatsPerUserTypes[target?.userType]?.title
    };
  }, [
    unlockedAchievements,
    target?.userType,
    target?.username,
    target?.realName,
    achievementsObj
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
          unlockedAchievements={unlockedAchievements}
          loading={loading}
        />
      </div>
    </div>
  );
}
