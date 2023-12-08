import React from 'react';
import Link from '~/components/Link';
import { Color } from '~/constants/css';
import RewardText from '~/components/Texts/RewardText';
import { css } from '@emotion/css';

export default function NextMission({
  missionName,
  missionType,
  xpReward,
  coinReward,
  rootMissionType
}: {
  missionName: string;
  missionType: string;
  xpReward: number;
  coinReward: number;
  rootMissionType: string;
}) {
  return (
    <div
      style={{
        marginTop: '1.3rem',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Link
        className={css`
          display: block;
          &:hover {
            text-decoration: none;
          }
        `}
        to={`/missions/${
          rootMissionType ? `${rootMissionType}/` : ''
        }${missionType}`}
      >
        <p
          style={{
            fontWeight: 'bold',
            color: Color.green()
          }}
        >
          Your next mission:
        </p>
        <p
          style={{
            textAlign: 'center',
            marginTop: '0.5rem',
            fontSize: '1.6rem',
            fontWeight: 'bold',
            color: Color.logoBlue()
          }}
        >
          {missionName}
        </p>
        <RewardText
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'center'
          }}
          labelClassName={css`
            color: ${Color.darkerGray()};
            font-size: 1.2rem;
          `}
          rewardClassName={css`
            font-size: 1.2rem;
          `}
          xpReward={xpReward}
          coinReward={coinReward}
        />
      </Link>
    </div>
  );
}
