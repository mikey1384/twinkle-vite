import React from 'react';
import ContentEditor from '../../ContentEditor';
import Content from './Content';
import { useAppContext, useContentContext } from '~/contexts';

interface Props {
  contentId: number;
  contentType: string;
  isEditing: boolean;
  content: string;
  displayedContent: string;
  description: string;
  filePath: string;
  navigate: (url: string) => void;
  secretAnswer: string;
  secretAttachment: any;
  title: string;
  theme: string;
  onSetIsEditing: (v: {
    contentId: number;
    contentType: string;
    isEditing: boolean;
  }) => void;
  uploader: {
    id: number;
    username: string;
  };
  targetObj: {
    subject: {
      id: number;
    };
  };
  rootId: number;
  contentColor: string;
  story: string;
  secretHidden: boolean;
  isNotification: boolean;
  onClickSecretAnswer: (subjectId: number, uploaderId: number) => void;
}
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
}: Props) {
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const onEditContent = useContentContext((v) => v.actions.onEditContent);

  return (
    <div
      style={{
        marginTop: contentType === 'subject' && filePath ? '0.5rem' : '1rem',
        marginBottom: isEditing
          ? 0
          : contentType !== 'video' && !secretHidden
          ? '1rem'
          : 0,
        padding: '1rem',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word'
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
              contentType === 'video' || contentType === 'subject' ? '1rem' : 0
          }}
          title={title}
          contentType={contentType}
        />
      ) : (
        <Content
          content={content}
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

  async function handleEditContent(params: object) {
    const data = await editContent(params);
    onEditContent({ data, contentType, contentId });
  }
}
