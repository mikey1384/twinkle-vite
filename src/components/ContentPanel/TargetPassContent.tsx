import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import MissionStatusCard from '~/components/MissionStatusCard';
import AchievementItem from '~/components/AchievementItem';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import ContentLink from '~/components/ContentLink';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useRoleColor } from '~/theme/useRoleColor';
import { Content, User } from '~/types';

export default function TargetPassContent({
  passContent,
  style
}: {
  passContent: Content;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const uploader = passContent.uploader as User;
  const mission = passContent.rootObj;
  const isMission = passContent.rootType === 'mission';
  const passId = passContent.id;

  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const linkColor = linkRole.getColor();
  const xpNumberColor = xpNumberRole.getColor();

  if (!mission) {
    return null;
  }

  const header = (
    <header
      className={css`
        display: flex;
        align-items: center;
        gap: 0.9rem;
        padding: 0.2rem 0.2rem 0.6rem 0.2rem;
        width: 100%;
      `}
    >
      <ProfilePic
        style={{ width: '3.8rem', flexShrink: 0 }}
        userId={uploader?.id}
        profilePicUrl={uploader?.profilePicUrl || ''}
      />
      <div
        className={css`
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        `}
      >
        <span
          className={css`
            font-size: 1.6rem;
            font-weight: 600;
          `}
        >
          <UsernameText user={uploader} color={linkColor} />{' '}
          {isMission
            ? `completed a ${mission.isTask ? 'task' : 'mission'}`
            : 'unlocked an achievement'}
        </span>
        {passContent.timeStamp && (
          <small
            className={css`
              font-size: 1.1rem;
              color: ${Color.gray()};
              cursor: pointer;
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                isMission
                  ? `/mission-passes/${passId}`
                  : `/achievement-unlocks/${passId}`
              );
            }}
          >
            {timeSince(passContent.timeStamp)}
          </small>
        )}
      </div>
    </header>
  );

  if (!isMission) {
    return (
      <div
        className={css`
          cursor: pointer;
          background: #fff;
          border: 1px solid var(--ui-border);
          border-radius: 0 0 ${borderRadius} ${borderRadius};
          padding: 1rem;
          @media (max-width: ${mobileMaxWidth}) {
            border: none;
            border-radius: 0;
          }
        `}
        style={style}
        onClick={() => navigate(`/achievement-unlocks/${passId}`)}
      >
        {header}
        <AchievementItem
          isNotification
          achievement={mission as Content}
        />
      </div>
    );
  }

  const message = (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        align-items: center;
      `}
    >
      <div>
        <UsernameText user={uploader} color={linkColor} /> was rewarded{' '}
        {mission.xpReward ? (
          <>
            <span style={{ color: xpNumberColor, fontWeight: 'bold' }}>
              {addCommasToNumber(mission.xpReward)}
            </span>{' '}
            <span style={{ color: Color.gold(), fontWeight: 'bold' }}>XP</span>
          </>
        ) : null}
        {mission.xpReward && mission.coinReward ? ' and ' : null}
        {mission.coinReward ? (
          <>
            <Icon
              style={{ color: Color.brownOrange(), fontWeight: 'bold' }}
              icon={['far', 'badge-dollar']}
            />{' '}
            <span style={{ color: Color.brownOrange(), fontWeight: 'bold' }}>
              {mission.coinReward}
            </span>
          </>
        ) : null}
      </div>
      {mission.rootMission?.title && (
        <div
          className={css`
            font-size: 1.4rem;
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
        style={{
          fontWeight: 'bold',
          fontSize: '1.8rem',
          color: Color.black()
        }}
      />
    </div>
  );

  return (
    <div
      className={css`
        cursor: pointer;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: 0 0 ${borderRadius} ${borderRadius};
        padding: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          border: none;
          border-radius: 0;
        }
      `}
      style={style}
      onClick={() => navigate(`/mission-passes/${passId}`)}
    >
      {header}
      <div
        className={css`
          display: flex;
          justify-content: center;
        `}
      >
        <MissionStatusCard
          status="success"
          title={mission.isTask ? 'Task Complete' : 'Mission Accomplished'}
          message={message}
          rewards={{
            xp: mission.xpReward,
            coins: mission.coinReward
          }}
          style={{
            transform: 'scale(0.85)',
            transformOrigin: 'top center'
          }}
        />
      </div>
    </div>
  );
}
