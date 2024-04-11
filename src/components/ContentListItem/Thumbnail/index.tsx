import React, { useMemo, useState } from 'react';
import { cloudFrontURL } from '~/constants/defaultValues';

export default function Thumbnail({
  className,
  contentType,
  filePath,
  fileName
}: {
  className?: string;
  contentType: string;
  filePath: string;
  fileName?: string;
}) {
  const isDisplayedOnHome = useMemo(
    () => contentType === 'subject' || contentType === 'comment',
    [contentType]
  );
  const src = useMemo(
    () =>
      `${cloudFrontURL}/attachments/${
        isDisplayedOnHome ? 'feed' : contentType
      }/${filePath}/${encodeURIComponent(fileName || '')}`,
    [contentType, fileName, filePath, isDisplayedOnHome]
  );
  const [imageWorks, setImageWorks] = useState(true);

  return (
    <div className={className}>
      {imageWorks ? (
        <img
          loading="lazy"
          src={src}
          rel={fileName}
          onError={() => setImageWorks(false)}
        />
      ) : null}
    </div>
  );
}
