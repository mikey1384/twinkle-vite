import React, { memo, useMemo, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import EditTextArea from '~/components/Texts/EditTextArea';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import RichText from '~/components/Texts/RichText';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentFileViewer from '~/components/ContentFileViewer';
import LoginToViewContent from '~/components/LoginToViewContent';
import AiEnergySponsorButton, {
  shouldRenderAiEnergySponsorNotice
} from '~/components/Comments/AiEnergySponsorButton';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { timeSince } from '~/helpers/timeStampHelpers';
import { Color } from '~/constants/css';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import {
  useAppContext,
  useContentContext,
  useHomeContext,
  useKeyContext
} from '~/contexts';
import { Comment as CommentType } from '~/types';
import { getCommentActionPermissions } from '~/components/Comments/permissions';

function Comment({
  comment,
  comment: { id, content, fileName, filePath, fileSize, timeStamp, thumbUrl },
  onDelete,
  onEditDone,
  theme
}: {
  comment: CommentType;
  onDelete: (v: any) => void;
  onEditDone: (v: any) => void;
  theme: string;
}) {
  const navigate = useNavigate();
  const level = useKeyContext((v) => v.myState.level);
  const userId = useKeyContext((v) => v.myState.userId);
  const { canDelete, canEdit } = useMyLevel();
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const onDeleteHomeFeedComment = useHomeContext(
    (v) => v.actions.onDeleteComment
  );
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const { isEditing } = useContentState({
    contentType: 'comment',
    contentId: id
  });
  const { fileType } = getFileInfoFromFileName(fileName);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const uploader = comment.uploader || {};
  const { userCanDeleteThis, userCanEditThis } = useMemo(
    () =>
      getCommentActionPermissions({
        canDelete,
        canEdit,
        uploaderId: uploader.id,
        uploaderLevel: uploader.level,
        userId,
        userLevel: level
      }),
    [canDelete, canEdit, level, uploader.id, uploader.level, userId]
  );
  const dropdownMenuItems = useMemo(() => {
    const items = [];
    if (userCanEditThis) {
      items.push({
        label: 'Edit',
        onClick: () =>
          onSetIsEditing({
            contentId: id,
            contentType: 'comment',
            isEditing: true
          })
      });
    }
    if (userCanDeleteThis) {
      items.push({
        label: 'Remove',
        onClick: () => setConfirmModalShown(true)
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userCanDeleteThis, userCanEditThis]);

  return (
    <ErrorBoundary
      componentPath="ContentPanel/TargetContent/Comment"
      className={css`
        display: flex;
        width: 100%;
        flex-direction: column;
        padding: 1rem;
      `}
    >
      {!isEditing && dropdownMenuItems.length > 0 && (
        <div
          className={css`
            width: 100%;
            position: relative;
            display: flex;
            flex-direction: row-reverse;
          `}
        >
          <DropdownButton
            variant="solid"
            tone="raised"
            color="darkerGray"
            style={{ position: 'absolute' }}
            menuProps={dropdownMenuItems}
          />
        </div>
      )}
      <div
        className={css`
          display: flex;
          width: 100%;
        `}
      >
        <div>
          <ProfilePic
            style={{ width: '5rem' }}
            userId={uploader.id}
            profilePicUrl={uploader.profilePicUrl}
          />
        </div>
        <div
          className={css`
            width: 90%;
            margin-left: 2%;
          `}
        >
          <div>
            <UsernameText
              style={{ fontSize: '1.7rem' }}
              user={{
                username: uploader.username,
                id: uploader.id
              }}
            />{' '}
            <small
              className={css`
                cursor: pointer;
                &:hover {
                  text-decoration: underline;
                }
              `}
              onClick={() => navigate(`/comments/${comment.id}`)}
              style={{ color: Color.gray() }}
            >
              &nbsp;
              {timeSince(timeStamp)}
            </small>
          </div>
          {isEditing ? (
            <EditTextArea
              contentType="comment"
              contentId={id}
              text={content}
              onCancel={() =>
                onSetIsEditing({
                  contentId: id,
                  contentType: 'comment',
                  isEditing: false
                })
              }
              onEditDone={handleEditComment}
              rows={2}
            />
          ) : (
            <div
              className={css`
                padding-left: 0px;
              `}
            >
              {shouldRenderAiEnergySponsorNotice(comment) ? (
                <AiEnergySponsorButton comment={comment} theme={theme} />
              ) : (
                <RichText
                  theme={theme}
                  style={{
                    margin: '0.5rem 0 1rem 0'
                  }}
                >
                  {content}
                </RichText>
              )}
              {filePath &&
                (userId ? (
                  <div
                    className={css`
                      width: 100%;
                    `}
                  >
                    <ContentFileViewer
                      theme={theme}
                      contentId={comment.id}
                      contentType="comment"
                      fileName={fileName}
                      filePath={filePath}
                      fileSize={Number(fileSize)}
                      thumbUrl={thumbUrl}
                      videoHeight="100%"
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        ...(fileType === 'audio'
                          ? {
                              padding: '1rem'
                            }
                          : {})
                      }}
                    />
                  </div>
                ) : (
                  <LoginToViewContent />
                ))}
            </div>
          )}
        </div>
      </div>
      {confirmModalShown && (
        <ConfirmModal
          onHide={() => setConfirmModalShown(false)}
          title="Remove Comment"
          onConfirm={deleteComment}
        />
      )}
    </ErrorBoundary>
  );

  async function deleteComment() {
    await deleteContent({ id: comment.id, contentType: 'comment' });
    setConfirmModalShown(false);
    onDelete(comment.id);
    onDeleteHomeFeedComment(comment.id);
  }

  async function handleEditComment(editedComment: string) {
    try {
      await editContent({
        editedComment,
        contentId: comment.id,
        contentType: 'comment'
      });
      onEditDone({ editedComment, commentId: comment.id });
      onSetIsEditing({
        contentId: id,
        contentType: 'comment',
        isEditing: false
      });
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

export default memo(Comment);
