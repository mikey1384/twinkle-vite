import React from 'react';
import ContentFileViewer from '~/components/ContentFileViewer';
import LoginToViewContent from '~/components/LoginToViewContent';

interface Props {
  contentType: string;
  filePath: string;
  secretHidden?: boolean;
  userId: number;
  theme: string;
  contentId: number;
  fileName: string;
  fileSize: number;
  thumbUrl: string;
  byUser: boolean;
  fileType: string;
  rewardLevel: number;
  onSetMediaStarted: (v: {
    contentType: string;
    contentId: number;
    started: boolean;
  }) => void;
}
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
}: Props) {
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
