import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import DropdownButton from '~/components/Buttons/DropdownButton';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import EditTextArea from '~/components/Texts/EditTextArea';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import LongText from '~/components/Texts/LongText';
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

Comment.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.number,
    content: PropTypes.string,
    filePath: PropTypes.string,
    fileName: PropTypes.string,
    fileSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    thumbUrl: PropTypes.string,
    timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onEditDone: PropTypes.func.isRequired,
  profilePicUrl: PropTypes.string,
  theme: PropTypes.string,
  userId: PropTypes.number,
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
      style={{
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        paddingTop: '1rem',
        padding: '1rem 1rem 0 1rem'
      }}
    >
      {!isEditing && (
        <div
          style={{
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'row-reverse'
          }}
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
      <div style={{ display: 'flex', width: '100%' }}>
        <div>
          <ProfilePic
            style={{ width: '5rem' }}
            userId={userId}
            profilePicUrl={profilePicUrl}
          />
        </div>
        <div style={{ width: '90%', marginLeft: '2%' }}>
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
            <div style={{ paddingLeft: '0px' }}>
              <LongText
                theme={theme}
                style={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  margin: '0.5rem 0 1rem 0'
                }}
              >
                {content}
              </LongText>
              {filePath &&
                (userId ? (
                  <div style={{ width: '100%' }}>
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

  async function handleEditComment(editedComment) {
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
  }
}

export default memo(Comment);
