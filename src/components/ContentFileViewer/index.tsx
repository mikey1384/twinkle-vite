import React, { useMemo } from 'react';
import FileInfo from './FileInfo';
import ImagePreview from './ImagePreview';
import MediaPlayer from './MediaPlayer';
import { Color } from '~/constants/css';
import { useTheme } from '~/helpers/hooks';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';

interface Props {
  contentId?: number;
  contentType: string;
  isSecretAttachment?: boolean;
  isThumb?: boolean;
  filePath: string;
  fileName: string;
  fileSize: number;
  modalOverModal?: boolean;
  onMediaPause?: () => void;
  onMediaPlay?: () => void;
  style?: React.CSSProperties;
  theme?: string;
  thumbHeight?: string;
  thumbUrl?: string;
  videoHeight?: string;
}
export default function ContentFileViewer({
  contentId,
  contentType,
  isSecretAttachment,
  isThumb,
  filePath,
  fileName,
  fileSize,
  modalOverModal,
  onMediaPause = () => {},
  onMediaPlay = () => {},
  style,
  theme,
  thumbHeight,
  thumbUrl,
  videoHeight
}: Props) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor }
  } = useTheme(theme || profileTheme);
  const isDisplayedOnHome = useMemo(
    () => contentType === 'subject' || contentType === 'comment',
    [contentType]
  );
  const { fileType } = useMemo(
    () => getFileInfoFromFileName(fileName),
    [fileName]
  );
  const src = useMemo(
    () =>
      `${cloudFrontURL}/attachments/${
        isDisplayedOnHome ? 'feed' : contentType
      }/${filePath}/${encodeURIComponent(fileName)}`,
    [contentType, fileName, filePath, isDisplayedOnHome]
  );

  return (
    <div
      style={{
        width: '100%',
        padding:
          contentType !== 'chat' &&
          !isThumb &&
          !['image', 'video', 'audio'].includes(fileType)
            ? '1rem'
            : '',
        ...style
      }}
    >
      {fileType === 'image' ? (
        <ImagePreview
          isThumb={isThumb}
          modalOverModal={modalOverModal}
          src={src}
          fileName={fileName}
        />
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
          <MediaPlayer
            contentId={contentId}
            contentType={contentType}
            fileType={fileType}
            isThumb={isThumb}
            isSecretAttachment={isSecretAttachment}
            onPlay={onMediaPlay}
            onPause={onMediaPause}
            src={src}
            thumbUrl={thumbUrl}
            thumbHeight={thumbHeight}
            videoHeight={videoHeight}
          />
        </div>
      ) : (
        <FileInfo
          isThumb={isThumb}
          fileName={fileName}
          fileType={fileType}
          fileSize={fileSize}
          theme={theme}
          src={src}
        />
      )}
    </div>
  );
}
