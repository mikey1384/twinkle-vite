import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { socket } from '~/constants/sockets/api';
import { shouldShowAppReloadBanner } from './helpers/buildRuntimeLand';

// "This app was updated. Reload" (Twinkle.land design section 6). The owner
// asks players to reload after a release (`lumine publish --ask-reload`);
// the server tells every tab that has a world session in the app
// (build_app_updated) and the website, not the app, draws this bar over an
// older version. It works for app code written before it existed.
export const APP_RELOAD_BANNER_TEXT = 'This app was updated. Reload to keep playing with everyone.';

const bannerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(5, 110, 178, 0.2);
  background: #eaf4fd;
  color: #0b3a5c;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }
`;
const textClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.45;
`;
const actionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-shrink: 0;
  @media (max-width: ${mobileMaxWidth}) {
    justify-content: flex-end;
  }
`;
const laterClass = css`
  border: none;
  background: transparent;
  color: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
`;

export function AppReloadBannerView({
  reloading,
  onReload,
  onLater
}: {
  reloading: boolean;
  onReload: () => void;
  onLater: () => void;
}) {
  return (
    <div className={bannerClass} role="status" data-testid="app-reload-banner">
      <div className={textClass}>
        <Icon icon="sync" />
        <span>{APP_RELOAD_BANNER_TEXT}</span>
      </div>
      <div className={actionsClass}>
        <button type="button" className={laterClass} onClick={onLater} disabled={reloading}>
          Not now
        </button>
        <GameCTAButton variant="primary" size="sm" onClick={onReload} disabled={reloading} loading={reloading}>
          {reloading ? 'Reloading…' : 'Reload'}
        </GameCTAButton>
      </div>
    </div>
  );
}

export default function AppReloadBanner({
  buildId,
  mountedArtifactVersionId,
  frameKey
}: {
  buildId: number;
  // The published version this tab runs (null for drafts and previews).
  mountedArtifactVersionId: number | null;
  // Changes when the app frame loads again (then the tab runs the new code).
  frameKey: string | null;
}) {
  const [shownFor, setShownFor] = useState<number | null>(null);
  const [dismissedFor, setDismissedFor] = useState<number | null>(null);
  const [reloading, setReloading] = useState(false);
  // The version the frame was loaded with; the build object can move on
  // to a newer release while the frame still runs the old code.
  const mountedRef = useRef<{ frameKey: string | null; version: number | null }>({
    frameKey,
    version: mountedArtifactVersionId
  });
  if (mountedRef.current.frameKey !== frameKey) {
    mountedRef.current = { frameKey, version: mountedArtifactVersionId };
  }

  useEffect(() => {
    setShownFor(null);
  }, [frameKey]);

  useEffect(() => {
    function handleAppUpdated(event: any) {
      if (
        shouldShowAppReloadBanner({
          event,
          buildId,
          mountedArtifactVersionId: mountedRef.current.version
        })
      ) {
        setShownFor(Number(event.artifactVersionId));
      }
    }
    socket.on('build_app_updated', handleAppUpdated);
    return () => {
      socket.off('build_app_updated', handleAppUpdated);
    };
  }, [buildId]);

  if (!shownFor || dismissedFor === shownFor) return null;
  return (
    <AppReloadBannerView
      reloading={reloading}
      onReload={() => {
        setReloading(true);
        window.location.reload();
      }}
      onLater={() => setDismissedFor(shownFor)}
    />
  );
}
