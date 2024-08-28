import React, { useMemo, useState } from 'react';
import AwardUserAchievementModal from '../../Modals/AwardUserAchievementModal';

import AdultBadge from '~/assets/adult.png';
import FounderBadge from '~/assets/founder.png';
import GoldBadge from '~/assets/gold.png';
import MissionBadge from '~/assets/mission.png';
import TeenagerBadge from '~/assets/teenager.png';
import MeetupBadge from '~/assets/meetup.png';
import SummonerBadge from '~/assets/summoner.png';
import GrammarBadge from '~/assets/grammar.png';
import MentorBadge from '~/assets/mentor.png';
import SageBadge from '~/assets/sage.png';

type AchievementType =
  | 'adult'
  | 'twinkle_founder'
  | 'gold'
  | 'mission'
  | 'teenager'
  | 'meetup'
  | 'summoner'
  | 'grammar'
  | 'mentor'
  | 'sage';

interface AchievementListItemProps {
  achievement: {
    id: string | number;
    type: string;
    description: string;
    orderNumber: number;
  };
}

export default function AchievementListItem({
  achievement
}: AchievementListItemProps) {
  const [addUsersModalShown, setAddUsersModalShown] = useState(false);

  const achievementBadges = useMemo<Record<AchievementType, string>>(
    () => ({
      adult: AdultBadge,
      twinkle_founder: FounderBadge,
      gold: GoldBadge,
      mission: MissionBadge,
      teenager: TeenagerBadge,
      meetup: MeetupBadge,
      summoner: SummonerBadge,
      grammar: GrammarBadge,
      mentor: MentorBadge,
      sage: SageBadge
    }),
    []
  );

  const badgeUrl = useMemo(() => {
    const lowerCaseType = achievement.type.toLowerCase() as AchievementType;
    return achievementBadges[lowerCaseType] || '';
  }, [achievement.type, achievementBadges]);

  const handleAddUsers = () => {
    setAddUsersModalShown(true);
  };

  const handleSubmitUsers = (users: string[]) => {
    // Implement the logic for adding users here
    console.log(`Adding users to achievement ${achievement.type}:`, users);
    // You would typically call an API or dispatch an action here
  };

  return (
    <>
      <tr>
        <td
          style={{
            padding: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <img
            style={{
              width: '3.5rem',
              height: '3.5rem',
              objectFit: 'contain'
            }}
            src={badgeUrl}
            alt={`${achievement.type} badge`}
          />
        </td>
        <td>{achievement.type}</td>
        <td>{achievement.description}</td>
        <td style={{ display: 'flex', justifyContent: 'center' }}>
          <a onClick={handleAddUsers}>Add Users</a>
        </td>
      </tr>
      {addUsersModalShown && (
        <AwardUserAchievementModal
          achievementType={achievement.type}
          onHide={() => setAddUsersModalShown(false)}
          onSubmit={handleSubmitUsers}
        />
      )}
    </>
  );
}
