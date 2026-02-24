import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import CardThumb from '~/components/CardThumb';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useRoleColor } from '~/theme/useRoleColor';
import { cardLevelHash } from '~/constants/defaultValues';
import { Content, User } from '~/types';

export default function TargetDailyGoalsContent({
  dailyGoalsContent,
  style
}: {
  dailyGoalsContent: Content;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const uploader = dailyGoalsContent.uploader as User;
  const contentId = dailyGoalsContent.id;

  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const xpNumberRole = useRoleColor('xpNumber', { fallback: 'logoGreen' });
  const linkColor = linkRole.getColor();
  const xpNumberColor = xpNumberRole.getColor();

  const { word, level, xpEarned, coinEarned, card } = dailyGoalsContent;

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
          <UsernameText user={uploader} color={linkColor} /> completed all daily
          goals
        </span>
        {dailyGoalsContent.timeStamp && (
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
              navigate(`/daily-rewards/${contentId}`);
            }}
          >
            {timeSince(dailyGoalsContent.timeStamp)}
          </small>
        )}
      </div>
    </header>
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
      onClick={() => navigate(`/daily-rewards/${contentId}`)}
    >
      {header}
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
        `}
      >
        {card && (
          <CardThumb
            card={card}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
          />
        )}
        <div
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            text-align: center;
          `}
        >
          <div
            className={css`
              font-size: 1.8rem;
              font-weight: bold;
              color: ${Color[cardLevelHash[level]?.color]?.() || Color.black()};
            `}
          >
            {word}
          </div>
          <div
            className={css`
              font-size: 1.4rem;
              color: ${Color.darkGray()};
            `}
          >
            <UsernameText user={uploader} color={linkColor} /> earned{' '}
            {xpEarned ? (
              <>
                <span style={{ color: xpNumberColor, fontWeight: 'bold' }}>
                  {addCommasToNumber(xpEarned)}
                </span>{' '}
                <span style={{ color: Color.gold(), fontWeight: 'bold' }}>
                  XP
                </span>
              </>
            ) : null}
            {xpEarned && coinEarned ? ' and ' : null}
            {coinEarned ? (
              <>
                <Icon
                  style={{ color: Color.brownOrange() }}
                  icon="coins"
                />{' '}
                <span style={{ color: Color.brownOrange(), fontWeight: 'bold' }}>
                  {coinEarned}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
