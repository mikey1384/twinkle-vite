import React, { useEffect, useCallback, useRef, forwardRef, memo } from 'react';

interface VideoPlayerProps {
  src: string;
  fileType: 'audio' | 'video';
  onPlay: () => void;
  onPause: () => void;
  onProgress: (currentTime: number) => void;
  onReady: () => void;
  initialTime: number;
  width: string;
  height: string;
  playing: boolean;
  isReady: boolean;
  style?: React.CSSProperties;
}

const CustomPlayer = memo(
  forwardRef<
    {
      seekTo: (time: number) => void;
    },
    VideoPlayerProps
  >(function VideoPlayer({
    fileType,
    src,
    onPlay,
    onPause,
    onProgress,
    onReady,
    initialTime,
    width,
    height,
    playing,
    isReady,
    style
  }) {
    const internalRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

    const handleTimeUpdate = useCallback(
      (event: Event) => {
        const target = event.target as HTMLMediaElement;
        onProgress(target.currentTime);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    useEffect(() => {
      const player = internalRef.current;
      if (player) {
        player.currentTime = initialTime;
        player.addEventListener('timeupdate', handleTimeUpdate);
        player.addEventListener('play', onPlay);
        player.addEventListener('pause', onPause);

        return () => {
          player.removeEventListener('timeupdate', handleTimeUpdate);
          player.removeEventListener('play', onPlay);
          player.removeEventListener('pause', onPause);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const player = internalRef.current;
      if (player) {
        if (playing && player.paused) {
          player
            .play()
            .catch((error) => console.error('Error playing media:', error));
        } else if (!playing && !player.paused) {
          player.pause();
        }
      }
    }, [playing]);

    const commonProps = {
      ref: internalRef,
      src,
      controls: true,
      style: { ...style, width, height },
      onCanPlay: onReady,
      disabled: !isReady
    };

    return fileType === 'video' ? (
      <video
        {...commonProps}
        ref={internalRef as React.RefObject<HTMLVideoElement>}
      />
    ) : (
      <audio
        {...commonProps}
        ref={internalRef as React.RefObject<HTMLAudioElement>}
      />
    );
  })
);

export default CustomPlayer;
