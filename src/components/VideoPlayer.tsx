import React, { useEffect, useRef, forwardRef, memo } from 'react';

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
          };
          playerVars?: {
            autoplay?: 0;
            start?: number;
            modestbranding?: 0 | 1;
            rel?: 0 | 1;
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

    const playerRef = (ref || internalRef) as React.RefObject<
      HTMLVideoElement | HTMLAudioElement | HTMLIFrameElement
    >;

    useEffect(() => {
      if (props?.fileType === 'youtube') {
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
      mediaPlayer.addEventListener('play', props?.onPlay);
      mediaPlayer.addEventListener('pause', props?.onPause || (() => {}));

      return () => {
        mediaPlayer.removeEventListener('timeupdate', handleTimeUpdate);
        mediaPlayer.removeEventListener('play', props?.onPlay);
        mediaPlayer.removeEventListener('pause', props?.onPause || (() => {}));
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

    const commonProps = {
      style: { ...props?.style, width: props?.width, height: props?.height },
      playsInline: props?.playsInline !== false
    };

    if (props?.fileType === 'youtube') {
      return <div id={playerElementId.current} {...commonProps} />;
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
            playerVars: {
              start: Math.floor(props?.initialTime || 0),
              modestbranding: 1,
              rel: 0
            },
            events: {
              onReady: handleYouTubeReady,
              onStateChange: handleYouTubeStateChange
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

      if (props?.autoPlay || props?.playing) {
        player.playVideo();
      }

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
        props?.onPlay?.();
        progressIntervalRef.current = window.setInterval(
          updateYouTubeProgress,
          1000
        );
      } else if (event.data === 2) {
        props?.onPause?.();
      } else if (event.data === 0) {
        setTimeout(() => {
          props?.onEnded?.();
        }, 0);
      }
    }

    function updateYouTubeProgress() {
      if (youtubePlayerRef.current?.getCurrentTime && readyRef.current) {
        const currentTime = youtubePlayerRef.current.getCurrentTime();
        props?.onProgress?.(currentTime);
      }
    }
  })
);

export default VideoPlayer;
