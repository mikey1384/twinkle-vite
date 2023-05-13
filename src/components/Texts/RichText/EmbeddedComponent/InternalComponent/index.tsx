import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import MainContentType from './MainContentType';

export default function InternalComponent({ src }: { src: string }) {
  const InnerComponent = useMemo(() => {
    const urlParts = src.split('/');
    const linkType = urlParts[1];
    const mainContentTypes = ['videos', 'links', 'subjects'];
    if (mainContentTypes.includes(linkType)) {
      const contentId = urlParts[2]?.split('?')[0];
      const contentType = linkType.slice(0, -1);
      return (
        <MainContentType contentType={contentType} contentId={contentId} />
      ); // Passed contentId here
    }
    return (
      <div>
        <div>this is a special content type {linkType}</div>
      </div>
    );
  }, [src]);

  return (
    <ErrorBoundary componentPath="Texts/EmbeddedComponent/InternalComponent">
      {InnerComponent}
    </ErrorBoundary>
  );
}
