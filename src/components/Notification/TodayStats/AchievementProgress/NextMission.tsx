import React from 'react';
import Link from '~/components/Link';
import { Color } from '~/constants/css';
import RewardText from '~/components/Texts/RewardText';
import { useNotiContext } from '~/contexts';
import { css } from '@emotion/css';

export default function NextMission({
  style
}: {
  style?: React.CSSProperties;
}) {
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const rootMissionType = todayStats.nextMission?.rootMissionType;
  const missionName = todayStats.nextMission?.title;
  const missionType = todayStats.nextMission?.missionType;
  const xpReward = todayStats.nextMission?.xpReward;
  const coinReward = todayStats.nextMission?.coinReward;

  return todayStats.nextMission ? (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        ...style
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
  ) : null;
}
