import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import MissionBadge from './mission.png';
import SummonerBadge from './summoner.png';
import MentorBadge from './mentor.png';
import SageBadge from './sage.png';
import FounderBadge from './founder.png';
import ItemPanel from './ItemPanel';

export default function Achievements() {
  return (
    <div style={{ paddingBottom: '15rem' }}>
      <div
        className={css`
          margin-bottom: 2rem;
          background: #fff;
          padding: 1rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-top: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        <p
          className={css`
            font-size: 2rem;
            font-weight: bold;
            line-height: 1.5;
          `}
          style={{ fontWeight: 'bold', fontSize: '2.5rem' }}
        >
          Achievements
        </p>
      </div>
      <ItemPanel
        itemName="Mission Mastermind"
        description="Awarded to those who've shown exceptional determination and skill by
          completing all missions. Your dedication and persistence have truly
          made you a mastermind"
        requirements={['Complete all missions']}
        badgeSrc={MissionBadge}
      />
      <ItemPanel
        style={{ marginTop: '1rem' }}
        itemName="The Cybernetic Summoner"
        description="Bestowed upon the select few who have unraveled the enigmas of the AI Card Conjuring. Your odyssey into the realms of AI wizardry has not only earned you this esteemed recognition but also transformed you into a revered Summoner of the Cybernetic Realm. Step forth, intrepid explorer of digital dimensions, your journey has just begun."
        requirements={['Unlock the AI Card Summoner License']}
        badgeSrc={SummonerBadge}
      />
      <ItemPanel
        style={{ marginTop: '1rem' }}
        itemName="Starlight Mentor"
        description="This honor is bestowed upon the exceptional individuals at Twinkle Academy who have taken up the noble task of guiding young minds towards knowledge. As a Starlight Mentor, your passion and wisdom illuminate the path of learning, inspiring those around you. Wear this badge with pride, for you are a beacon in the vast expanse of education."
        requirements={['Take a full-time teaching position at Twinkle Academy']}
        badgeSrc={MentorBadge}
      />
      <ItemPanel
        style={{ marginTop: '1rem' }}
        itemName="The Sage of Twinkle"
        description="This highest honor is bestowed only upon those who have risen to the
    rank of Head Teacher or above at Twinkle Academy. As a Sage of Twinkle, you are a leader, an innovator, and a beacon of
    knowledge. Stand tall, for you light the path of
    learning for all."
        requirements={['Rise to the rank of Head Teacher']}
        badgeSrc={SageBadge}
      />
      <ItemPanel
        style={{ marginTop: '1rem' }}
        itemName="The Entrepreneur"
        description="This badge is a testament to the daring innovators who have taken the leap to start their own business. As an Entrepreneur, you've done more than just create a company - you've realized a dream, transformed a vision into reality, and carved your own path in the business world. This badge celebrates your bold journey of entrepreneurship, symbolizing your resilience, your inventive spirit, and your steadfast dedication to bringing your unique business idea to life."
        requirements={['Found a new business']}
        badgeSrc={FounderBadge}
      />
    </div>
  );
}
