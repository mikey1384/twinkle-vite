import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import InputForm from '~/components/Forms/InputForm';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import { useContentContext, useInputContext, useKeyContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { v1 as uuidv1 } from 'uuid';

export default function ReplyInputArea({
  disableReason,
  innerRef,
  onSubmit,
  onSubmitWithAttachment,
  parent,
  rootCommentId,
  style,
  targetCommentId,
  targetCommentPoster,
  theme,
  rows = 1
}: {
  disableReason?: string;
  innerRef?: React.RefObject<any>;
  onSubmit: (args: any) => void;
  onSubmitWithAttachment: (args: any) => void;
  parent: {
    contentId: number;
    contentType: string;
    subjectId: number;
  };
  rootCommentId?: number;
  style?: React.CSSProperties;
  targetCommentId: number;
  targetCommentPoster?: {
    id: number;
    username: string;
  };
  theme: any;
  rows?: number;
}) {
  const state = useInputContext((v) => v.state);
  const { userId } = useKeyContext((v) => v.myState);
  const onSetCommentAttachment = useInputContext(
    (v) => v.actions.onSetCommentAttachment
  );
  const onSetUploadingFile = useContentContext(
    (v) => v.actions.onSetUploadingFile
  );
  const { fileUploadProgress, uploadingFile } = useContentState({
    contentId: targetCommentId,
    contentType: 'comment'
  });
  const attachment = useMemo(
    () => state['comment' + targetCommentId]?.attachment,
    [state, targetCommentId]
  );
  const replyPlaceholder = useMemo(() => {
    if (!targetCommentPoster?.id) {
      return 'Reply...';
    }
    if (targetCommentPoster?.id === userId) {
      return 'Add more...';
    }
    return `Reply to ${targetCommentPoster?.username}...`;
  }, [targetCommentPoster?.id, targetCommentPoster?.username, userId]);

  return (
    <ErrorBoundary componentPath="Comments/Replies/ReplyInputArea">
      <div style={style}>
        {uploadingFile ? (
          <FileUploadStatusIndicator
            theme={theme}
            style={{
              fontSize: '1.7rem',
              fontWeight: 'bold',
              marginTop: 0,
              width: '100%'
            }}
            fileName={attachment?.file?.name}
            uploadProgress={fileUploadProgress}
          />
        ) : (
          <InputForm
            innerRef={innerRef}
            disableReason={disableReason}
            onSubmit={handleSubmit}
            parent={parent}
            placeholder={replyPlaceholder}
            rows={rows}
            theme={theme}
            targetCommentId={targetCommentId}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleSubmit(text: string) {
    try {
      if (attachment) {
        onSetUploadingFile({
          contentId: targetCommentId,
          contentType: 'comment',
          isUploading: true
        });
        await onSubmitWithAttachment({
          attachment,
          commentContent: text,
          contentId: parent.contentId,
          contentType: parent.contentType,
          filePath: uuidv1(),
          file: attachment.file,
          rootCommentId,
          subjectId: parent.subjectId,
          targetCommentId,
          isReply: true
        });
        onSetCommentAttachment({
          attachment: undefined,
          contentType: 'comment',
          contentId: targetCommentId
        });
      } else {
        await onSubmit({
          content: text,
          rootCommentId,
          subjectId: parent.subjectId,
          targetCommentId
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    } finally {
      onSetUploadingFile({
        contentId: targetCommentId,
        contentType: 'comment',
        isUploading: false
      });
    }
    return Promise.resolve();
  }
}
