import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  videoUrl: string;
  srtContent: string;
  onPlayerReady: (player: any) => void;
}

const VideoPlayerWithSubtitles: React.FC<VideoPlayerProps> = ({
  videoUrl,
  srtContent,
  onPlayerReady
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any | null>(null);
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
      const options = {
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
  }, []); // Empty dependency array since we handle URL changes separately

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
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        aspectRatio: '16/9',
        minHeight: '300px',
        backgroundColor: '#000',
        position: 'relative'
      }}
    >
      <div
        data-vjs-player
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
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
            left: 0
          }}
        />
      </div>
    </div>
  );
};

function convertSrtToVtt(srt: string): string {
  return 'WEBVTT\n\n' + srt.replace(/,/g, '.');
}

function updateSubtitles(player: any, srtContent: string) {
  try {
    const tracks = player.remoteTextTracks();
    for (let i = tracks.length - 1; i >= 0; i--) {
      player.removeRemoteTextTrack(tracks[i]);
    }

    const vttContent = convertSrtToVtt(srtContent);
    const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
    const vttUrl = URL.createObjectURL(vttBlob);

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
      URL.revokeObjectURL(vttUrl);
      player.off('loadeddata', cleanupUrl);
    };
    player.on('loadeddata', cleanupUrl);
  } catch (e) {
    console.error('Error updating subtitles:', e);
  }
}

export default VideoPlayerWithSubtitles;
