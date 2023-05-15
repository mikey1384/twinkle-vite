import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import RichText from '~/components/Texts/RichText';
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';
import { Subject, User } from '~/types';

Content.propTypes = {
  content: PropTypes.string,
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  description: PropTypes.string,
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
  theme: string;
  title: string;
  uploader: User;
}) {
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
              {uploader.username} viewed the secret message
            </div>
          );
        }
        return (
          <RichText
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
            style={{
              width: '100%',
              marginTop: 0,
              marginBottom: '0.5rem',
              backgroundColor: Color.extraLightGray(),
              padding: '1rem',
              border: '1px solid #ccc',
              borderRadius,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              fontFamily: '"Arial", sans-serif',
              fontSize: '1.8rem'
            }}
          >
            <RichText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
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
    contentId,
    theme,
    story,
    Description,
    navigate,
    targetObj?.subject?.id,
    rootId,
    uploader.username,
    content
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
