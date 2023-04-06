import PropTypes from 'prop-types';
import ContentEditor from '../../ContentEditor';
import Content from './Content';
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
  theme: PropTypes.string,
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
        <Content
          content={content}
          contentColor={contentColor}
          contentId={contentId}
          contentType={contentType}
          description={description}
          isNotification={isNotification}
          navigate={navigate}
          onClickSecretAnswer={onClickSecretAnswer}
          rootId={rootId}
          secretAnswer={secretAnswer}
          secretAttachment={secretAttachment}
          secretHidden={secretHidden}
          story={story}
          targetObj={targetObj}
          theme={theme}
          title={title}
          uploader={uploader}
        />
      )}
    </div>
  );

  async function handleEditContent(params) {
    const data = await editContent(params);
    onEditContent({ data, contentType, contentId });
  }
}
