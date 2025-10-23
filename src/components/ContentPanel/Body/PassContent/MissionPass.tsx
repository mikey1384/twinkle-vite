import React, { useMemo } from 'react';
import ContentLink from '~/components/ContentLink';
import MissionStatusCard from '~/components/MissionStatusCard';
import UsernameText from '~/components/Texts/UsernameText';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import { Color } from '~/constants/css';
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
  const resolvedLinkColor = linkColor || Color.logoBlue();
  const resolvedXpNumberColor = xpNumberColor || Color.logoGreen();
  const rewards = useMemo(() => {
    return {
      xp: mission.xpReward,
      coins: mission.coinReward
    };
  }, [mission.coinReward, mission.xpReward]);

  const message = useMemo(() => {
    const rewardLine =
      SELECTED_LANGUAGE === 'kr' ? (
        <KoreanMessage
          mission={mission}
          uploader={uploader}
          linkColor={resolvedLinkColor}
          xpNumberColor={resolvedXpNumberColor}
        />
      ) : (
        <EnglishMessage
          mission={mission}
          uploader={uploader}
          linkColor={resolvedLinkColor}
          xpNumberColor={resolvedXpNumberColor}
        />
      );

    return (
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          align-items: center;
        `}
      >
        <div>{rewardLine}</div>
        {mission.rootMission?.title && (
          <div
            className={css`
              font-size: 1.6rem;
              color: ${Color.darkGray()};
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
      </div>
    );
  }, [
    mission,
    resolvedLinkColor,
    resolvedXpNumberColor,
    uploader
  ]);

  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        justify-content: center;
        margin-bottom: -4rem;
      `}
      style={style}
    >
      <MissionStatusCard
        status="success"
        title={mission.isTask ? taskCompleteLabel : missionAccomplishedLabel}
        message={message}
        rewards={rewards}
      />
    </div>
  );
}

function EnglishMessage({
  mission,
  uploader,
  linkColor,
  xpNumberColor
}: {
  mission: Content;
  uploader: User;
  linkColor: string;
  xpNumberColor: string;
}) {
  return (
    <>
      <UsernameText user={uploader} color={linkColor} /> was rewarded{' '}
      {mission.xpReward ? (
        <>
          <span
            className={css`
              color: ${xpNumberColor};
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

function KoreanMessage({
  mission,
  uploader,
  linkColor,
  xpNumberColor
}: {
  mission: Content;
  uploader: User;
  linkColor: string;
  xpNumberColor: string;
}) {
  const missionXPRewardLabel = addCommasToNumber(mission.xpReward);
  return (
    <>
      <UsernameText user={uploader} color={linkColor} />
      님에게{' '}
      {mission.xpReward ? (
        <>
          <span
            className={css`
              color: ${xpNumberColor};
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
