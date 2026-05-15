import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import RichText from '~/components/Texts/RichText';
import AnswerDailyQuestionButton from '~/components/Buttons/AnswerDailyQuestionButton';
import DailyReflectionMetaBadges from '~/components/DailyReflectionMetaBadges';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Content, User } from '~/types';

export default function TargetDailyReflectionContent({
  dailyReflectionContent,
  style
}: {
  dailyReflectionContent: Content;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();

  const uploader = dailyReflectionContent.uploader as User;
  const reflectionId = dailyReflectionContent.id;

  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const linkColor = linkRole.getColor();

  if (!dailyReflectionContent) {
    return null;
  }

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
      onClick={() => navigate(`/daily-reflections/${reflectionId}`)}
    >
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
            <UsernameText user={uploader} color={linkColor} /> shared a daily
            reflection
          </span>
          {dailyReflectionContent.timeStamp && (
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
                navigate(`/daily-reflections/${reflectionId}`);
              }}
            >
              {timeSince(dailyReflectionContent.timeStamp)}
            </small>
          )}
        </div>
      </header>
      <div
        className={css`
          padding: 0.5rem 1rem;
        `}
      >
        {dailyReflectionContent.question && (
          <div
            className={css`
              margin-bottom: 1rem;
              padding: 0.8rem;
              border-radius: ${borderRadius};
              border: 1px solid ${Color.borderGray()};
              background: ${Color.wellGray()};
            `}
          >
            <div
              className={css`
                font-weight: bold;
                margin-bottom: 0.5rem;
                color: ${Color.darkerGray()};
                font-size: 1.3rem;
              `}
            >
              Question:
            </div>
            <div
              className={css`
                font-style: italic;
                font-size: 1.4rem;
              `}
            >
              {dailyReflectionContent.question}
            </div>
          </div>
        )}
        <RichText
          contentType="dailyReflection"
          contentId={reflectionId}
          maxLines={5}
        >
          {dailyReflectionContent.description || ''}
        </RichText>
        <DailyReflectionMetaBadges
          grade={dailyReflectionContent.grade}
          isRefined={dailyReflectionContent.isRefined}
          masterpieceType={dailyReflectionContent.masterpieceType}
          xpAwarded={dailyReflectionContent.xpAwarded}
          streak={dailyReflectionContent.streakAtTime}
          style={{ marginTop: '1rem' }}
        />

        <AnswerDailyQuestionButton />
      </div>
    </div>
  );
}
