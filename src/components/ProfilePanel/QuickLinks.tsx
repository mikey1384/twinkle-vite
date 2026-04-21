import React from 'react';
import Icon from '~/components/Icon';
import {
  quickLinkClass,
  quickLinksClass,
  quickLinkThemes
} from './styles';

type QuickLinkTheme =
  (typeof quickLinkThemes)[keyof typeof quickLinkThemes];

export default function QuickLinks({
  cardsEnabled,
  onOpenCards,
  website,
  youtubeUrl
}: {
  cardsEnabled: boolean;
  onOpenCards: () => void;
  website?: string;
  youtubeUrl?: string;
}) {
  return (
    <div className={quickLinksClass}>
      <div
        className={quickLinkClass}
        style={getQuickLinkStyle(quickLinkThemes.aiCards, {
          opacity: cardsEnabled ? 1 : 0.55,
          pointerEvents: cardsEnabled ? 'auto' : 'none'
        })}
        onClick={onOpenCards}
      >
        <Icon icon="cards-blank" />
        <span>AI Cards</span>
      </div>
      {website ? (
        <div
          className={quickLinkClass}
          style={getQuickLinkStyle(quickLinkThemes.website)}
          onClick={() => handleExternalLink(website)}
        >
          <Icon icon="globe" />
          <span>Website</span>
        </div>
      ) : null}
      {youtubeUrl ? (
        <div
          className={quickLinkClass}
          style={getQuickLinkStyle(quickLinkThemes.youtube)}
          onClick={() => handleExternalLink(youtubeUrl)}
        >
          <Icon icon={['fab', 'youtube']} />
          <span>YouTube</span>
        </div>
      ) : null}
    </div>
  );

  function handleExternalLink(url: string) {
    window.open(url);
  }
}

function getQuickLinkStyle(
  theme: QuickLinkTheme,
  extraStyle?: React.CSSProperties
) {
  return {
    ['--quick-link-bg' as const]: theme.background,
    ['--quick-link-fg' as const]: theme.text,
    ['--quick-link-shadow' as const]: theme.shadow,
    ['--quick-link-border' as const]: theme.border,
    ['--quick-link-bg-hover' as const]: theme.fillBg,
    ['--quick-link-fg-hover' as const]: theme.fillFg,
    ['--quick-link-border-hover' as const]: theme.fillBorder,
    ['--quick-link-icon-color' as const]: theme.icon,
    ['--quick-link-icon-color-hover' as const]: theme.fillIcon,
    ...extraStyle
  } as React.CSSProperties;
}
