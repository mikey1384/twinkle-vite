import React, { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import InputForm from '~/components/Forms/InputForm';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import LocalContext from '../../Context';
import { useContentContext, useInputContext, useKeyContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { returnTheme } from '~/helpers';
import { v1 as uuidv1 } from 'uuid';
import { Color } from '~/constants/css';
import {
  expectedResponseLength,
  SELECTED_LANGUAGE
} from '~/constants/defaultValues';
import Loading from '~/components/Loading';
import RewardLevelExpectation from './RewardLevelExpectation';

CommentInputArea.propTypes = {
  autoFocus: PropTypes.bool,
  disableReason: PropTypes.string,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  inputTypeLabel: PropTypes.string.isRequired,
  InputFormRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
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
  disableReason,
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
}: {
  autoFocus?: boolean;
  disableReason?: string;
  innerRef?: React.RefObject<any>;
  inputTypeLabel: string;
  InputFormRef?: React.RefObject<any>;
  numInputRows?: number;
  onSubmit: (v: any) => any;
  onViewSecretAnswer?: () => any;
  parent: any;
  rootCommentId?: number | null;
  subjectId?: number;
  style?: React.CSSProperties;
  subjectRewardLevel?: number;
  targetCommentId?: number | null;
  theme?: string;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const themeObj = useMemo(
    () => returnTheme(theme || profileTheme),
    [profileTheme, theme]
  );
  const expectedContentLength = useMemo(() => {
    if (subjectRewardLevel) {
      return expectedResponseLength(subjectRewardLevel);
    }
    return 0;
  }, [subjectRewardLevel]);
  const effortBarColor = useMemo(() => {
    return Color[themeObj[`level${subjectRewardLevel || 1}`]?.color]();
  }, [subjectRewardLevel, themeObj]);
  const [uploading, setUploading] = useState(false);
  const { userId } = useKeyContext((v) => v.myState);
  const placeholderLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return '댓글을 입력하세요...';
    }
    if (inputTypeLabel === 'reply') {
      if (!parent.uploader?.id) {
        return 'Reply...';
      }
      if (parent.uploader?.id === userId) {
        return 'Add more...';
      }
      return `Reply to ${parent.uploader?.username}...`;
    }
    return `Enter your ${inputTypeLabel} here...`;
  }, [inputTypeLabel, parent.uploader?.id, parent.uploader?.username, userId]);
  const contentType = useMemo(
    () =>
      targetCommentId ? 'comment' : subjectId ? 'subject' : parent.contentType,
    [parent, targetCommentId, subjectId]
  );
  const contentId = useMemo(
    () => targetCommentId || subjectId || parent.contentId,
    [parent, targetCommentId, subjectId]
  );
  const { onSubmitWithAttachment } = useContext<{ [key: string]: any }>(
    LocalContext
  );
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
            isComment
            disableReason={disableReason}
            expectedContentLength={expectedContentLength}
            effortBarColor={effortBarColor}
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

  async function handleSubmit(text: string) {
    try {
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
    } catch (error) {
      setUploading(false);
      return Promise.reject(error);
    }
  }
}
