import React from 'react';
import SmallMission from './Mission';
import SmallSummoner from './Summoner';
import SmallGrammar from './Grammar';
import SmallGold from './Gold';
import SmallMentor from './Mentor';
import SmallTeenager from './Teenager';
import SmallDonor from './Donor';
import SmallAdult from './Adult';
import SmallSage from './Sage';
import SmallMeetup from './Meetup';
import SmallTwinkleFounder from './TwinkleFounder';
import { Content } from '~/types';

export default function Small({
  achievement,
  isThumb,
  thumbSize,
  style
}: {
  achievement: Content;
  isThumb?: boolean;
  thumbSize?: string;
  style?: React.CSSProperties;
}) {
  const achievementComponentMap: {
    [key: string]: React.ComponentType<{
      data: any;
      isThumb?: boolean;
      thumbSize?: string;
      style?: React.CSSProperties;
    }>;
  } = {
    donor: SmallDonor,
    mission: SmallMission,
    summoner: SmallSummoner,
    grammar: SmallGrammar,
    gold: SmallGold,
    teenager: SmallTeenager,
    adult: SmallAdult,
    mentor: SmallMentor,
    meetup: SmallMeetup,
    sage: SmallSage,
    twinkle_founder: SmallTwinkleFounder
  };

  const Component = achievement?.type
    ? achievementComponentMap[achievement.type]
    : undefined;

  if (!Component || !achievement?.type) {
    return null;
  }

  return (
    <div
      style={{
        ...(isThumb
          ? {}
          : {
              padding: '1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              width: '100%'
            }),
        ...style
      }}
    >
      <Component
        key={achievement?.type}
        thumbSize={thumbSize}
        isThumb={isThumb}
        data={achievement}
        style={{ width: '100%' }}
      />
    </div>
  );
}
