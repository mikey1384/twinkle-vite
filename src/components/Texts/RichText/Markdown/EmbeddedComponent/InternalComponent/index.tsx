import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import MainContentComponent, { LazyProfileAppEmbed } from './MainContentComponent';
import MissionComponent from './MissionComponent';
import UserComponent from './UserComponent';
import DefaultComponent from './DefaultComponent';
import AICardComponent from './AICardComponent';
import SharedPromptComponent from './SharedPromptComponent';
import AchievementUnlockComponent from './AchievementUnlockComponent';
import AchievementComponent from './AchievementComponent';
import type {
  RichTextEmbedPreviewMode,
  RichTextSubjectPreviewVariant
} from '../../../embedPreviewMode';

export default function InternalComponent({
  rootId,
  rootType,
  src,
  buildPreviewVariant,
  commentPreviewMaxTextLines,
  commentPreviewVariant,
  embedPreviewMode,
  isPreview,
  isProfileComponent,
  showProfileApps,
  showCompactCommentTypeLabel = true,
  subjectPreviewVariant,
  theme
}: {
  buildPreviewVariant?: 'compact' | 'wide';
  commentPreviewMaxTextLines?: number;
  commentPreviewVariant?: 'column' | 'compact';
  embedPreviewMode?: RichTextEmbedPreviewMode;
  rootId?: number | string;
  rootType?: string;
  src: string;
  isPreview?: boolean;
  isProfileComponent?: boolean;
  showProfileApps?: boolean;
  showCompactCommentTypeLabel?: boolean;
  subjectPreviewVariant?: RichTextSubjectPreviewVariant;
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
      'daily-reflections',
      'daily-rewards'
    ];
    if (isProfileComponent) {
      // A status message can show its owner's Lumine apps as short cards. Every other profile
      // text (bio bullets, the popup, the chat profile card) has no room for one, and the
      // remaining embed types stay plain links: a profile inside a profile would nest forever.
      if (
        showProfileApps &&
        ['app', 'apps', 'build', 'builds'].includes(linkType) &&
        contentId
      ) {
        return (
          <LazyProfileAppEmbed
            contentId={contentId}
            profileUserId={rootType === 'user' ? Number(rootId) || 0 : 0}
          />
        );
      }
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
          commentPreviewMaxTextLines={commentPreviewMaxTextLines}
          commentPreviewVariant={commentPreviewVariant}
          embedPreviewMode={embedPreviewMode}
          isPreview={isPreview}
          showCompactCommentTypeLabel={showCompactCommentTypeLabel}
          subjectPreviewVariant={subjectPreviewVariant}
          theme={theme}
        />
      );
    }
    if (linkType === 'missions' && contentId) {
      return <MissionComponent src={src} isPreview={isPreview} isChat={rootType === 'chat'} />;
    }
    if (linkType === 'users') {
      return <UserComponent src={src} isPreview={isPreview} isChat={rootType === 'chat'} />;
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
      return <SharedPromptComponent src={src} isPreview={isPreview} isChat={rootType === 'chat'} />;
    }
    if (linkType === 'achievement-unlocks' && contentId) {
      return <AchievementUnlockComponent src={src} isPreview={isPreview} />;
    }
    if (linkType === 'achievements' && contentId) {
      return <AchievementComponent src={src} isPreview={isPreview} />;
    }
    return (
      <DefaultComponent linkType={linkType} src={src} isPreview={isPreview} />
    );
  }, [
    src,
    buildPreviewVariant,
    commentPreviewMaxTextLines,
    commentPreviewVariant,
    embedPreviewMode,
    isProfileComponent,
    showProfileApps,
    isPreview,
    rootId,
    rootType,
    showCompactCommentTypeLabel,
    subjectPreviewVariant,
    theme
  ]);

  return (
    <ErrorBoundary componentPath="Texts/EmbeddedComponent/InternalComponent">
      {InnerComponent}
    </ErrorBoundary>
  );
}
