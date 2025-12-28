import React, { useMemo } from 'react';
import ExtractedThumb from '~/components/ExtractedThumb';
import Image from '~/components/Image';
import FileIcon from '~/components/FileIcon';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color } from '~/constants/css';

export default function FileInfo({
  fileType,
  fileName,
  filePath,
  thumbUrl
}: {
  fileName: string;
  fileType: string;
  filePath: string;
  thumbUrl: string;
}) {
  const fileUrl = useMemo(() => {
    if (!filePath || !fileName) return '';
    if (filePath.startsWith('ai-generated/')) {
      return `${cloudFrontURL}/attachments/${filePath}/${encodeURIComponent(
        fileName
      )}`;
    }
    return `${cloudFrontURL}/attachments/chat/${filePath}/${encodeURIComponent(
      fileName
    )}`;
  }, [fileName, filePath]);

  const isMediaType = fileType === 'image' || fileType === 'video';

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        width: ${isMediaType ? '12rem' : 'auto'};
      `}
    >
      {fileType === 'image' ? (
        <Image imageUrl={fileUrl} />
      ) : fileType === 'video' ? (
        <ExtractedThumb
          src={fileUrl}
          style={{ width: '100%', height: '7rem' }}
          thumbUrl={thumbUrl}
        />
      ) : (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          className={css`
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            cursor: pointer;
            color: inherit;
          `}
        >
          <span className={css`color: ${Color.darkerGray()};`}>
            <FileIcon size="5x" fileType={fileType} />
          </span>
          <span
            className={css`
              position: absolute;
              font-size: 0.8rem;
              font-weight: bold;
              color: #fff;
              text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
              text-decoration: none;
              &:hover {
                text-decoration: underline;
              }
            `}
          >
            Download
          </span>
        </a>
      )}
    </div>
  );
}
