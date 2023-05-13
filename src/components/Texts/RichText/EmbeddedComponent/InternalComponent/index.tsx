import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function InternalComponent({ src }: { src: string }) {
  const InnerComponent = useMemo(() => {
    const linkType = src.split('/')[1];
    const normalContentTypes = ['videos', 'links', 'subjects'];
    if (normalContentTypes.includes(linkType)) {
      return (
        <div>
          <div>this is a normal content type {linkType}</div>
        </div>
      );
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
