import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  memo
} from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import PlayButton, { PLAYER_PLAY_BUTTON_SIZE } from '~/components/PlayButton';
import VideoControls, { PlayerController } from './VideoControls';

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          events: {
            onReady: (event: any) => void;
            onStateChange: (event: any) => void;
            onError?: (event: any) => void;
          };
          playerVars?: {
            autoplay?: 0;
            start?: number;
            controls?: 0 | 1;
            modestbranding?: 0 | 1;
            rel?: 0 | 1;
            playsinline?: 0 | 1;
            fs?: 0 | 1;
            iv_load_policy?: 1 | 3;
          };
        }
      ) => any;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

let isAPILoading = false;
const apiReadyPromise = new Promise<void>((resolve) => {
  if (window.YT) {
    resolve();
  } else {
    const originalCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (originalCallback) originalCallback();
      resolve();
    };
  }
});

function loadYouTubeAPI() {
  if (window.YT || isAPILoading) return apiReadyPromise;

  isAPILoading = true;
  const tag = document.createElement('script');
  tag.id = 'youtube-api';
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

  return apiReadyPromise;
}

type WebKitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebKitFullscreenElement = Element & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement() {
  const fullscreenDocument = document as WebKitFullscreenDocument;
  return (
    document.fullscreenElement ||
    fullscreenDocument.webkitFullscreenElement ||
    null
  );
}

function requestFullscreen(element: Element) {
  if (element.requestFullscreen) {
    void element.requestFullscreen();
    return;
  }
  void (element as WebKitFullscreenElement).webkitRequestFullscreen?.();
}

function exitFullscreen() {
  const fullscreenDocument = document as WebKitFullscreenDocument;
  if (document.exitFullscreen) {
    void document.exitFullscreen();
    return;
  }
  void fullscreenDocument.webkitExitFullscreen?.();
}

const VideoPlayer = memo(
  forwardRef<
    HTMLVideoElement | HTMLAudioElement | HTMLIFrameElement,
    {
      autoPlay?: boolean;
      src: string;
      fileType: 'audio' | 'video' | 'youtube';
      onPlay: () => void;
      onPause?: () => void;
      onEnded?: () => void;
      onProgress?: (currentTime: number) => void;
      initialTime: number;
      width: string;
      height: number | string;
      playing?: boolean;
      style?: React.CSSProperties;
      playsInline?: boolean;
      onPlayerReady?: (player: any) => void;
      // Twinkle custom control surface (replaces native player controls).
      customControls?: boolean;
      showCinema?: boolean;
      isCinema?: boolean;
      onToggleCinema?: () => void;
    }
  >((props, ref) => {
    const internalRef = useRef<
      HTMLVideoElement | HTMLAudioElement | HTMLIFrameElement
    >(null);
    const youtubePlayerRef = useRef<any>(null);
    const progressIntervalRef = useRef<number | undefined>(undefined);
    const playerElementId = useRef(
      `youtube-player-${Math.random().toString(36).slice(2)}`
    );
    const readyRef = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<any>(null);
    const lastNonZeroVolumeRef = useRef(1);
    const clickTimerRef = useRef<any>(null);
    const pendingPlayRef = useRef(false);

    const playerRef = (ref || internalRef) as React.RefObject<
      HTMLVideoElement | HTMLAudioElement | HTMLIFrameElement
    >;

    // Custom controls only for video files we own. YouTube embeds use YouTube's
    // OWN native controls (so ads/skip/captions/fullscreen work) — we only add a
    // theater toggle around them, never a control overlay on the cross-origin
    // iframe.
    const useCustom = !!props?.customControls && props?.fileType === 'video';
    const useYouTubeTheaterChrome =
      props?.fileType === 'youtube' && !!props?.showCinema;

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const [muted, setMutedState] = useState(false);
    const [playbackRate, setPlaybackRateState] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [buffering, setBuffering] = useState(false);
    // YouTube fired an error (embedding disabled, unavailable, age-restricted,
    // etc.) — get our custom layers out of the way so YouTube's own fallback UI
    // ("Watch on YouTube" / error) is visible and clickable.
    const [playerError, setPlayerError] = useState(false);

    // For YouTube the click layer is pointer-events:none (so YouTube's own UI —
    // skip-ad, watch-on-YouTube, prompts — stays clickable), which means nothing
    // catches mouse movement over the iframe to re-reveal hidden controls. So we
    // only auto-hide YouTube controls when there IS surrounding area to reveal
    // from (cinema/fullscreen letterbox); inline YouTube keeps the bar visible.
    const allowAutoHide =
      props?.fileType !== 'youtube' || !!props?.isCinema || isFullscreen;
    const useIdleChrome =
      useCustom || (useYouTubeTheaterChrome && !!props?.isCinema);

    const isPlayingRef = useRef(false);
    useEffect(() => {
      isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
      if (props?.fileType === 'youtube') {
        setPlayerError(false);
        initYouTubePlayer();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props?.src, props?.fileType]);

    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      const mediaPlayer = player as HTMLMediaElement;
      mediaPlayer.currentTime = props?.initialTime || 0;
      mediaPlayer.addEventListener('timeupdate', handleTimeUpdate);
      mediaPlayer.addEventListener('play', handleMediaPlay);
      mediaPlayer.addEventListener('pause', handleMediaPause);
      mediaPlayer.addEventListener('ended', handleMediaEnded);
      mediaPlayer.addEventListener('waiting', handleMediaWaiting);
      mediaPlayer.addEventListener('playing', handleMediaPlaying);
      mediaPlayer.addEventListener('loadedmetadata', syncSnapshot);

      return () => {
        mediaPlayer.removeEventListener('timeupdate', handleTimeUpdate);
        mediaPlayer.removeEventListener('play', handleMediaPlay);
        mediaPlayer.removeEventListener('pause', handleMediaPause);
        mediaPlayer.removeEventListener('ended', handleMediaEnded);
        mediaPlayer.removeEventListener('waiting', handleMediaWaiting);
        mediaPlayer.removeEventListener('playing', handleMediaPlaying);
        mediaPlayer.removeEventListener('loadedmetadata', syncSnapshot);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props?.fileType, props?.src]);

    useEffect(() => {
      const player = playerRef.current;
      if (!player || props?.fileType === 'youtube') return;

      const mediaPlayer = player as HTMLMediaElement;
      if (props?.playing && mediaPlayer.paused) {
        mediaPlayer.play().catch(handleMediaError);
      } else if (!props?.playing && !mediaPlayer.paused) {
        mediaPlayer.pause();
      }
    }, [playerRef, props?.playing, props?.fileType]);

    useEffect(() => {
      return () => {
        if (youtubePlayerRef.current?.destroy) {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
          readyRef.current = false;
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
        }
      };
    }, []);

    useEffect(() => {
      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = undefined;
        }
      };
    }, [props?.src]);

    // Poll the underlying player for the scrubber/time state ONLY while actually
    // playing — otherwise an idle/paused embed (e.g. many in a feed) would burn a
    // 250ms loop forever. Static metadata (duration/volume) is synced once on
    // ready / loadedmetadata instead (see handleYouTubeReady + the media effect).
    useEffect(() => {
      if (!useCustom || !isPlaying) return;
      const intervalId = window.setInterval(syncSnapshot, 250);
      return () => window.clearInterval(intervalId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useCustom, props?.fileType, isPlaying]);

    // Paused: keep controls visible. Playing: schedule auto-hide — driven by the
    // play state itself (not only mouse movement), so resuming after a pause
    // still hides the controls/cursor without needing a mouse move.
    useEffect(() => {
      if (!useIdleChrome) {
        setControlsVisible(true);
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        return;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (!isPlaying || !allowAutoHide) {
        setControlsVisible(true);
        return;
      }
      setControlsVisible(true);
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2800);
      return () => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      };
    }, [isPlaying, useIdleChrome, allowAutoHide]);

    useEffect(() => {
      if (!useCustom) return;
      function handleFullscreenChange() {
        setIsFullscreen(getFullscreenElement() === rootRef.current);
      }
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      );
      handleFullscreenChange();
      return () => {
        document.removeEventListener(
          'fullscreenchange',
          handleFullscreenChange
        );
        document.removeEventListener(
          'webkitfullscreenchange',
          handleFullscreenChange
        );
      };
    }, [useCustom]);

    // Keyboard shortcuts — only when this player owns focus (or the screen via
    // cinema/fullscreen), and never while typing in an input.
    useEffect(() => {
      if (!useCustom) return;
      function handleKeyDown(event: KeyboardEvent) {
        const root = rootRef.current;
        if (!root) return;
        const activeEl = document.activeElement as HTMLElement | null;
        const ownsScreen = !!props?.isCinema || getFullscreenElement() === root;
        if (!ownsScreen && !root.contains(activeEl)) return;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.isContentEditable)
        ) {
          return;
        }
        // A focused control button must keep its native Space/Enter activation
        // (otherwise keyboard users can't operate mute/speed/theater/fullscreen).
        if (
          activeEl?.tagName === 'BUTTON' &&
          (event.key === ' ' || event.key === 'Enter')
        ) {
          return;
        }
        let handled = true;
        switch (event.key) {
          case ' ':
          case 'k':
            isPlayingRef.current ? controller.pause() : controller.play();
            break;
          case 'ArrowLeft':
            controller.seekTo(Math.max(liveCurrentTime() - 5, 0));
            break;
          case 'ArrowRight': {
            const d = liveDuration();
            controller.seekTo(
              d ? Math.min(liveCurrentTime() + 5, d) : liveCurrentTime() + 5
            );
            break;
          }
          case 'ArrowUp':
            controller.setVolume(Math.min(liveVolume() + 0.1, 1));
            break;
          case 'ArrowDown':
            controller.setVolume(Math.max(liveVolume() - 0.1, 0));
            break;
          case 'm':
          case 'M':
            controller.toggleMute();
            break;
          case 'f':
          case 'F':
            toggleFullscreen();
            break;
          case 'c':
          case 'C':
          case 't':
          case 'T':
            if (props?.showCinema) props?.onToggleCinema?.();
            else handled = false;
            break;
          default:
            handled = false;
        }
        if (handled) {
          event.preventDefault();
          revealControls();
        }
      }
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useCustom, props?.isCinema, props?.showCinema]);

    const controller = useMemo<PlayerController>(
      () => ({
        play() {
          if (props?.fileType === 'youtube') {
            // The YT.Player object (and its playVideo method) exists before
            // onReady fires, but playback calls are only honored after ready —
            // so gate on readyRef and otherwise queue the play.
            if (readyRef.current && youtubePlayerRef.current?.playVideo) {
              youtubePlayerRef.current.playVideo();
            } else {
              pendingPlayRef.current = true;
              setBuffering(true);
            }
          } else {
            (playerRef.current as HTMLMediaElement)
              ?.play?.()
              .catch(handleMediaError);
          }
        },
        pause() {
          if (props?.fileType === 'youtube') {
            pendingPlayRef.current = false;
            setBuffering(false);
            youtubePlayerRef.current?.pauseVideo?.();
          } else {
            (playerRef.current as HTMLMediaElement)?.pause?.();
          }
        },
        seekTo(seconds: number) {
          setCurrentTime(seconds);
          if (props?.fileType === 'youtube') {
            youtubePlayerRef.current?.seekTo?.(seconds, true);
          } else {
            const media = playerRef.current as HTMLMediaElement;
            if (media) media.currentTime = seconds;
          }
        },
        setVolume(value: number) {
          setVolumeState(value);
          if (value > 0) {
            setMutedState(false);
            lastNonZeroVolumeRef.current = value;
          }
          if (props?.fileType === 'youtube') {
            youtubePlayerRef.current?.setVolume?.(value * 100);
            if (value > 0) youtubePlayerRef.current?.unMute?.();
          } else {
            const media = playerRef.current as HTMLMediaElement;
            if (media) {
              media.volume = value;
              if (value > 0) media.muted = false;
            }
          }
        },
        setMuted(value: boolean) {
          setMutedState(value);
          if (props?.fileType === 'youtube') {
            if (value) youtubePlayerRef.current?.mute?.();
            else youtubePlayerRef.current?.unMute?.();
          } else {
            const media = playerRef.current as HTMLMediaElement;
            if (media) media.muted = value;
          }
        },
        toggleMute() {
          const shouldUnmute = liveMuted() || liveVolume() === 0;
          if (shouldUnmute) {
            this.setMuted(false);
            if (liveVolume() === 0) {
              this.setVolume(
                lastNonZeroVolumeRef.current > 0
                  ? lastNonZeroVolumeRef.current
                  : 0.5
              );
            }
          } else {
            this.setMuted(true);
          }
        },
        setPlaybackRate(rate: number) {
          setPlaybackRateState(rate);
          if (props?.fileType === 'youtube') {
            youtubePlayerRef.current?.setPlaybackRate?.(rate);
          } else {
            const media = playerRef.current as HTMLMediaElement;
            if (media) media.playbackRate = rate;
          }
        }
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [props?.fileType]
    );

    const commonProps = {
      style: { ...props?.style, width: props?.width, height: props?.height },
      playsInline: props?.playsInline !== false
    };

    // Hide the cursor whenever the controls are idle-hidden (i.e. playing +
    // dormant mouse), in any mode. For YouTube this only takes visual effect when
    // our layer is on top of the iframe (theater/fullscreen); inline YouTube the
    // pointer sits over the cross-origin iframe, which controls its own cursor.
    const hideCursor = useIdleChrome && !controlsVisible;

    if (useCustom) {
      return (
        <div
          ref={rootRef}
          className={cx(rootClass, hideCursor && hideCursorClass)}
          style={{
            ...props?.style,
            width: props?.width,
            height: props?.height
          }}
          tabIndex={0}
          onMouseMove={revealControls}
          onMouseLeave={handleRootLeave}
        >
          {props?.fileType === 'youtube' ? (
            <div id={playerElementId.current} className={mediaFillClass} />
          ) : (
            <video
              className={mediaFillClass}
              src={props?.src}
              playsInline={props?.playsInline !== false}
              ref={playerRef as React.RefObject<HTMLVideoElement>}
            />
          )}
          {/* File video: our layer handles click-to-pause / dbl-click fullscreen.
              YouTube theater/fullscreen: layer stays on top so the cursor can hide
              on idle and a mouse move re-reveals controls (the cross-origin iframe
              fills the stage and doesn't bubble mouse events) — the trade-off is the
              iframe's own UI (skip-ad) isn't clickable while in theater.
              YouTube inline: layer is pass-through while controls are visible so the
              iframe's UI (skip-ad, watch-on-YouTube, native click-to-pause) works. */}
          <div
            className={clickLayerClass}
            style={{
              pointerEvents: playerError
                ? 'none'
                : props?.fileType === 'youtube'
                  ? props?.isCinema || isFullscreen
                    ? 'auto'
                    : controlsVisible
                      ? 'none'
                      : 'auto'
                  : 'auto'
            }}
            onClick={handleLayerClick}
            onDoubleClick={handleLayerDoubleClick}
          />
          <div
            className={pauseOverlayClass}
            style={{
              opacity: !playerError && !isPlaying && !buffering ? 1 : 0,
              pointerEvents:
                !playerError && !isPlaying && !buffering ? 'auto' : 'none'
            }}
            onClick={(event) => {
              event.stopPropagation();
              handleTogglePlay();
            }}
          >
            <PlayButton size={PLAYER_PLAY_BUTTON_SIZE} />
          </div>
          <div
            className={spinnerOverlayClass}
            style={{ opacity: buffering ? 1 : 0 }}
          >
            <div className={spinnerClass} />
          </div>
          {!playerError && (
            <VideoControls
              controller={controller}
              playing={isPlaying}
              currentTime={currentTime}
              duration={duration}
              buffered={buffered}
              volume={volume}
              muted={muted}
              playbackRate={playbackRate}
              visible={controlsVisible}
              isFullscreen={isFullscreen}
              showCinema={props?.showCinema}
              isCinema={props?.isCinema}
              onToggleCinema={props?.onToggleCinema}
              showFullscreen
              onToggleFullscreen={toggleFullscreen}
            />
          )}
        </div>
      );
    }

    if (props?.fileType === 'youtube') {
      // Native YouTube controls. If the surface supports theater mode, add a
      // small centered toggle button above YouTube's bottom chrome. In theater
      // mode, a Twinkle-owned wake layer appears only while idle-hidden so mouse
      // movement can recover the button and hide the dormant cursor.
      const theaterChromeHidden =
        !!props?.showCinema && !!props?.isCinema && !controlsVisible;
      return (
        <div
          ref={rootRef}
          className={cx(
            rootClass,
            props?.showCinema && ytHoverWrapperClass,
            props?.showCinema && props?.isCinema && ytTheaterActiveClass,
            hideCursor && hideCursorClass
          )}
          style={{
            ...props?.style,
            width: props?.width,
            height: props?.height
          }}
          onMouseMove={
            props?.showCinema && props?.isCinema ? revealControls : undefined
          }
          onMouseLeave={
            props?.showCinema && props?.isCinema ? handleRootLeave : undefined
          }
        >
          <div id={playerElementId.current} className={mediaFillClass} />
          {props?.showCinema && props?.isCinema && (
            <div
              className={ytTheaterWakeLayerClass}
              style={{
                pointerEvents: theaterChromeHidden ? 'auto' : 'none'
              }}
              onMouseMove={revealControls}
              onClick={(event) => {
                event.stopPropagation();
                revealControls();
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                revealControls();
              }}
            />
          )}
          {props?.showCinema && (
            <button
              type="button"
              aria-label={
                props?.isCinema ? 'Exit theater mode' : 'Theater mode'
              }
              title={
                props?.isCinema ? 'Exit theater mode (Esc)' : 'Theater mode'
              }
              className={cx(theaterButtonClass, 'theater-btn')}
              style={
                props?.isCinema
                  ? {
                      opacity: controlsVisible ? 1 : 0,
                      pointerEvents: controlsVisible ? 'auto' : 'none'
                    }
                  : undefined
              }
              onClick={(event) => {
                event.stopPropagation();
                props?.onToggleCinema?.();
              }}
            >
              <Icon icon={props?.isCinema ? 'compress' : 'film'} />
            </button>
          )}
        </div>
      );
    }

    return props?.fileType === 'video' ? (
      <video
        {...commonProps}
        controls
        src={props?.src}
        ref={playerRef as React.RefObject<HTMLVideoElement>}
      />
    ) : (
      <audio
        {...commonProps}
        controls
        src={props?.src}
        ref={playerRef as React.RefObject<HTMLAudioElement>}
      />
    );

    function syncSnapshot() {
      if (props?.fileType === 'youtube') {
        const player = youtubePlayerRef.current;
        if (!player || typeof player.getDuration !== 'function') return;
        const d = player.getDuration() || 0;
        setDuration(d);
        setCurrentTime(player.getCurrentTime?.() || 0);
        setBuffered((player.getVideoLoadedFraction?.() || 0) * d);
        const vol = (player.getVolume?.() ?? 100) / 100;
        setVolumeState(vol);
        if (vol > 0) lastNonZeroVolumeRef.current = vol;
        setMutedState(!!player.isMuted?.());
        setPlaybackRateState(player.getPlaybackRate?.() || 1);
      } else {
        const media = playerRef.current as HTMLVideoElement;
        if (!media) return;
        setDuration(media.duration || 0);
        setCurrentTime(media.currentTime || 0);
        try {
          setBuffered(
            media.buffered.length
              ? media.buffered.end(media.buffered.length - 1)
              : 0
          );
        } catch {
          // buffered may throw if no data yet
        }
        setVolumeState(media.volume);
        if (media.volume > 0) lastNonZeroVolumeRef.current = media.volume;
        setMutedState(media.muted);
        setPlaybackRateState(media.playbackRate || 1);
      }
    }

    function revealControls() {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (isPlayingRef.current && allowAutoHide) {
        hideTimerRef.current = setTimeout(
          () => setControlsVisible(false),
          2800
        );
      }
    }

    function liveCurrentTime() {
      if (props?.fileType === 'youtube') {
        return youtubePlayerRef.current?.getCurrentTime?.() || 0;
      }
      return (playerRef.current as HTMLMediaElement)?.currentTime || 0;
    }

    function liveDuration() {
      if (props?.fileType === 'youtube') {
        return youtubePlayerRef.current?.getDuration?.() || 0;
      }
      return (playerRef.current as HTMLMediaElement)?.duration || 0;
    }

    function liveVolume() {
      if (props?.fileType === 'youtube') {
        return (youtubePlayerRef.current?.getVolume?.() ?? 100) / 100;
      }
      return (playerRef.current as HTMLMediaElement)?.volume ?? 1;
    }

    function liveMuted() {
      if (props?.fileType === 'youtube') {
        return !!youtubePlayerRef.current?.isMuted?.();
      }
      return !!(playerRef.current as HTMLMediaElement)?.muted;
    }

    function handleMediaWaiting() {
      setBuffering(true);
    }

    function handleMediaPlaying() {
      setBuffering(false);
    }

    function handleRootLeave() {
      if (isPlaying && allowAutoHide) setControlsVisible(false);
    }

    function handleTogglePlay() {
      if (isPlaying) controller.pause();
      else controller.play();
      revealControls();
    }

    // For YouTube the layer is only interactive while controls are hidden, so a
    // click/double-click there just wakes the controls (YouTube owns surface
    // play/pause and fullscreen). For file video, our own click handling applies.
    function handleLayerClick(event: React.MouseEvent) {
      // Don't let a play/pause click bubble to a clickable ancestor (e.g. a
      // ContentPreview card that navigates on click).
      event.stopPropagation();
      if (props?.fileType === 'youtube') {
        revealControls();
        return;
      }
      handleClickLayerClick();
    }

    function handleLayerDoubleClick(event: React.MouseEvent) {
      event.stopPropagation();
      if (props?.fileType === 'youtube') {
        revealControls();
        return;
      }
      handleClickLayerDoubleClick();
    }

    // Distinguish a single click (toggle play) from a double click (fullscreen):
    // defer the toggle briefly and cancel it if a double-click arrives, so
    // double-clicking a playing video to go fullscreen doesn't also pause it.
    function handleClickLayerClick() {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        return;
      }
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        handleTogglePlay();
      }, 250);
    }

    function handleClickLayerDoubleClick() {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      toggleFullscreen();
    }

    function toggleFullscreen() {
      const el = rootRef.current;
      if (!el) return;
      if (getFullscreenElement()) {
        exitFullscreen();
      } else {
        requestFullscreen(el);
      }
    }

    function handleMediaPlay() {
      setIsPlaying(true);
      props?.onPlay?.();
    }

    function handleMediaPause() {
      setIsPlaying(false);
      // A video stalled in `waiting` never fires `playing`; clear the spinner on
      // pause so slow-network users don't get a stuck overlay.
      setBuffering(false);
      props?.onPause?.();
    }

    function handleMediaEnded() {
      setIsPlaying(false);
      setBuffering(false);
      props?.onEnded?.();
    }

    function handleTimeUpdate(event: Event) {
      const target = event.target as HTMLMediaElement;
      props?.onProgress?.(target.currentTime);
    }

    function handleMediaError(error: unknown) {
      console.error('Error playing media:', error);
    }

    async function initYouTubePlayer() {
      await loadYouTubeAPI();

      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.removeEventListener(
            'onReady',
            handleYouTubeReady
          );
          youtubePlayerRef.current.removeEventListener(
            'onStateChange',
            handleYouTubeStateChange
          );
          youtubePlayerRef.current.destroy();
        } catch (error) {
          console.error('Error cleaning up YouTube player:', error);
        }
        youtubePlayerRef.current = null;
        readyRef.current = false;
      }

      const playerElement = document.getElementById(playerElementId.current);
      if (!playerElement) return;

      try {
        youtubePlayerRef.current = new window.YT.Player(
          playerElementId.current,
          {
            videoId: props?.src,
            playerVars: useCustom
              ? {
                  start: Math.floor(props?.initialTime || 0),
                  controls: 0,
                  modestbranding: 1,
                  rel: 0,
                  playsinline: 1,
                  fs: 0,
                  iv_load_policy: 3
                }
              : {
                  start: Math.floor(props?.initialTime || 0),
                  modestbranding: 1,
                  rel: 0
                },
            events: {
              onReady: handleYouTubeReady,
              onStateChange: handleYouTubeStateChange,
              onError: handleYouTubeError
            }
          }
        );
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
      }
    }

    function handleYouTubeReady(event: any) {
      readyRef.current = true;
      const player = event.target;
      // One-shot metadata sync so duration/volume populate without an idle loop.
      syncSnapshot();

      if (props?.autoPlay || props?.playing || pendingPlayRef.current) {
        player.playVideo();
      }
      pendingPlayRef.current = false;

      if (props?.onPlayerReady) {
        props?.onPlayerReady(player);
      }
    }

    function handleYouTubeStateChange(event: any) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = undefined;
      }

      if (event.data === 1) {
        setIsPlaying(true);
        setBuffering(false);
        props?.onPlay?.();
        progressIntervalRef.current = window.setInterval(
          updateYouTubeProgress,
          1000
        );
      } else if (event.data === 2) {
        setIsPlaying(false);
        setBuffering(false);
        props?.onPause?.();
      } else if (event.data === 3) {
        setBuffering(true);
      } else if (event.data === 0) {
        setIsPlaying(false);
        setBuffering(false);
        setTimeout(() => {
          props?.onEnded?.();
        }, 0);
      }
    }

    function handleYouTubeError() {
      // Embedding disabled / unavailable / age-restricted, etc. Stop covering the
      // iframe so YouTube's own fallback ("Watch on YouTube") is usable.
      setPlayerError(true);
      setBuffering(false);
      setIsPlaying(false);
      pendingPlayRef.current = false;
    }

    function updateYouTubeProgress() {
      if (youtubePlayerRef.current?.getCurrentTime && readyRef.current) {
        const currentTime = youtubePlayerRef.current.getCurrentTime();
        props?.onProgress?.(currentTime);
      }
    }
  })
);

const rootClass = css`
  position: relative;
  overflow: hidden;
  background: #000;
  outline: none;
  & iframe {
    position: absolute;
    inset: 0;
    width: 100% !important;
    height: 100% !important;
    border: 0;
  }
`;

// In theater / fullscreen, hide the cursor together with the idle controls.
const hideCursorClass = css`
  &,
  & * {
    cursor: none !important;
  }
`;

const mediaFillClass = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

// Theater toggle styled like one of YouTube's own control icons, centered near
// the bottom so it stays reachable in inline and theater layouts.
const theaterButtonClass = css`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  z-index: 6;
  width: 4.8rem;
  height: 4.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transform: translateX(-50%);
  transition:
    opacity 0.2s ease,
    background 0.15s ease,
    transform 0.15s ease;
  &:hover {
    background: rgba(0, 0, 0, 0.65);
    transform: translateX(-50%) scale(1.08);
  }
`;

const ytTheaterActiveClass = css`
  & .theater-btn {
    opacity: 1;
    pointer-events: auto;
  }
`;

const ytTheaterWakeLayerClass = css`
  position: absolute;
  inset: 0;
  z-index: 5;
  background: transparent;
  cursor: none;
`;

// Mirrors YouTube's controls: the theater button is visible only while the
// cursor is over the player (CSS :hover works across the cross-origin iframe;
// JS mouse events do not), and fades out when the cursor leaves.
const ytHoverWrapperClass = css`
  & .theater-btn {
    opacity: 0;
    pointer-events: none;
  }
  &:hover .theater-btn {
    opacity: 1;
    pointer-events: auto;
  }
`;

const clickLayerClass = css`
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: pointer;
`;

// Covers YouTube's paused-state chrome (center play button, title, logo) so the
// paused player reads as Twinkle's own, not YouTube's.
const pauseOverlayClass = css`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.5);
  transition: opacity 0.18s ease;
`;

const spinnerOverlayClass = css`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: opacity 0.18s ease;
`;

const spinnerClass = css`
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  border: 0.4rem solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  animation: videoSpin 0.8s linear infinite;
  @keyframes videoSpin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export default VideoPlayer;
