import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import MissionBadge from './mission.png';
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
        itemName="The Summoner"
        description="Conferred upon those who've unlocked the mysteries of the Card
          Summoner. Your journey has given you access to the magical realms of
          the arcane. Welcome, oh Conjuror of the Arcana."
        requirements={['Unlock the Card Summoner']}
      />
      <ItemPanel
        style={{ marginTop: '1rem' }}
        itemName="Wisdom Weaver"
        description="This accolade is reserved for individuals who've embraced the mantle
          of teaching. Your knowledge and passion inspire those around you. Wear
          this badge as a proud Wisdom Weaver."
        requirements={['Embrace the mantle of teaching']}
      />
      <ItemPanel
        style={{ marginTop: '1rem' }}
        itemName="Pedagogical Pioneer"
        description="This highest honor is bestowed only upon those who have risen to the
          rank of Head Teacher. You are a leader, an innovator, and a beacon of
          knowledge. Stand tall, Pedagogical Pioneer, for you light the path of
          learning for all."
        requirements={['Rise to the rank of Head Teacher']}
      />
    </div>
  );
}
