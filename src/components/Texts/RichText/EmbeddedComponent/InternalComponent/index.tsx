import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import MainContentComponent from './MainContentComponent';
import MissionComponent from './MissionComponent';
import UserComponent from './UserComponent';
import DefaultComponent from './DefaultComponent';
import AICardComponent from './AICardComponent';

export default function InternalComponent({
  src,
  isProfileComponent
}: {
  src: string;
  isProfileComponent?: boolean;
}) {
  const InnerComponent = useMemo(() => {
    const urlParts = src.split('/');
    const linkType = urlParts[1];
    const linkSubType = urlParts[2];
    const contentId = linkSubType?.split('?')?.[0];
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
    if (linkType === 'users' && !isProfileComponent) {
      return <UserComponent src={src} />;
    }
    if (
      linkType === 'ai-cards' ||
      (linkType === 'chat' && linkSubType === 'ai-cards')
    ) {
      return <AICardComponent src={src} />;
    }
    return <DefaultComponent linkType={linkType} src={src} />;
  }, [isProfileComponent, src]);

  return (
    <ErrorBoundary componentPath="Texts/EmbeddedComponent/InternalComponent">
      {InnerComponent}
    </ErrorBoundary>
  );
}
