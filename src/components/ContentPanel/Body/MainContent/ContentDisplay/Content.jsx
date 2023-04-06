import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import Link from '~/components/Link';
import LongText from '~/components/Texts/LongText';
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';

Content.propTypes = {
  content: PropTypes.string,
  contentColor: PropTypes.string,
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
  contentColor,
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

  return (
    <div>
      {contentType === 'comment' &&
        (secretHidden ? (
          <SecretComment
            onClick={() =>
              navigate(`/subjects/${targetObj?.subject?.id || rootId}`)
            }
          />
        ) : isNotification ? (
          <div
            style={{
              color: Color.gray(),
              fontWeight: 'bold',
              borderRadius
            }}
          >
            {uploader.username} viewed the secret message
          </div>
        ) : (
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
        ))}
      {contentType === 'subject' && (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          <Link
            style={{
              fontWeight: 'bold',
              fontSize: '2.2rem',
              color: Color[contentColor](),
              textDecoration: 'none'
            }}
            to={`/subjects/${contentId}`}
          >
            Subject:
          </Link>
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
      {contentType === 'aiStory' && (
        <div
          style={{
            marginTop: 0,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            marginBottom: '0.5rem'
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
      )}
      {contentType !== 'comment' && contentType !== 'aiStory' && (
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
      )}
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
