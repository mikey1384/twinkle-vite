import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import RichText from '~/components/Texts/RichText';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import DailyQuestionModal from '~/containers/Home/DailyQuestionModal';
import XPAndStreakDisplay from '~/components/XPAndStreakDisplay';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useRoleColor } from '~/theme/useRoleColor';
import { useKeyContext, useNotiContext } from '~/contexts';
import { Content, User } from '~/types';

export default function TargetDailyReflectionContent({
  dailyReflectionContent,
  style
}: {
  dailyReflectionContent: Content;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const { userId } = useKeyContext((v) => v.myState);
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const [dailyQuestionModalShown, setDailyQuestionModalShown] = useState(false);

  const uploader = dailyReflectionContent.uploader as User;
  const reflectionId = dailyReflectionContent.id;

  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const linkColor = linkRole.getColor();

  // Check if current user has already answered today's question
  const hasAnsweredToday = todayStats?.dailyQuestionCompleted;
  const showAnswerButton = userId && !hasAnsweredToday;

  // Get XP and streak from the content
  const xpAwarded = dailyReflectionContent.xpAwarded || 0;
  const streak = dailyReflectionContent.streakAtTime || 0;

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
        {dailyReflectionContent.isRefined && (
          <div
            className={css`
              margin-top: 1rem;
              display: flex;
              align-items: center;
              gap: 0.3rem;
              font-size: 1.2rem;
              color: ${Color.darkerGray()};
            `}
          >
            <span style={{ color: Color.logoBlue() }}>✨</span>
            <span style={{ fontStyle: 'italic' }}>AI-polished</span>
          </div>
        )}

        <XPAndStreakDisplay
          xpAwarded={xpAwarded}
          streak={streak}
          style={{ marginTop: '1rem' }}
        />

        {/* Answer Today's Question Button */}
        {showAnswerButton && (
          <div
            className={css`
              margin-top: 1.2rem;
              padding-top: 1rem;
              border-top: 1px solid ${Color.borderGray()};
            `}
          >
            <Button
              variant="solid"
              color="green"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setDailyQuestionModalShown(true);
              }}
            >
              <Icon icon="pencil-alt" style={{ marginRight: '0.5rem' }} />
              Answer Today's Question
            </Button>
          </div>
        )}
      </div>
      {dailyQuestionModalShown && (
        <DailyQuestionModal onHide={() => setDailyQuestionModalShown(false)} />
      )}
    </div>
  );
}
