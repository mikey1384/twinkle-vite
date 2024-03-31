import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import localize from '~/constants/localize';
import { borderRadius, Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { Content, User } from '~/types';

const taskCompleteLabel = localize('taskComplete');
const missionAccomplishedLabel = localize('missionAccomplished');

export default function MissionPass({
  linkColor,
  mission,
  uploader,
  xpNumberColor,
  style
}: {
  linkColor: string;
  mission: Content;
  uploader: User;
  xpNumberColor: string;
  style?: React.CSSProperties;
}) {
  const rewardDetails = useMemo(() => {
    return mission.xpReward || mission.coinReward ? (
      <div
        className={css`
          margin-top: 1rem;
          color: ${Color.black()};
        `}
      >
        {SELECTED_LANGUAGE === 'kr' ? renderKorean() : renderEnglish()}
      </div>
    ) : null;

    function renderEnglish() {
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} /> was
          rewarded{' '}
          {mission.xpReward ? (
            <>
              <span
                className={css`
                  color: ${Color[xpNumberColor]()};
                  font-weight: bold;
                `}
              >
                {addCommasToNumber(mission.xpReward)}{' '}
              </span>
              <span
                className={css`
                  color: ${Color.gold()};
                  font-weight: bold;
                `}
              >
                XP
              </span>
            </>
          ) : null}
          {mission.xpReward && mission.coinReward ? ' and ' : null}
          {mission.coinReward ? (
            <>
              <Icon
                style={{ color: Color.brownOrange(), fontWeight: 'bold' }}
                icon={['far', 'badge-dollar']}
              />{' '}
              <span
                className={css`
                  color: ${Color.brownOrange()};
                  font-weight: bold;
                `}
              >
                {mission.coinReward}
              </span>
            </>
          ) : null}
        </>
      );
    }
    function renderKorean() {
      const missionXPRewardLabel = addCommasToNumber(mission.xpReward);
      return (
        <>
          <UsernameText user={uploader} color={Color[linkColor]()} />
          님에게{' '}
          {mission.xpReward ? (
            <>
              <span
                className={css`
                  color: ${Color[xpNumberColor]()};
                  font-weight: bold;
                `}
              >
                {missionXPRewardLabel}{' '}
              </span>{' '}
              <span
                className={css`
                  color: ${Color.gold()};
                  font-weight: bold;
                `}
              >
                XP
              </span>
            </>
          ) : null}
          {mission.xpReward && mission.coinReward ? <>와 </> : null}
          {mission.coinReward ? (
            <>
              <Icon
                style={{ color: Color.brownOrange(), fontWeight: 'bold' }}
                icon={['far', 'badge-dollar']}
              />{' '}
              <span
                className={css`
                  color: ${Color.brownOrange()};
                  font-weight: bold;
                `}
              >
                {mission.coinReward}
              </span>
            </>
          ) : null}
          {mission.coinReward ? '이' : '가'} 지급됐습니다
        </>
      );
    }
  }, [
    linkColor,
    mission.coinReward,
    mission.xpReward,
    uploader,
    xpNumberColor
  ]);

  return (
    <div
      className={css`
        padding: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        margin-bottom: -4rem;
      `}
      style={style}
    >
      {mission.rootMission?.title && (
        <div
          className={css`
            margin-bottom: 0.3rem;
          `}
        >
          {mission.rootMission.title}
        </div>
      )}
      <ContentLink
        content={{
          id: mission.id,
          missionType: mission.missionType,
          rootMissionType: mission.rootMission?.missionType
        }}
        label={mission.title}
        contentType="mission"
        style={{ fontWeight: 'bold', fontSize: '2.2rem', color: Color.black() }}
      />
      <div
        className={css`
          margin-top: 1.2rem;
          border-radius: ${borderRadius};
          box-shadow: 0 0 2px ${Color.brown()};
          padding: 0.5rem 2rem;
          font-weight: bold;
          font-size: 2rem;
          background: ${Color.brownOrange()};
          color: #fff;
        `}
      >
        {mission.isTask ? taskCompleteLabel : missionAccomplishedLabel}
      </div>
      {rewardDetails}
    </div>
  );
}
