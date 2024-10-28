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
            autoplay?: 0 | 1;
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
      onPause: () => void;
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
    const progressIntervalRef = useRef<number>();
    // Generate a unique ID that persists across remounts
    const playerElementId = useRef(
      `youtube-player-${Math.random().toString(36).slice(2)}`
    );
    const isInitializedRef = useRef(false);

    const playerRef = (ref || internalRef) as React.RefObject<
      HTMLVideoElement | HTMLAudioElement | HTMLIFrameElement
    >;

    useEffect(() => {
      if (props.fileType === 'youtube') {
        initYouTubePlayer();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.src, props.fileType]);

    useEffect(() => {
      const player = playerRef.current;
      if (!player) return;

      const mediaPlayer = player as HTMLMediaElement;
      mediaPlayer.currentTime = props.initialTime;
      mediaPlayer.addEventListener('timeupdate', handleTimeUpdate);
      mediaPlayer.addEventListener('play', props.onPlay);
      mediaPlayer.addEventListener('pause', props.onPause);

      return () => {
        mediaPlayer.removeEventListener('timeupdate', handleTimeUpdate);
        mediaPlayer.removeEventListener('play', props.onPlay);
        mediaPlayer.removeEventListener('pause', props.onPause);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.fileType, props.src]);

    useEffect(() => {
      const player = playerRef.current;
      if (!player || props.fileType === 'youtube') return;

      const mediaPlayer = player as HTMLMediaElement;
      if (props.playing && mediaPlayer.paused) {
        mediaPlayer.play().catch(handleMediaError);
      } else if (!props.playing && !mediaPlayer.paused) {
        mediaPlayer.pause();
      }
    }, [playerRef, props.playing, props.fileType]);

    const commonProps = {
      style: { ...props.style, width: props.width, height: props.height },
      playsInline: props.playsInline !== false
    };

    if (props.fileType === 'youtube') {
      return <div id={playerElementId.current} {...commonProps} />;
    }

    return props.fileType === 'video' ? (
      <video
        {...commonProps}
        controls
        src={props.src}
        ref={playerRef as React.RefObject<HTMLVideoElement>}
      />
    ) : (
      <audio
        {...commonProps}
        controls
        src={props.src}
        ref={playerRef as React.RefObject<HTMLAudioElement>}
      />
    );

    function handleTimeUpdate(event: Event) {
      const target = event.target as HTMLMediaElement;
      props.onProgress?.(target.currentTime);
    }

    function handleMediaError(error: unknown) {
      console.error('Error playing media:', error);
    }

    async function initYouTubePlayer() {
      await loadYouTubeAPI();

      if (youtubePlayerRef.current?.destroy) {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }

      const playerElement = document.getElementById(playerElementId.current);
      if (!playerElement) return;

      youtubePlayerRef.current = new window.YT.Player(playerElementId.current, {
        videoId: props.src,
        playerVars: {
          autoplay: props.autoPlay ? 1 : 0, // Set autoplay based on prop
          start: Math.floor(props.initialTime || 0),
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady: handleYouTubeReady,
          onStateChange: handleYouTubeStateChange
        }
      });
    }

    function handleYouTubeReady(event: any) {
      isInitializedRef.current = true;
      const player = event.target;

      if (props.onPlayerReady) {
        props.onPlayerReady(player);
      }

      // Handle autoplay with a more robust approach
      if (props.autoPlay) {
        let hasUserInteraction = false;

        // Check if user has interacted with the page
        const interactionEvents = ['click', 'touchstart', 'keydown'];
        const handleInteraction = () => {
          hasUserInteraction = true;
          if (player.isMuted()) {
            player.unMute();
            player.setVolume(100);
          }
          // Remove listeners after first interaction
          interactionEvents.forEach((event) => {
            document.removeEventListener(event, handleInteraction);
          });
        };

        // Add interaction listeners
        interactionEvents.forEach((event) => {
          document.addEventListener(event, handleInteraction);
        });

        // Try to play unmuted first
        const playPromise = new Promise((resolve) => {
          player.unMute();
          player.setVolume(100);
          player.playVideo();

          const checkPlayingInterval = setInterval(() => {
            if (player.getPlayerState() === 1) {
              // 1 = playing
              clearInterval(checkPlayingInterval);
              resolve(true);
            }
          }, 100);

          // Timeout after 1 second
          setTimeout(() => {
            clearInterval(checkPlayingInterval);
            resolve(false);
          }, 1000);
        });

        playPromise.then((success) => {
          if (!success && !hasUserInteraction) {
            console.warn(
              'Unmuted autoplay failed. Trying with muted playback...'
            );
            player.mute();
            player.playVideo();
            player.setVolume(100);
          }
        });

        // Cleanup function
        return () => {
          interactionEvents.forEach((event) => {
            document.removeEventListener(event, handleInteraction);
          });
        };
      }
    }

    function handleYouTubeStateChange(event: any) {
      if (event.data === 1) {
        props.onPlay();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        progressIntervalRef.current = window.setInterval(
          updateYouTubeProgress,
          1000
        );
      } else if (event.data === 2) {
        props.onPause();
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      } else if (event.data === 0) {
        setTimeout(() => {
          props.onEnded?.();
        }, 0);
      }
    }

    function updateYouTubeProgress() {
      if (youtubePlayerRef.current?.getCurrentTime) {
        const currentTime = youtubePlayerRef.current.getCurrentTime();
        props.onProgress?.(currentTime);
      }
    }
  })
);

export default VideoPlayer;
