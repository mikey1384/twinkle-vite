import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import DropdownButton from '~/components/Buttons/DropdownButton';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import EditTextArea from '~/components/Texts/EditTextArea';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import RichText from '~/components/Texts/RichText';
import ErrorBoundary from '~/components/ErrorBoundary';
import ContentFileViewer from '~/components/ContentFileViewer';
import LoginToViewContent from '~/components/LoginToViewContent';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { timeSince } from '~/helpers/timeStampHelpers';
import { Color } from '~/constants/css';
import { useContentState } from '~/helpers/hooks';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { useAppContext, useContentContext } from '~/contexts';
import { Comment as CommentType } from '~/types';

Comment.propTypes = {
  comment: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEditDone: PropTypes.func.isRequired,
  profilePicUrl: PropTypes.string.isRequired,
  theme: PropTypes.string.isRequired,
  userId: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired
};
function Comment({
  comment,
  comment: { id, content, fileName, filePath, fileSize, timeStamp, thumbUrl },
  onDelete,
  onEditDone,
  profilePicUrl,
  theme,
  userId,
  username
}: {
  comment: CommentType;
  onDelete: (v: any) => void;
  onEditDone: (v: any) => void;
  profilePicUrl: string;
  theme: string;
  userId: number;
  username: string;
}) {
  const navigate = useNavigate();
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const editContent = useAppContext((v) => v.requestHelpers.editContent);
  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const { isEditing } = useContentState({
    contentType: 'comment',
    contentId: id
  });
  const { fileType } = getFileInfoFromFileName(fileName);
  const [confirmModalShown, setConfirmModalShown] = useState(false);

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
      {!isEditing && (
        <div
          className={css`
            width: 100%;
            position: relative;
            display: flex;
            flex-direction: row-reverse;
          `}
        >
          <DropdownButton
            skeuomorphic
            color="darkerGray"
            style={{ position: 'absolute' }}
            opacity={0.8}
            menuProps={[
              {
                label: 'Edit',
                onClick: () =>
                  onSetIsEditing({
                    contentId: id,
                    contentType: 'comment',
                    isEditing: true
                  })
              },
              {
                label: 'Remove',
                onClick: () => setConfirmModalShown(true)
              }
            ]}
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
            userId={userId}
            profilePicUrl={profilePicUrl}
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
                username,
                id: userId
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
              <RichText
                theme={theme}
                style={{
                  margin: '0.5rem 0 1rem 0'
                }}
              >
                {content}
              </RichText>
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
