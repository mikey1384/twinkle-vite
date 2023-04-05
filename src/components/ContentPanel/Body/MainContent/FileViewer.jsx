import PropTypes from 'prop-types';
import ContentFileViewer from '~/components/ContentFileViewer';
import LoginToViewContent from '~/components/LoginToViewContent';

FileViewer.propTypes = {
  contentType: PropTypes.string.isRequired,
  filePath: PropTypes.string,
  secretHidden: PropTypes.bool,
  userId: PropTypes.number,
  theme: PropTypes.string,
  contentId: PropTypes.number.isRequired,
  fileName: PropTypes.string,
  fileSize: PropTypes.string,
  thumbUrl: PropTypes.string,
  byUser: PropTypes.bool,
  fileType: PropTypes.string,
  rewardLevel: PropTypes.number,
  onSetMediaStarted: PropTypes.func.isRequired
};

export default function FileViewer({
  contentType,
  filePath,
  secretHidden,
  userId,
  theme,
  contentId,
  fileName,
  fileSize,
  thumbUrl,
  byUser,
  fileType,
  rewardLevel,
  onSetMediaStarted
}) {
  if (
    (contentType !== 'subject' && contentType !== 'comment') ||
    !filePath ||
    (contentType === 'comment' && secretHidden)
  )
    return null;
  if (!userId) return <LoginToViewContent />;
  return (
    <ContentFileViewer
      theme={theme}
      contentId={contentId}
      contentType={contentType}
      fileName={fileName}
      filePath={filePath}
      fileSize={fileSize}
      thumbUrl={thumbUrl}
      onMediaPause={() =>
        onSetMediaStarted({ contentType, contentId, started: false })
      }
      onMediaPlay={() =>
        onSetMediaStarted({ contentType, contentId, started: true })
      }
      videoHeight="100%"
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: byUser ? '1.7rem' : '1rem',
        ...(fileType === 'audio'
          ? {
              padding: '1rem'
            }
          : {}),
        marginBottom: rewardLevel ? '1.5rem' : 0
      }}
    />
  );
}
