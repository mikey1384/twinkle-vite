import React, { useMemo, useState } from 'react';
import FileInfo from './FileInfo';
import ImagePreview from './ImagePreview';
import MediaPlayer from './MediaPlayer';
import { Color, mobileMaxWidth } from '~/constants/css';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { cloudFrontURL } from '~/constants/defaultValues';
import { css } from '@emotion/css';

export default function FileAttachment({
  messageId,
  fileName,
  filePath,
  fileSize,
  thumbUrl
}: {
  messageId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  thumbUrl: string;
}) {
  const isImageOrVideo = useMemo(
    () =>
      getFileInfoFromFileName(fileName)?.fileType === 'image' ||
      getFileInfoFromFileName(fileName)?.fileType === 'video',
    [fileName]
  );
  const { fileType } = useMemo(
    () => getFileInfoFromFileName(fileName),
    [fileName]
  );
  const src = useMemo(
    () =>
      `${cloudFrontURL}/attachments/chat/${filePath}/${encodeURIComponent(
        fileName
      )}`,
    [fileName, filePath]
  );
  const [imageWorks, setImageWorks] = useState(true);

  return (
    <div
      className={css`
        margin-top: 1rem;
        width: 100%;
        min-height: 9rem;
        height: ${isImageOrVideo && imageWorks ? '41rem' : 'auto'};
        @media (max-width: ${mobileMaxWidth}) {
          min-height: 8rem;
          height: ${isImageOrVideo && imageWorks ? '23rem' : 'auto'};
        }
      `}
    >
      {fileType === 'image' ? (
        imageWorks ? (
          <ImagePreview
            src={src}
            fileName={fileName}
            onSetImageWorks={setImageWorks}
          />
        ) : (
          <FileInfo
            fileName={fileName}
            fileType={fileType}
            fileSize={fileSize}
            src={src}
          />
        )
      ) : fileType === 'video' || fileType === 'audio' ? (
        <div
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <div
            style={{
              width: '100%',
              height: 'auto'
            }}
          >
            <a
              style={{
                width: '100%',
                fontWeight: 'bold',
                color: Color.logoBlue(),
                overflow: 'hidden',
                display: '-webkit-box',
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
          <MediaPlayer
            messageId={messageId}
            fileType={fileType}
            src={src}
            thumbUrl={thumbUrl}
          />
        </div>
      ) : (
        <FileInfo
          fileName={fileName}
          fileType={fileType}
          fileSize={fileSize}
          src={src}
        />
      )}
    </div>
  );
}
