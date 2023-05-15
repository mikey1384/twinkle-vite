import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import MainContentComponent from './MainContentComponent';
import MissionComponent from './MissionComponent';
import UserComponent from './UserComponent';
import DefaultComponent from './DefaultComponent';

export default function InternalComponent({ src }: { src: string }) {
  const InnerComponent = useMemo(() => {
    const urlParts = src.split('/');
    const linkType = urlParts[1];
    const contentId = urlParts[2]?.split('?')?.[0];
    const mainContentTypes = ['videos', 'links', 'subjects'];
    if (mainContentTypes.includes(linkType) && contentId) {
      const contentType = linkType.slice(0, -1);
      return (
        <MainContentComponent contentType={contentType} contentId={contentId} />
      );
    }
    if (linkType === 'missions' && contentId) {
      return <MissionComponent src={src} />;
    }
    if (linkType === 'users') {
      return <UserComponent src={src} />;
    }
    return <DefaultComponent linkType={linkType} />;
  }, [src]);

  return (
    <ErrorBoundary componentPath="Texts/EmbeddedComponent/InternalComponent">
      {InnerComponent}
    </ErrorBoundary>
  );
}
