import React from 'react';
import ContentEditor from '../../ContentEditor';
import Content from './Content';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useContentContext } from '~/contexts';
import { Subject, User, Content as ContentType } from '~/types';

export default function ContentDisplay({
  audioPath,
  contentId,
  contentType,
  contentObj,
  content,
  displayedContent,
  description,
  difficulty,
  imagePath,
  imageStyle,
  isEditing,
  isListening,
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
  story,
  secretHidden,
  isNotification,
  onClickSecretAnswer
}: {
  audioPath?: string;
  contentId: number;
  difficulty?: number;
  contentType: string;
  contentObj: ContentType;
  imagePath?: string;
  imageStyle?: string;
  isEditing: boolean;
  isListening?: boolean;
  content: string;
  displayedContent: string;
  description: string;
  filePath: string;
  navigate: (url: string) => void;
  secretAnswer: string;
  secretAttachment: any;
  title: string;
  theme?: string;
  onSetIsEditing: (v: {
    contentId: number;
    contentType: string;
    isEditing: boolean;
  }) => void;
  uploader: User;
  targetObj: {
    subject: Subject;
  };
  rootId: number;
  story: string;
  secretHidden: boolean;
  isNotification: boolean;
  onClickSecretAnswer: () => void;
}) {
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const onEditContent = useContentContext((v) => v.actions.onEditContent);

  return (
    <ErrorBoundary componentPath="ContentPanel/Body/MainContent/ContentDisplay">
      <div
        style={{
          marginTop: contentType === 'subject' && filePath ? '0.5rem' : '1rem',
          padding: '1rem',
          marginBottom: isEditing
            ? 0
            : contentType !== 'video' && !secretHidden
            ? '1rem'
            : 0
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
                contentType === 'video' || contentType === 'subject'
                  ? '1rem'
                  : 0
            }}
            title={title}
            contentType={contentType}
          />
        ) : (
          <Content
            audioPath={audioPath}
            content={content}
            contentId={contentId}
            contentObj={contentObj}
            contentType={contentType}
            difficulty={difficulty}
            description={description}
            imagePath={imagePath}
            imageStyle={imageStyle}
            isListening={isListening}
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
    </ErrorBoundary>
  );

  async function handleEditContent(params: object) {
    const data = await editContent(params);
    onEditContent({ data, contentType, contentId });
  }
}
