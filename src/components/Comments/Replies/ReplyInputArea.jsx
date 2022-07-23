import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import InputForm from '~/components/Forms/InputForm';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import { useContentContext, useInputContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { v1 as uuidv1 } from 'uuid';
import localize from '~/constants/localize';

const enterReplyLabel = localize('enterReply');

ReplyInputArea.propTypes = {
  rootCommentId: PropTypes.number,
  innerRef: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onSubmitWithAttachment: PropTypes.func.isRequired,
  parent: PropTypes.object.isRequired,
  rows: PropTypes.number,
  style: PropTypes.object,
  theme: PropTypes.string,
  targetCommentId: PropTypes.number
};

export default function ReplyInputArea({
  innerRef,
  onSubmit,
  onSubmitWithAttachment,
  parent,
  rootCommentId,
  style,
  targetCommentId,
  theme,
  rows = 1
}) {
  const state = useInputContext((v) => v.state);
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
            onSubmit={handleSubmit}
            parent={parent}
            placeholder={`${enterReplyLabel}...`}
            rows={rows}
            theme={theme}
            targetCommentId={targetCommentId}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleSubmit(text) {
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
      onSubmit({
        content: text,
        rootCommentId,
        subjectId: parent.subjectId,
        targetCommentId
      });
    }
    onSetUploadingFile({
      contentId: targetCommentId,
      contentType: 'comment',
      isUploading: false
    });
    return Promise.resolve();
  }
}
