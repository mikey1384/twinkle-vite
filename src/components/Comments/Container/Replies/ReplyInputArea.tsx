import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import InputForm from '~/components/Forms/InputForm';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import { useContentContext, useInputContext, useKeyContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { v1 as uuidv1 } from 'uuid';

ReplyInputArea.propTypes = {
  disableReason: PropTypes.string,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  onSubmit: PropTypes.func.isRequired,
  onSubmitWithAttachment: PropTypes.func.isRequired,
  parent: PropTypes.shape({
    contentId: PropTypes.number.isRequired,
    contentType: PropTypes.string.isRequired,
    subjectId: PropTypes.number
  }).isRequired,
  rootCommentId: PropTypes.number,
  style: PropTypes.object,
  targetCommentId: PropTypes.number.isRequired,
  targetCommentPoster: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string
  }),
  theme: PropTypes.string,
  rows: PropTypes.number
};
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
  onSubmit: (v: object) => void;
  onSubmitWithAttachment: (args: any) => void;
  parent: {
    contentId: number;
    contentType: string;
    subjectId?: number;
  };
  rootCommentId?: number | null;
  style?: React.CSSProperties;
  targetCommentId: number | null;
  targetCommentPoster?: {
    id: number;
    username: string;
  };
  theme?: string;
  rows?: number;
}) {
  const attachment = useInputContext(
    (v) => v.state['comment' + targetCommentId]?.attachment
  );
  const userId = useKeyContext((v) => v.myState.userId);
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
