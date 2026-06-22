import React, { memo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

export interface PlayerController {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void; // 0 - 1
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const controlButtonClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  padding: 0;
  border: none;
  background: none;
  color: #fff;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.15s ease, transform 0.15s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
  }
`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(totalSeconds: number) {
  if (!isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function VideoControls({
  controller,
  playing,
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  playbackRate,
  visible,
  isFullscreen,
  showCinema,
  isCinema,
  onToggleCinema,
  showFullscreen,
  onToggleFullscreen,
  accentColor = Color.logoBlue()
}: {
  controller: PlayerController;
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  visible: boolean;
  isFullscreen: boolean;
  showCinema?: boolean;
  isCinema?: boolean;
  onToggleCinema?: () => void;
  showFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  accentColor?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubFraction, setScrubFraction] = useState(0);
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);
  const [speedOpen, setSpeedOpen] = useState(false);

  const playedFraction =
    scrubbing && duration
      ? scrubFraction
      : duration
      ? clamp(currentTime / duration, 0, 1)
      : 0;
  const bufferedFraction = duration ? clamp(buffered / duration, 0, 1) : 0;
  const effectiveVolume = muted ? 0 : volume;

  return (
    <div
      className={`video-controls ${css`
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 4;
        padding: 0.4rem 1rem 0.6rem;
        background: rgba(0, 0, 0, 0.55);
        color: #fff;
        opacity: ${visible || speedOpen ? 1 : 0};
        transform: translateY(${visible || speedOpen ? '0' : '0.4rem'});
        transition: opacity 0.18s ease, transform 0.18s ease;
        pointer-events: ${visible || speedOpen ? 'auto' : 'none'};
        user-select: none;
      `}`}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Seek bar */}
      <div
        ref={trackRef}
        className={css`
          position: relative;
          height: 1.6rem;
          display: flex;
          align-items: center;
          cursor: pointer;
          touch-action: none;
        `}
        onPointerDown={handleScrubPointerDown}
        onPointerMove={handleScrubPointerMove}
        onPointerUp={handleScrubPointerUp}
        onPointerLeave={() => setHoverFraction(null)}
      >
        <div
          className={css`
            position: relative;
            width: 100%;
            height: 0.45rem;
            border-radius: 0.45rem;
            background: rgba(255, 255, 255, 0.25);
            overflow: visible;
          `}
        >
          <div
            style={{ width: `${bufferedFraction * 100}%` }}
            className={css`
              position: absolute;
              top: 0;
              left: 0;
              height: 100%;
              border-radius: 0.45rem;
              background: rgba(255, 255, 255, 0.45);
            `}
          />
          {hoverFraction !== null && !scrubbing && (
            <div
              style={{ width: `${hoverFraction * 100}%` }}
              className={css`
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                border-radius: 0.45rem;
                background: rgba(255, 255, 255, 0.35);
              `}
            />
          )}
          <div
            style={{ width: `${playedFraction * 100}%`, background: accentColor }}
            className={css`
              position: absolute;
              top: 0;
              left: 0;
              height: 100%;
              border-radius: 0.45rem;
            `}
          />
          <div
            style={{
              left: `${playedFraction * 100}%`,
              background: accentColor,
              opacity: scrubbing ? 1 : undefined
            }}
            className={`video-controls__thumb ${css`
              position: absolute;
              top: 50%;
              width: 1.3rem;
              height: 1.3rem;
              border-radius: 50%;
              transform: translate(-50%, -50%);
              box-shadow: 0 0 0.4rem rgba(0, 0, 0, 0.5);
            `}`}
          />
        </div>
      </div>

      {/* Button row */}
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin-top: 0.2rem;
        `}
      >
        <button
          type="button"
          aria-label={playing ? 'Pause' : 'Play'}
          className={controlButtonClass}
          onClick={() => (playing ? controller.pause() : controller.play())}
        >
          <Icon icon={playing ? 'pause' : 'play'} />
        </button>

        {/* Volume */}
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.4rem;
            &:hover .video-controls__volume-slider {
              width: 6rem;
              opacity: 1;
            }
          `}
        >
          <button
            type="button"
            aria-label={effectiveVolume === 0 ? 'Unmute' : 'Mute'}
            className={controlButtonClass}
            onClick={() => controller.toggleMute()}
          >
            <Icon icon={effectiveVolume === 0 ? 'volume-mute' : 'volume'} />
          </button>
          <div
            className={`video-controls__volume-slider ${css`
              width: 0;
              opacity: 0;
              overflow: hidden;
              transition: width 0.2s ease, opacity 0.2s ease;
            `}`}
          >
            <div
              className={css`
                position: relative;
                height: 1.4rem;
                display: flex;
                align-items: center;
                cursor: pointer;
                touch-action: none;
              `}
              onPointerDown={handleVolumePointerDown}
              onPointerMove={handleVolumePointerMove}
              onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
            >
              <div
                className={css`
                  position: relative;
                  width: 6rem;
                  height: 0.4rem;
                  border-radius: 0.4rem;
                  background: rgba(255, 255, 255, 0.3);
                `}
              >
                <div
                  style={{
                    width: `${effectiveVolume * 100}%`,
                    background: accentColor
                  }}
                  className={css`
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    border-radius: 0.4rem;
                  `}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={css`
            font-size: 1.1rem;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          `}
        >
          {formatTime(scrubbing ? scrubFraction * duration : currentTime)}
          <span
            className={css`
              opacity: 0.7;
            `}
          >
            {' / '}
            {formatTime(duration)}
          </span>
        </div>

        <div
          className={css`
            flex: 1;
          `}
        />

        {/* Playback speed */}
        <div
          className={css`
            position: relative;
          `}
        >
          <button
            type="button"
            aria-label="Playback speed"
            className={cx(
              controlButtonClass,
              css`
                width: auto;
                padding: 0 0.6rem;
                font-size: 1.1rem;
                font-weight: 600;
              `
            )}
            onClick={() => setSpeedOpen((open) => !open)}
          >
            {playbackRate}&times;
          </button>
          {speedOpen && (
            <div
              className={css`
                position: absolute;
                bottom: 3.4rem;
                right: 0;
                background: rgba(0, 0, 0, 0.9);
                border-radius: 0.6rem;
                padding: 0.4rem 0;
                min-width: 6rem;
                box-shadow: 0 0.4rem 1.2rem rgba(0, 0, 0, 0.5);
              `}
            >
              {PLAYBACK_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={css`
                    display: block;
                    width: 100%;
                    text-align: left;
                    padding: 0.5rem 1rem;
                    background: none;
                    border: none;
                    color: ${rate === playbackRate ? accentColor : '#fff'};
                    font-size: 1.1rem;
                    font-weight: ${rate === playbackRate ? 700 : 400};
                    cursor: pointer;
                    &:hover {
                      background: rgba(255, 255, 255, 0.12);
                    }
                  `}
                  onClick={() => {
                    controller.setPlaybackRate(rate);
                    setSpeedOpen(false);
                  }}
                >
                  {rate === 1 ? 'Normal' : `${rate}×`}
                </button>
              ))}
            </div>
          )}
        </div>

        {showCinema && (
          <button
            type="button"
            aria-label={isCinema ? 'Exit theater mode' : 'Theater mode'}
            title={isCinema ? 'Exit theater mode (Esc)' : 'Theater mode'}
            className={cx(
              controlButtonClass,
              css`
                color: ${isCinema ? accentColor : '#fff'};
              `
            )}
            onClick={() => onToggleCinema?.()}
          >
            <Icon icon="film" />
          </button>
        )}

        {showFullscreen && (
          <button
            type="button"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className={controlButtonClass}
            onClick={() => onToggleFullscreen?.()}
          >
            <Icon icon={isFullscreen ? 'compress' : 'expand'} />
          </button>
        )}
      </div>
    </div>
  );

  function fractionFromEvent(
    event: React.PointerEvent,
    el: HTMLElement | null
  ) {
    const target = el || (event.currentTarget as HTMLElement);
    const rect = target.getBoundingClientRect();
    return clamp((event.clientX - rect.left) / rect.width, 0, 1);
  }

  function handleScrubPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!duration) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // setPointerCapture can throw for synthetic/invalid pointer ids
    }
    const fraction = fractionFromEvent(event, trackRef.current);
    setScrubbing(true);
    setScrubFraction(fraction);
    controller.seekTo(fraction * duration);
  }

  function handleScrubPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!duration) return;
    const fraction = fractionFromEvent(event, trackRef.current);
    if (scrubbing) {
      setScrubFraction(fraction);
      controller.seekTo(fraction * duration);
    } else {
      setHoverFraction(fraction);
    }
  }

  function handleScrubPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (scrubbing) {
      const fraction = fractionFromEvent(event, trackRef.current);
      controller.seekTo(fraction * duration);
      setScrubbing(false);
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // pointer capture may already be released
    }
  }

  function handleVolumePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // setPointerCapture can throw for synthetic/invalid pointer ids
    }
    applyVolume(event);
  }

  function handleVolumePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.buttons === 1) {
      applyVolume(event);
    }
  }

  function applyVolume(event: React.PointerEvent<HTMLDivElement>) {
    const fraction = fractionFromEvent(event, event.currentTarget);
    controller.setMuted(false);
    controller.setVolume(fraction);
  }
}

export default memo(VideoControls);
