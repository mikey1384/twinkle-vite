import React, { useContext, useEffect, useMemo, useState } from 'react';
import LocalContext from '../../../Context';
import FileInfo from './FileInfo';
import ImagePreview from './ImagePreview';
import MediaPlayer from './MediaPlayer';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { cloudFrontURL } from '~/constants/defaultValues';
import { getThemeRoles, ThemeName } from '~/theme/themes';

export default function FileAttachment({
  messageId,
  fileName,
  filePath,
  fileSize,
  theme,
  thumbUrl
}: {
  messageId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  theme: string;
  thumbUrl: string;
}) {
  const {
    actions: { onSetMediaStarted }
  } = useContext(LocalContext);
  const themeName = useMemo<ThemeName>(() => (theme as ThemeName), [theme]);
  const linkColor = useMemo(() => {
    const role = getThemeRoles(themeName).link;
    const key = role?.color || 'logoBlue';
    const opacity = role?.opacity;
    const fn = Color[key as keyof typeof Color];
    return fn
      ? typeof opacity === 'number'
        ? fn(opacity)
        : fn()
      : key;
  }, [themeName]);
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

  useEffect(() => {
    return function cleanUp() {
      onSetMediaStarted({
        contentType: 'chat',
        contentId: messageId,
        started: false
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                color: linkColor,
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
            onPlay={() =>
              onSetMediaStarted({
                contentType: 'chat',
                contentId: messageId,
                started: true
              })
            }
            onPause={() =>
              onSetMediaStarted({
                contentType: 'chat',
                contentId: messageId,
                started: false
              })
            }
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
          theme={theme}
        />
      )}
    </div>
  );
}
