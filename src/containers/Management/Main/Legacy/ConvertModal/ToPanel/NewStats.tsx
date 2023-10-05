import React, { useMemo } from 'react';
import Table from '../../../../Table';
import Check from '../../../../Check';
import { Color } from '~/constants/css';
import { levels } from '~/constants/userLevels';
import { User } from '~/types';

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

const achievementAP: Record<string, number> = {
  mentor: 800,
  sage: 500,
  twinkle_founder: 1500,
  teenager: 100,
  adult: 100
};

export default function NewStats({ target }: { target: User }) {
  const newStats = useMemo(() => {
    let totalAP = 0;

    // Get the achievements for the given user type
    const achievements =
      newStatsPerUserTypes[target.userType]?.achievements || [];

    // Calculate total achievement points (AP)
    for (const achievement of achievements) {
      totalAP += achievementAP[achievement];
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
    const perks = levels[userLevel];

    // Create the new stats object
    return {
      ...perks,
      username: target.username,
      realName: target.realName,
      title: newStatsPerUserTypes[target.userType]?.title
    };
  }, [target]);

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
