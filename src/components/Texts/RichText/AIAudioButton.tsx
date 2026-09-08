import React, { memo, useId } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import useVoicePlayback from './useVoicePlayback';

function AIAudioButton({ text, voice, contentKey, chat = false }: {
  text: string;
  voice?: string;
  contentKey: string;
  chat?: boolean;
}) {
  const audio = useVoicePlayback({ text, voice, contentKey });
  const noticeId = useId();
  const label = audio.preparing ? 'Preparing voice audio'
    : audio.playing ? 'Pause voice audio'
    : audio.error ? 'Retry voice audio'
    : audio.ended ? 'Replay voice audio'
    : audio.prepared ? 'Play voice audio' : 'Read message aloud';
  const caption = audio.preparing ? 'Preparing…' : audio.playing ? 'Pause'
    : audio.error ? 'Retry' : audio.ended ? 'Replay' : 'Listen';
  const controls = (
    <>
      <Button
        className={chat ? chatFocusClass : undefined}
        aria-label={label}
        aria-describedby={audio.error || audio.hint ? noticeId : undefined}
        aria-busy={audio.preparing}
        disabled={!text.trim()}
        variant="soft" tone="raised" uppercase={false}
        onClick={audio.playOrPause}
        style={chat ? chatControlStyle : { padding: '0.5rem 0.7rem', lineHeight: 1 }}
        color={audio.error ? 'redOrange' : audio.prepared ? 'logoBlue' : 'darkerGray'}>
        <Icon icon={audio.preparing ? 'spinner' : audio.playing ? 'pause' : 'volume'} pulse={audio.preparing} />
        {chat && <span>{caption}</span>}
      </Button>
      {audio.downloadUrl && (
        <Button aria-label="Download voice audio" variant="soft" tone="raised" className={chat ? chatFocusClass : undefined}
          style={chat ? { ...chatControlStyle, padding: 10 } : { padding: '0.5rem 0.7rem', lineHeight: 1 }}
          onClick={handleDownloadClick} color="darkerGray">
          <Icon icon="download" />
        </Button>
      )}
      {audio.preparing && <span className={chat ? hiddenStatusClass : undefined} role="status">Preparing voice audio…</span>}
      {(audio.error || audio.hint) && (
        <span id={noticeId} className="voice-notice" role={audio.error ? 'alert' : 'status'}
          style={{ color: audio.error ? '#9f2737' : '#526176', fontSize: chat ? 13 : 12, lineHeight: 1.5, overflowWrap: 'anywhere', ...(chat ? { flexBasis: '100%', textAlign: 'right' } as const : {}) }}>
          {audio.error || audio.hint}
        </span>
      )}
    </>
  );
  // Chat's parent owns one wrapping toolbar row and full-width notices. Keeping
  // the controls as siblings prevents a long error from pushing Copy above them.
  if (chat) return controls;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>{controls}</span>;

  function handleDownloadClick() {
    if (!audio.downloadUrl) return;
    const link = document.createElement('a');
    link.href = audio.downloadUrl;
    link.download = `${contentKey}.mp3`;
    try {
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
    }
  }
}

const chatControlStyle: React.CSSProperties = {
  minHeight: 44, minWidth: 44, borderRadius: 12, padding: '10px 12px',
  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: '#334155'
};
const chatFocusClass = css`
  &:focus-visible { outline-color: #334155; }
`;
const hiddenStatusClass = css`
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
`;

export default memo(AIAudioButton);
