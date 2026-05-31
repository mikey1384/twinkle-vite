import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import MainContentComponent from './MainContentComponent';
import MissionComponent from './MissionComponent';
import UserComponent from './UserComponent';
import DefaultComponent from './DefaultComponent';
import AICardComponent from './AICardComponent';
import SharedPromptComponent from './SharedPromptComponent';
import AchievementUnlockComponent from './AchievementUnlockComponent';

export default function InternalComponent({
  rootId,
  rootType,
  src,
  buildPreviewVariant,
  isPreview,
  isProfileComponent,
  showCompactCommentTypeLabel = true,
  theme
}: {
  buildPreviewVariant?: 'compact' | 'wide';
  rootId?: number | string;
  rootType?: string;
  src: string;
  isPreview?: boolean;
  isProfileComponent?: boolean;
  showCompactCommentTypeLabel?: boolean;
  theme?: string;
}) {
  const InnerComponent = useMemo(() => {
    const urlParts = src.split('/');
    const linkType = urlParts[1];
    const linkSubType = urlParts[2];
    const contentId = linkSubType?.split('?')?.[0];
    const mainContentTypes = [
      'videos',
      'links',
      'subjects',
      'comments',
      'ai-stories',
      'daily-reflections'
    ];
    if (isProfileComponent) {
      return (
        <DefaultComponent linkType={linkType} src={src} isPreview={isPreview} />
      );
    }
    if (['app', 'apps', 'build', 'builds'].includes(linkType) && contentId) {
      return (
        <MainContentComponent
          contentType="build"
          contentId={contentId}
          buildPreviewVariant={buildPreviewVariant}
          isPreview={isPreview}
          showCompactCommentTypeLabel={showCompactCommentTypeLabel}
          theme={theme}
        />
      );
    }
    if (mainContentTypes.includes(linkType) && contentId) {
      const contentType = linkType.slice(0, -1);
      return (
        <MainContentComponent
          contentType={contentType}
          contentId={contentId}
          isPreview={isPreview}
          showCompactCommentTypeLabel={showCompactCommentTypeLabel}
          theme={theme}
        />
      );
    }
    if (linkType === 'missions' && contentId) {
      return <MissionComponent src={src} isPreview={isPreview} />;
    }
    if (linkType === 'users') {
      return <UserComponent src={src} isPreview={isPreview} />;
    }
    if (
      (linkType === 'ai-cards' ||
        (linkType === 'chat' && linkSubType === 'ai-cards')) &&
      rootType !== 'user'
    ) {
      return (
        <AICardComponent
          rootId={rootId}
          rootType={rootType}
          isPreview={isPreview}
          src={src}
        />
      );
    }
    if (linkType === 'shared-prompts') {
      return <SharedPromptComponent src={src} isPreview={isPreview} />;
    }
    if (linkType === 'achievement-unlocks' && contentId) {
      return <AchievementUnlockComponent src={src} isPreview={isPreview} />;
    }
    return (
      <DefaultComponent linkType={linkType} src={src} isPreview={isPreview} />
    );
  }, [
    src,
    buildPreviewVariant,
    isProfileComponent,
    isPreview,
    rootId,
    rootType,
    showCompactCommentTypeLabel,
    theme
  ]);

  return (
    <ErrorBoundary componentPath="Texts/EmbeddedComponent/InternalComponent">
      {InnerComponent}
    </ErrorBoundary>
  );
}
