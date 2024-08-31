import React, { useEffect, useRef, forwardRef, memo } from 'react';

const VideoPlayer = memo(
  forwardRef<
    HTMLVideoElement | HTMLAudioElement,
    {
      src: string;
      fileType: 'audio' | 'video';
      onPlay: () => void;
      onPause: () => void;
      onProgress: (currentTime: number) => void;
      initialTime: number;
      width: string;
      height: string;
      playing?: boolean;
      style?: React.CSSProperties;
      playsInline?: boolean;
    }
  >((props, ref) => {
    const internalRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

    const playerRef = (ref || internalRef) as React.RefObject<
      HTMLVideoElement | HTMLAudioElement
    >;

    useEffect(() => {
      const player = playerRef.current;
      if (player) {
        player.currentTime = props.initialTime;

        const handleTimeUpdate = (event: Event) => {
          const target = event.target as HTMLMediaElement;
          props.onProgress(target.currentTime);
        };

        player.addEventListener('timeupdate', handleTimeUpdate);
        player.addEventListener('play', props.onPlay);
        player.addEventListener('pause', props.onPause);

        return () => {
          player.removeEventListener('timeupdate', handleTimeUpdate);
          player.removeEventListener('play', props.onPlay);
          player.removeEventListener('pause', props.onPause);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const player = playerRef.current;
      if (player) {
        if (props.playing && player.paused) {
          player
            .play()
            .catch((error: unknown) =>
              console.error('Error playing media:', error)
            );
        } else if (!props.playing && !player.paused) {
          player.pause();
        }
      }
    }, [playerRef, props.playing]);

    const commonProps = {
      src: props.src,
      controls: true,
      style: { ...props.style, width: props.width, height: props.height },
      playsInline: props.playsInline !== false
    };

    return props.fileType === 'video' ? (
      <video
        {...commonProps}
        ref={playerRef as React.RefObject<HTMLVideoElement>}
      />
    ) : (
      <audio
        {...commonProps}
        ref={playerRef as React.RefObject<HTMLAudioElement>}
      />
    );
  })
);

export default VideoPlayer;
