import React, { useMemo, useState } from 'react';
import PlayButton from '~/components/PlayButton';
import { Color } from '~/constants/css';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { buildAttachmentUrl } from '~/helpers/attachmentHelpers';

export default function Thumbnail({
  className,
  contentType,
  filePath,
  fileName,
  thumbUrl,
  playButtonShown = true
}: {
  className?: string;
  contentType?: string;
  filePath?: string;
  fileName?: string;
  thumbUrl?: string;
  playButtonShown?: boolean;
}) {
  const isVideo = useMemo(() => {
    const { fileType } = getFileInfoFromFileName(fileName || '');
    return fileType === 'video';
  }, [fileName]);
  const src = useMemo(
    () =>
      thumbUrl ||
      buildAttachmentUrl({
        filePath,
        fileName,
        contentType: contentType || ''
      }),
    [contentType, fileName, filePath, thumbUrl]
  );
  const [imageWorks, setImageWorks] = useState(true);

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%' }}
      className={className}
    >
      {thumbUrl ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
            backgroundImage: `url(${thumbUrl})`,
            backgroundColor: '#fff',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {playButtonShown && isVideo && <PlayButton size="35px" />}
        </div>
      ) : (
        <>
          {imageWorks ? (
            <img
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: Color.whiteGray()
              }}
              loading="lazy"
              src={src}
              rel={fileName}
              onError={() => setImageWorks(false)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
