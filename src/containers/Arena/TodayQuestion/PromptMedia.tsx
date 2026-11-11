import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import PaperDiagram from '../PaperDiagram';
import { arenaMediaURL } from '../media';
import type { Prompt, PromptVisual } from './types';

export type MediaStatus = 'loading' | 'ready' | 'failed';

export function PromptPicture({ visual, retry = 0, onStatus }: {
  visual: PromptVisual; retry?: number; onStatus?: (status: MediaStatus) => void
}) {
  return <div className={pictureCls}>{visual.kind === 'diagram'
    ? <PaperDiagram visual={visual} />
    : <img key={`${visual.src}:${retry}`} src={arenaMediaURL(visual.src)} alt={visual.alt}
      onLoad={() => onStatus?.('ready')} onError={() => onStatus?.('failed')} />}</div>;
}

export default function PromptMedia({ audio, onStatus }: {
  audio: NonNullable<Prompt['audio']>; onStatus?: (status: MediaStatus) => void
}) {
  const player = useRef<HTMLAudioElement>(null);
  const labelId = useId();
  const [failed, setFailed] = useState(false);
  const src = arenaMediaURL(audio.src);

  useEffect(() => {
    const element = player.current;
    setFailed(false);
    return () => {
      // A question/check switch must not leave the previous recording playing.
      element?.pause();
    };
  }, [src]);

  return <div className={audioCls}>
    <span id={labelId}>{audio.label}</span>
    <audio ref={player} key={src} src={src} controls preload="none" aria-labelledby={labelId}
      onError={() => { setFailed(true); onStatus?.('failed'); }}
      onLoadedData={() => { setFailed(false); onStatus?.('ready'); }} />
    {failed && <div role="alert">The recording could not load. <button type="button" onClick={() => {
      setFailed(false);
      onStatus?.('loading');
      player.current?.load();
    }}>Try again</button></div>}
  </div>;
}

const pictureCls = css`
  width: 100%; min-width: 0; margin: 0.8rem 0;
  img { display: block; max-width: 100%; max-height: 28rem; height: auto; margin: 0 auto; object-fit: contain; }
  svg { max-width: 100%; height: auto; }
`;
const audioCls = css`
  display: grid; gap: 0.6rem; margin: 1rem 0;
  audio { display: block; width: 100%; max-width: 100%; }
  button { font: inherit; padding: 0.5rem 0.8rem; cursor: pointer; }
`;
