import React from 'react';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import type { BuildReleaseControl } from './hooks/useRelease';

export default function ReleaseButton({
  release,
  disabled = false,
  shiny = false,
  className,
  onClick = release.run
}: {
  release: Pick<BuildReleaseControl, 'action' | 'publishing' | 'run'>;
  disabled?: boolean;
  shiny?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const isDisabled = disabled || release.action.disabled;
  // The app page keeps its compact toolbar style. Workspace and chat retain
  // their existing animated CTA; labels and interaction are shared by both.
  if (className) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={isDisabled}
        aria-busy={release.publishing || undefined}
        title={release.action.label}
      >
        <Icon
          icon={release.publishing ? 'spinner' : 'cloud-upload-alt'}
          pulse={release.publishing}
        />
        <span>{release.action.label}</span>
      </button>
    );
  }
  return (
    <GameCTAButton
      variant="magenta"
      size="md"
      icon="globe"
      shiny={shiny}
      loading={release.publishing}
      disabled={isDisabled}
      onClick={onClick}
    >
      {release.action.label}
    </GameCTAButton>
  );
}
