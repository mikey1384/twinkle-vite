import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import LongText from '~/components/Texts/LongText';
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';

Content.propTypes = {
  content: PropTypes.string,
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  description: PropTypes.string,
  isNotification: PropTypes.bool,
  navigate: PropTypes.func.isRequired,
  onClickSecretAnswer: PropTypes.func,
  rootId: PropTypes.number,
  secretAnswer: PropTypes.string,
  secretAttachment: PropTypes.object,
  secretHidden: PropTypes.bool,
  story: PropTypes.string,
  targetObj: PropTypes.object,
  theme: PropTypes.string,
  title: PropTypes.string,
  uploader: PropTypes.object.isRequired
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
}) {
  const Description = useMemo(() => {
    return !stringIsEmpty(description)
      ? description
      : contentType === 'video' || contentType === 'url'
      ? title
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
          <div
            style={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word'
            }}
          >
            <LongText
              contentId={contentId}
              contentType={contentType}
              section="content"
              theme={theme}
            >
              {content}
            </LongText>
          </div>
        );
      case 'aiStory':
        return (
          <div
            style={{
              marginTop: 0,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
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
            <LongText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
            >
              {story}
            </LongText>
          </div>
        );
      default:
        return (
          <div
            style={{
              marginTop: contentType === 'url' ? '-1rem' : 0,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              marginBottom:
                contentType === 'url' || contentType === 'subject'
                  ? '1rem'
                  : '0.5rem'
            }}
          >
            <LongText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
            >
              {Description}
            </LongText>
          </div>
        );
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
              marginTop: '1rem',
              marginBottom: '1rem',
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
