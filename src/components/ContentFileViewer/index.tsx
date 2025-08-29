import React, { useMemo } from 'react';
import FileInfo from './FileInfo';
import ImagePreview from './ImagePreview';
import MediaPlayer from './MediaPlayer';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';

export default function ContentFileViewer({
  className,
  contentId,
  contentType,
  isSecretAttachment,
  isThumb,
  filePath,
  fileName,
  fileSize,
  userIsUploader,
  onMediaPause = () => null,
  onMediaPlay = () => null,
  style,
  theme,
  thumbHeight,
  thumbUrl,
  videoHeight
}: {
  className?: string;
  contentId?: number;
  contentType: string;
  isSecretAttachment?: boolean;
  isThumb?: boolean;
  filePath: string;
  fileName?: string;
  fileSize?: string | number;
  userIsUploader?: boolean;
  onMediaPause?: () => void;
  onMediaPlay?: () => void;
  style?: React.CSSProperties;
  theme?: string;
  thumbHeight?: string;
  thumbUrl?: string;
  videoHeight?: string;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const {
    link: { color: linkColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
  const isDisplayedOnHome = useMemo(
    () => contentType === 'subject' || contentType === 'comment',
    [contentType]
  );
  const { fileType } = useMemo(
    () => getFileInfoFromFileName(fileName || ''),
    [fileName]
  );
  const src = useMemo(
    () =>
      `${cloudFrontURL}/attachments/${
        isDisplayedOnHome ? 'feed' : contentType
      }/${filePath}/${encodeURIComponent(fileName || '')}`,
    [contentType, fileName, filePath, isDisplayedOnHome]
  );

  return (
    <ErrorBoundary componentPath="ContentFileViewer/index">
      <div
        className={className}
        style={{
          width: '100%',
          padding:
            contentType !== 'chat' &&
            !['image', 'video', 'audio'].includes(fileType)
              ? '1rem'
              : '',
          backgroundColor: isThumb ? Color.whiteGray() : '',
          ...style
        }}
      >
        {fileType === 'image' ? (
          <ErrorBoundary componentPath="ContentFileViewer/ImagePreview">
            <ImagePreview
              isThumb={isThumb}
              userIsUploader={userIsUploader}
              src={src}
              fileName={fileName || ''}
              contentType={contentType}
              contentId={contentId}
              isReplaceable={
                ['subject', 'comment'].includes(contentType) && !isThumb
              }
            />
          </ErrorBoundary>
        ) : fileType === 'video' || (fileType === 'audio' && !isThumb) ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            {!isThumb && (
              <div
                style={{
                  width: '100%',
                  padding: isDisplayedOnHome ? '0 1rem 0 1rem' : ''
                }}
              >
                <div
                  style={{
                    maxWidth: '100%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  <a
                    style={{
                      fontWeight: 'bold',
                      color: Color[linkColor](),
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {fileName}
                  </a>
                </div>
              </div>
            )}
            <ErrorBoundary componentPath="ContentFileViewer/MediaPlayer">
              <MediaPlayer
                contentId={contentId || 0}
                contentType={contentType}
                fileType={fileType}
                isThumb={isThumb || false}
                isSecretAttachment={isSecretAttachment || false}
                onPlay={onMediaPlay}
                onPause={onMediaPause}
                src={src}
                thumbUrl={thumbUrl || ''}
                thumbHeight={thumbHeight}
                videoHeight={videoHeight}
              />
            </ErrorBoundary>
          </div>
        ) : (
          <ErrorBoundary componentPath="ContentFileViewer/FileInfo">
            <FileInfo
              isThumb={isThumb}
              fileName={fileName || ''}
              fileType={fileType}
              fileSize={fileSize || 0}
              theme={theme}
              src={src}
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
}
