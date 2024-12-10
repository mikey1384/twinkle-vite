import React, { useMemo, useState } from 'react';
import playButtonImg from '~/assets/play-button-image.png';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color } from '~/constants/css';

export default function Thumbnail({
  className,
  contentType,
  filePath,
  fileName,
  thumbUrl
}: {
  className?: string;
  contentType?: string;
  filePath?: string;
  fileName?: string;
  thumbUrl?: string;
}) {
  const isDisplayedOnHome = useMemo(
    () => contentType === 'subject' || contentType === 'comment',
    [contentType]
  );
  const src = useMemo(
    () =>
      thumbUrl ||
      `${cloudFrontURL}/attachments/${
        isDisplayedOnHome ? 'feed' : contentType
      }/${filePath}/${encodeURIComponent(fileName || '')}`,
    [contentType, fileName, filePath, isDisplayedOnHome, thumbUrl]
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
          <img
            loading="lazy"
            style={{
              width: '35px',
              height: '35px'
            }}
            src={playButtonImg}
            alt="Play"
          />
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
