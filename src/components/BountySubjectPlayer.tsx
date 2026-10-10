import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { BUILD_APP_IFRAME_ALLOW } from '~/helpers/buildIframePermissions';

// Plays a bounty's song right on Home: the app's own share page for that
// song, embedded the same way a Build post embeds its app (/app/<id>/<path>
// ?embedded=1, the published runtime and its sandbox). Mounted only after a
// tap, so a feed full of listening cards loads nothing extra; Close unmounts
// it, which stops the audio.
export default function BountySubjectPlayer({
  src,
  title,
  appTitle,
  onClose
}: {
  src: string;
  title: string;
  appTitle: string;
  onClose: () => void;
}) {
  const [ready, setReady] = useState(false);

  return (
    <div
      className={playerClass}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="bounty-player__bar">
        <Icon icon="volume" />
        <span className="bounty-player__title" title={title}>
          {title}
        </span>
        <Button
          color="darkerGray"
          variant="ghost"
          size="sm"
          uppercase={false}
          aria-label="Close player"
          onClick={handleClose}
        >
          <Icon icon="times" />
          <span style={{ marginLeft: '0.5rem' }}>Close</span>
        </Button>
      </div>
      <div className="bounty-player__frame">
        {!ready ? (
          <div className="bounty-player__loading">
            <Icon icon="spinner" pulse />
            <span>Opening the song…</span>
          </div>
        ) : null}
        <iframe
          src={src}
          title={`${title} in ${appTitle}`}
          allow={BUILD_APP_IFRAME_ALLOW}
          onLoad={() => setReady(true)}
          style={{ opacity: ready ? 1 : 0 }}
        />
      </div>
    </div>
  );

  function handleClose(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.stopPropagation();
    onClose();
  }
}

const playerClass = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 0.8rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  overflow: hidden;
  background: #fff;
  cursor: default;

  .bounty-player__bar {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-width: 0;
    padding: 0.4rem 0.4rem 0.4rem 1rem;
    border-bottom: 1px solid var(--ui-border);
    color: ${Color.darkerGray()};
    font-size: max(1.3rem, 13px);
    font-weight: 700;
  }

  .bounty-player__title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bounty-player__frame {
    position: relative;
    width: 100%;
    height: 44rem;
    background: #fafbff;
    @media (max-width: ${mobileMaxWidth}) {
      height: 40rem;
    }
  }

  .bounty-player__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.7rem;
    color: ${Color.darkGray()};
    font-size: max(1.3rem, 13px);
    font-weight: 700;
  }

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
    transition: opacity 0.18s ease;
  }
`;
