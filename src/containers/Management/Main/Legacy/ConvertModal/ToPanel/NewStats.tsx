import React, { useMemo } from 'react';
import Table from '../../../../Table';
import Check from '../../../../Check';
import { Color } from '~/constants/css';
import { levels } from '~/constants/userLevels';
import { Content, User } from '~/types';

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

export default function NewStats({
  achievementAP,
  achievements,
  target
}: {
  achievementAP: Record<string, number>;
  achievements: Content[];
  target: User;
}) {
  const newStats: {
    username: string;
    realName: string;
    title: string | null;
    level: number;
    canEdit: boolean;
    canDelete: boolean;
    canReward: boolean;
    canPinPlaylists: boolean;
    canEditPlaylists: boolean;
    canEditRewardLevel: boolean;
  } = useMemo(() => {
    const currentAchievementTypes = achievements.map(
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
      totalAP += achievementAP[uniqueAchievementType] || 0;
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
      username: target.username,
      realName: target.realName,
      title: newStatsPerUserTypes[target.userType]?.title
    };
  }, [achievements, target?.realName, target?.userType, target?.username]);

  return (
    <Table columns="minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr) minmax(min-content, 1fr)">
      <thead>
        <tr>
          <th>User</th>
          <th>Title</th>
          <th>Level</th>
          <th>Edit</th>
          <th>Delete</th>
          <th>Reward</th>
          <th>Feature Contents</th>
          <th>Edit Playlists</th>
          <th>Edit Reward Level</th>
        </tr>
      </thead>
      <tbody>
        <tr key={target.id}>
          <td>
            <span style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
              {newStats.username}
            </span>
            <small
              style={{
                color: Color.lightGray(),
                marginLeft: '0.7rem',
                fontSize: '1rem'
              }}
            >
              ({newStats.realName})
            </small>
          </td>
          <td>{newStats.title}</td>
          <td style={{ textAlign: 'center' }}>{newStats.level}</td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canEdit} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canDelete} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canReward} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canPinPlaylists} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canEditPlaylists} />
          </td>
          <td style={{ textAlign: 'center' }}>
            <Check checked={!!newStats.canEditRewardLevel} />
          </td>
        </tr>
      </tbody>
    </Table>
  );
}
