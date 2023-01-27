import { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import InputForm from '~/components/Forms/InputForm';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import LocalContext from '../../Context';
import { useContentContext, useInputContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { v1 as uuidv1 } from 'uuid';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import Loading from '~/components/Loading';
import RewardLevelExpectation from './RewardLevelExpectation';

CommentInputArea.propTypes = {
  autoFocus: PropTypes.bool,
  inputTypeLabel: PropTypes.string,
  innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  InputFormRef: PropTypes.object,
  numInputRows: PropTypes.number,
  onSubmit: PropTypes.func.isRequired,
  onViewSecretAnswer: PropTypes.func,
  parent: PropTypes.object.isRequired,
  rootCommentId: PropTypes.number,
  subjectId: PropTypes.number,
  style: PropTypes.object,
  subjectRewardLevel: PropTypes.number,
  targetCommentId: PropTypes.number,
  theme: PropTypes.string
};

export default function CommentInputArea({
  autoFocus,
  innerRef,
  inputTypeLabel,
  InputFormRef,
  numInputRows = 4,
  onSubmit,
  onViewSecretAnswer,
  parent,
  rootCommentId,
  subjectId,
  style,
  subjectRewardLevel,
  targetCommentId,
  theme
}) {
  const [uploading, setUploading] = useState(false);
  const placeholderLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return '댓글을 입력하세요...';
    }
    return `Enter your ${inputTypeLabel} here...`;
  }, [inputTypeLabel]);
  const contentType = useMemo(
    () =>
      targetCommentId ? 'comment' : subjectId ? 'subject' : parent.contentType,
    [parent, targetCommentId, subjectId]
  );
  const contentId = useMemo(
    () => targetCommentId || subjectId || parent.contentId,
    [parent, targetCommentId, subjectId]
  );
  const { onSubmitWithAttachment } = useContext(LocalContext);
  const state = useInputContext((v) => v.state);
  const onSetCommentAttachment = useInputContext(
    (v) => v.actions.onSetCommentAttachment
  );
  const onSetUploadingFile = useContentContext(
    (v) => v.actions.onSetUploadingFile
  );
  const { fileUploadProgress, uploadingFile } = useContentState({
    contentId,
    contentType
  });
  const attachment = useMemo(
    () => state[contentType + contentId]?.attachment,
    [contentId, contentType, state]
  );

  return (
    <div style={{ ...style, position: 'relative' }} ref={InputFormRef}>
      {!!subjectRewardLevel && (
        <RewardLevelExpectation rewardLevel={subjectRewardLevel} />
      )}
      {uploadingFile ? (
        <FileUploadStatusIndicator
          theme={theme}
          style={{
            fontSize: '1.7rem',
            fontWeight: 'bold',
            marginTop: 0,
            paddingBottom: '1rem'
          }}
          fileName={attachment?.file?.name}
          uploadProgress={fileUploadProgress}
        />
      ) : (
        <div style={{ position: 'relative', width: '100%' }}>
          <InputForm
            innerRef={innerRef}
            autoFocus={autoFocus}
            onSubmit={handleSubmit}
            onViewSecretAnswer={onViewSecretAnswer}
            parent={{ contentId, contentType }}
            rows={numInputRows}
            placeholder={placeholderLabel}
            targetCommentId={targetCommentId}
            theme={theme}
          />
          {uploading && (
            <Loading
              style={{ height: 0, position: 'absolute', top: '15rem' }}
            />
          )}
        </div>
      )}
    </div>
  );

  async function handleSubmit(text) {
    if (attachment) {
      onSetUploadingFile({
        contentId,
        contentType,
        isUploading: true
      });
      await onSubmitWithAttachment({
        attachment,
        commentContent: text,
        contentId,
        contentType,
        filePath: uuidv1(),
        file: attachment.file,
        rootCommentId,
        subjectId,
        targetCommentId
      });
      onSetCommentAttachment({
        attachment: null,
        contentType,
        contentId
      });
    } else {
      setUploading(true);
      await onSubmit({
        content: text,
        rootCommentId,
        subjectId,
        targetCommentId
      });
      setUploading(false);
    }
    onSetUploadingFile({
      contentId,
      contentType,
      isUploading: false
    });
    return Promise.resolve();
  }
}
