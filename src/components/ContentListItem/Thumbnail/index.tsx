import React, { useMemo } from 'react';
import Image from './Image';
import ErrorBoundary from '~/components/ErrorBoundary';
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

  return (
    <ErrorBoundary componentPath="ContentFileViewer/index">
      <div className={className}>
        <Image src={src} fileName={fileName || ''} />
      </div>
    </ErrorBoundary>
  );
}
