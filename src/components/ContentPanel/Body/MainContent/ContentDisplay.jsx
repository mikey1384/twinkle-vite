import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';
import Link from '~/components/Link';
import LongText from '~/components/Texts/LongText';
import ContentEditor from '../ContentEditor';
import SecretAnswer from '~/components/SecretAnswer';
import SecretComment from '~/components/SecretComment';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useContentContext } from '~/contexts';

ContentDisplay.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  isEditing: PropTypes.bool,
  content: PropTypes.string,
  displayedContent: PropTypes.string,
  description: PropTypes.string,
  filePath: PropTypes.string,
  navigate: PropTypes.func.isRequired,
  secretAnswer: PropTypes.string,
  secretAttachment: PropTypes.object,
  title: PropTypes.string,
  theme: PropTypes.object,
  onSetIsEditing: PropTypes.func.isRequired,
  uploader: PropTypes.object,
  targetObj: PropTypes.object,
  rootId: PropTypes.number,
  contentColor: PropTypes.string,
  story: PropTypes.string,
  secretHidden: PropTypes.bool,
  isNotification: PropTypes.bool,
  onClickSecretAnswer: PropTypes.func.isRequired
};

export default function ContentDisplay({
  contentId,
  contentType,
  isEditing,
  content,
  displayedContent,
  description,
  filePath,
  navigate,
  secretAnswer,
  secretAttachment,
  title,
  theme,
  onSetIsEditing,
  uploader,
  targetObj,
  rootId,
  contentColor,
  story,
  secretHidden,
  isNotification,
  onClickSecretAnswer
}) {
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const Description = useMemo(() => {
    return !stringIsEmpty(description)
      ? description
      : contentType === 'video' || contentType === 'url'
      ? title
      : '';
  }, [contentType, description, title]);

  return (
    <div
      style={{
        marginTop: contentType === 'subject' && filePath ? '0.5rem' : '1rem',
        marginBottom: isEditing
          ? 0
          : contentType !== 'video' && !secretHidden && '1rem',
        padding: '1rem',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBrea: 'break-word'
      }}
    >
      {isEditing ? (
        <ContentEditor
          comment={content}
          content={displayedContent}
          contentId={contentId}
          description={description}
          filePath={filePath}
          onDismiss={() =>
            onSetIsEditing({ contentId, contentType, isEditing: false })
          }
          onEditContent={handleEditContent}
          secretAnswer={secretAnswer}
          style={{
            marginTop:
              (contentType === 'video' || contentType === 'subject') && '1rem'
          }}
          title={title}
          contentType={contentType}
        />
      ) : (
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
          {contentType !== 'comment' && (
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
                {Description || story}
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
      )}
    </div>
  );

  async function handleEditContent(params) {
    const data = await editContent(params);
    onEditContent({ data, contentType, contentId });
  }
}
