import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import RichText from '~/components/Texts/RichText';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useRoleColor } from '~/theme/useRoleColor';
import { Content, User } from '~/types';

export default function TargetSharedTopicContent({
  sharedTopicContent,
  style
}: {
  sharedTopicContent: Content;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const uploader = sharedTopicContent.uploader as User;
  const topicId = sharedTopicContent.id;

  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const linkColor = linkRole.getColor();

  if (!sharedTopicContent) {
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
      onClick={() => navigate(`/shared-prompts/${topicId}`)}
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
            <UsernameText user={uploader} color={linkColor} /> shared a system
            prompt
          </span>
          {sharedTopicContent.timeStamp && (
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
                navigate(`/shared-prompts/${topicId}`);
              }}
            >
              {timeSince(sharedTopicContent.timeStamp)}
            </small>
          )}
        </div>
      </header>
      <div
        className={css`
          padding: 0.5rem 1rem;
        `}
      >
        <h3
          className={css`
            margin: 0 0 0.5rem 0;
            font-size: 1.7rem;
            color: ${Color.darkerGray()};
          `}
        >
          {sharedTopicContent.title || sharedTopicContent.content}
        </h3>
        {sharedTopicContent.customInstructions && (
          <div
            className={css`
              padding: 0.8rem;
              border-radius: ${borderRadius};
              border: 1px solid ${Color.borderGray()};
              background: ${Color.wellGray()};
              font-size: 1.4rem;
            `}
          >
            <RichText
              contentType="sharedTopic"
              contentId={topicId}
              maxLines={5}
            >
              {sharedTopicContent.customInstructions}
            </RichText>
          </div>
        )}
      </div>
    </div>
  );
}
