import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Define types based on videojs
type VideoJsPlayer = ReturnType<typeof videojs>;
interface VideoJsPlayerOptions {
  controls?: boolean;
  fluid?: boolean;
  responsive?: boolean;
  playbackRates?: number[];
  sources?: { src: string; type: string }[];
  controlBar?: {
    children?: string[];
  };
}

interface VideoPlayerProps {
  videoUrl: string;
  srtContent: string;
  onPlayerReady: (player: VideoJsPlayer) => void;
}

const VideoPlayerWithSubtitles: React.FC<VideoPlayerProps> = ({
  videoUrl,
  srtContent,
  onPlayerReady
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const videoUrlRef = useRef<string>(videoUrl);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update videoUrlRef when videoUrl changes
  useEffect(() => {
    videoUrlRef.current = videoUrl;
  }, [videoUrl]);

  // Initialize player
  useEffect(() => {
    if (!videoRef.current) return;

    // Only initialize if player doesn't exist or URL has changed
    if (!playerRef.current) {
      const options: VideoJsPlayerOptions = {
        controls: true,
        fluid: false,
        responsive: true,
        playbackRates: [0.5, 1, 1.5, 2],
        sources: [{ src: videoUrlRef.current, type: 'video/mp4' }],
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'playbackRateMenuButton',
            'fullscreenToggle'
          ]
        }
      };

      const player = videojs(videoRef.current, options);
      playerRef.current = player;

      player.ready(() => {
        setIsPlayerReady(true);
        onPlayerReady(player);
      });

      // Handle source changes
      player.on('sourceset', () => {
        if (srtContent && isPlayerReady) {
          updateSubtitles(player, srtContent);
        }
      });
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.error('Error disposing video player:', e);
        }
        playerRef.current = null;
        setIsPlayerReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Handle video source updates
  useEffect(() => {
    if (playerRef.current && videoUrl !== videoUrlRef.current) {
      const currentTime = playerRef.current.currentTime();
      playerRef.current.src({ src: videoUrl, type: 'video/mp4' });
      playerRef.current.currentTime(currentTime);
      videoUrlRef.current = videoUrl;
    }
  }, [videoUrl]);

  // Update subtitles without reinitializing player
  useEffect(() => {
    if (isPlayerReady && playerRef.current && srtContent) {
      updateSubtitles(playerRef.current, srtContent);
    }
  }, [srtContent, isPlayerReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '50%',
        margin: '0 auto',
        aspectRatio: '16/9',
        minHeight: '200px',
        backgroundColor: '#000',
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div
        data-vjs-player
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <video
          ref={videoRef}
          className="video-js vjs-default-skin vjs-big-play-centered"
          playsInline
          preload="auto"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
};

function convertSrtToVtt(srt: string): string {
  return 'WEBVTT\n\n' + srt.replace(/,/g, '.');
}

function updateSubtitles(player: VideoJsPlayer, srtContent: string) {
  let vttUrl: string | null = null;

  try {
    // Use type assertion to access remoteTextTracks
    const tracks = (player as any).remoteTextTracks();
    for (let i = tracks.length - 1; i >= 0; i--) {
      player.removeRemoteTextTrack(tracks[i]);
    }

    const vttContent = convertSrtToVtt(srtContent);
    const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
    vttUrl = URL.createObjectURL(vttBlob);

    player.addRemoteTextTrack(
      {
        kind: 'subtitles',
        label: 'Subtitles',
        srclang: 'en',
        src: vttUrl,
        default: true,
        mode: 'showing'
      },
      false
    );

    // Clean up URL when track is loaded
    const cleanupUrl = () => {
      if (vttUrl) {
        URL.revokeObjectURL(vttUrl);
        vttUrl = null;
      }
      player.off('loadeddata', cleanupUrl);
    };

    player.on('loadeddata', cleanupUrl);

    // Add a safety cleanup in case loadeddata doesn't fire
    setTimeout(cleanupUrl, 10000);
  } catch (e) {
    console.error('Error updating subtitles:', e);
    // Clean up URL even if there's an error
    if (vttUrl) {
      URL.revokeObjectURL(vttUrl);
    }
  }
}

export default VideoPlayerWithSubtitles;
