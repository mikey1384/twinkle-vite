import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';
import { CIEL_TWINKLE_ID, ZERO_TWINKLE_ID } from '~/constants/defaultValues';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import RichText from '~/components/Texts/RichText';
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';
import { css } from '@emotion/css';
import { Subject, User } from '~/types';

Content.propTypes = {
  content: PropTypes.string,
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  description: PropTypes.string,
  difficulty: PropTypes.number,
  isNotification: PropTypes.bool,
  navigate: PropTypes.func.isRequired,
  onClickSecretAnswer: PropTypes.func,
  rootId: PropTypes.number,
  secretAnswer: PropTypes.string,
  secretAttachment: PropTypes.any,
  secretHidden: PropTypes.bool,
  story: PropTypes.string,
  targetObj: PropTypes.object,
  theme: PropTypes.string,
  title: PropTypes.string,
  uploader: PropTypes.object
};
export default function Content({
  content,
  contentId,
  contentType,
  description,
  difficulty,
  isNotification,
  navigate,
  onClickSecretAnswer,
  rootId,
  secretAnswer,
  secretAttachment,
  secretHidden,
  story,
  targetObj,
  theme,
  title,
  uploader
}: {
  content: string;
  contentId: number;
  contentType: string;
  description: string;
  difficulty?: number;
  isNotification: boolean;
  navigate: (url: string) => void;
  onClickSecretAnswer?: () => void;
  rootId: number;
  secretAnswer: string;
  secretAttachment: any;
  secretHidden: boolean;
  story: string;
  targetObj: {
    subject: Subject;
  };
  theme?: string;
  title: string;
  uploader: User;
}) {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const difficultyColor = useMemo(() => {
    switch (difficulty) {
      case 1:
        return '#D0EBFF'; // Soft blue (for 'logoBlue')
      case 2:
        return '#FCE4EC'; // Soft pink (for 'pink')
      case 3:
        return '#FAD7A0'; // Soft orange (for 'orange')
      case 4:
        return '#F4D7FA'; // Soft magenta (for 'magenta')
      case 5:
        return Color.gold(0.7); // Soft gold (for 'gold')
      default:
        return '#f0f8ff'; // Default color
    }
  }, [difficulty]);

  const Description = useMemo(() => {
    return !stringIsEmpty(description)
      ? description.trim()
      : contentType === 'video' || contentType === 'url'
      ? (title || '').trimEnd()
      : '';
  }, [contentType, description, title]);
  const RenderedContent = useMemo(() => {
    switch (contentType) {
      case 'comment':
        if (secretHidden) {
          return (
            <SecretComment
              onClick={() =>
                navigate(`/subjects/${targetObj?.subject?.id || rootId}`)
              }
            />
          );
        }
        if (isNotification) {
          return (
            <div
              style={{
                color: Color.gray(),
                fontWeight: 'bold',
                borderRadius
              }}
            >
              {uploader?.username} viewed the secret message
            </div>
          );
        }
        return (
          <RichText
            isAIMessage={
              uploader?.id === Number(ZERO_TWINKLE_ID) ||
              uploader?.id === Number(CIEL_TWINKLE_ID)
            }
            contentId={contentId}
            contentType={contentType}
            section="content"
            theme={theme}
          >
            {(content || '').trimEnd()}
          </RichText>
        );
      case 'aiStory':
        return (
          <div
            className={css`
              width: 100%;
              margin-top: 0;
              margin-bottom: 0.5rem;
              background-color: ${difficultyColor};
              padding: 1rem;
              border: 1px solid #b0c4de;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              font-family: 'Poppins', sans-serif;
              font-size: 1.6rem;
              transition: box-shadow 0.2s ease;
              line-height: 1.7;

              &:hover {
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
              }

              opacity: 0;
              animation: ${fadeIn ? 'fadein 1s ease forwards' : 'none'};
              @keyframes fadein {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}
          >
            <RichText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
              style={{ color: '#000' }}
            >
              {story}
            </RichText>
          </div>
        );
      default:
        return Description ? (
          <div
            style={{
              width: '100%',
              marginTop: contentType === 'url' ? '-1rem' : 0,
              marginBottom:
                contentType === 'url' || contentType === 'subject'
                  ? '1rem'
                  : '0.5rem'
            }}
          >
            <RichText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
            >
              {Description}
            </RichText>
          </div>
        ) : null;
    }
  }, [
    contentType,
    secretHidden,
    isNotification,
    uploader?.id,
    uploader?.username,
    contentId,
    theme,
    content,
    difficultyColor,
    fadeIn,
    story,
    Description,
    navigate,
    targetObj?.subject?.id,
    rootId
  ]);

  return (
    <div>
      {contentType === 'subject' && (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          <p
            style={{
              marginTop: '0.7rem',
              marginBottom: '1.7rem',
              fontWeight: 'bold',
              fontSize: '2.2rem'
            }}
          >
            {title}
          </p>
        </div>
      )}
      {RenderedContent}
      {(secretAnswer || secretAttachment) && (
        <SecretAnswer
          answer={secretAnswer}
          theme={theme}
          attachment={secretAttachment}
          onClick={onClickSecretAnswer}
          subjectId={contentId}
          uploaderId={uploader.id}
        />
      )}
    </div>
  );
}
