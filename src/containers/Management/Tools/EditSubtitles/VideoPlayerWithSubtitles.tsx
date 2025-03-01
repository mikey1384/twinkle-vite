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
  html5?: {
    vhs?: {
      overrideNative?: boolean;
    };
    nativeAudioTracks?: boolean;
    nativeVideoTracks?: boolean;
    hls?: {
      overrideNative?: boolean;
    };
  };
  techOrder?: string[];
  preload?: string;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  const [currentVideoType, setCurrentVideoType] = useState<string>('');

  // Update videoUrlRef when videoUrl changes
  useEffect(() => {
    videoUrlRef.current = videoUrl;
  }, [videoUrl]);

  // Initialize player
  useEffect(() => {
    if (!videoRef.current) return;

    // Only initialize if player doesn't exist
    if (!playerRef.current) {
      const videoType = detectVideoType(videoUrl);
      setCurrentVideoType(videoType);

      const options: VideoJsPlayerOptions = {
        controls: true,
        fluid: false,
        responsive: true,
        playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        sources: videoUrl ? [{ src: videoUrl, type: videoType }] : [],
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
        },
        html5: {
          vhs: {
            overrideNative: true
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false,
          hls: {
            overrideNative: true
          }
        },
        techOrder: ['html5'],
        preload: 'auto'
      };

      const player = videojs(videoRef.current, options);
      playerRef.current = player;

      // Make sure time display is visible
      try {
        // Use type assertion to access controlBar components
        const playerAny = player as any;
        if (playerAny.controlBar) {
          if (playerAny.controlBar.currentTimeDisplay)
            playerAny.controlBar.currentTimeDisplay.show();
          if (playerAny.controlBar.durationDisplay)
            playerAny.controlBar.durationDisplay.show();
          if (playerAny.controlBar.timeDivider)
            playerAny.controlBar.timeDivider.show();
        }
      } catch (e) {
        console.error('Error configuring time display:', e);
      }

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

      // Handle errors
      player.on('error', (_e: any) => {
        const error = player.error();
        console.error('Video.js error:', error);

        // Set user-friendly error message based on error code
        if (error) {
          let message = 'An error occurred while playing the video.';

          switch (error.code) {
            case 1: // MEDIA_ERR_ABORTED
              message = 'The video playback was aborted.';
              break;
            case 2: // MEDIA_ERR_NETWORK
              message =
                'A network error occurred. Please check your connection and try again.';
              break;
            case 3: // MEDIA_ERR_DECODE
              message =
                'The video could not be decoded. This might be due to a corrupted file.';
              break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
              message =
                `The video format (${currentVideoType}) is not supported by your browser. ` +
                'Try a different format or convert the video.';
              break;
            default:
              message = `Video playback error (${error.code}): ${error.message}`;
          }

          setErrorMessage(message);

          // Try to recover by attempting different formats if we haven't exceeded max retries
          if (retryCount < maxRetries && videoUrl) {
            setRetryCount((prev) => prev + 1);

            setTimeout(() => {
              if (playerRef.current && videoUrl) {
                // Try with a different MIME type based on retry count
                const alternateTypes = [
                  'video/webm',
                  'video/mp4',
                  'video/ogg',
                  'audio/mp3'
                ];
                // Skip the current type that failed
                const filteredTypes = alternateTypes.filter(
                  (type) => type !== currentVideoType
                );
                const retryType =
                  filteredTypes[retryCount % filteredTypes.length];

                setCurrentVideoType(retryType);

                try {
                  playerRef.current.src({
                    src: videoUrl,
                    type: retryType
                  });
                  playerRef.current.load();
                } catch (e) {
                  console.error('Error during retry:', e);
                }
              }
            }, 1000);
          }
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
      try {
        // Reset error message and retry count when changing source
        setErrorMessage(null);
        setRetryCount(0);

        // Pause the player before changing source
        if (!playerRef.current.paused()) {
          playerRef.current.pause();
        }

        // Clear any previous errors
        try {
          playerRef.current.error(null as any);
        } catch (err) {
          console.error('Error clearing player error state:', err);
        }

        // Update the source with a small delay to ensure clean state
        setTimeout(() => {
          if (playerRef.current) {
            // Detect video type based on URL
            const videoType = detectVideoType(videoUrl);
            setCurrentVideoType(videoType);

            playerRef.current.src({
              src: videoUrl,
              type: videoType
            });
            playerRef.current.load();
            videoUrlRef.current = videoUrl;
          }
        }, 100);
      } catch (e) {
        console.error('Error updating video source:', e);
        setErrorMessage('Error loading video. Please try again.');
      }
    } else if (playerRef.current && !videoUrl) {
      // Handle case when videoUrl is null/empty
      try {
        playerRef.current.pause();
        playerRef.current.src([]);
        setErrorMessage('No video selected.');
      } catch (e) {
        console.error('Error clearing video source:', e);
      }
    }
  }, [videoUrl]);

  // Update subtitles without reinitializing player
  useEffect(() => {
    if (playerRef.current && srtContent) {
      updateSubtitles(playerRef.current, srtContent);
    }
  }, [srtContent]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // If videoUrl is a blob URL, revoke it
      if (videoUrl && videoUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(videoUrl);
        } catch (e) {
          console.error('Error revoking URL:', e);
        }
      }
    };
  }, [videoUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '40%',
        margin: '0 auto',
        aspectRatio: '16/9',
        minHeight: '180px',
        backgroundColor: '#000',
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '6px',
        overflow: 'hidden'
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

      {errorMessage && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '14px',
            textAlign: 'center',
            zIndex: 10
          }}
        >
          {errorMessage}
          {retryCount > 0 && retryCount <= maxRetries && (
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              Retrying with alternative format... ({retryCount}/{maxRetries})
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to detect video type based on URL
function detectVideoType(url: string): string {
  if (!url) return 'video/mp4';

  // For blob URLs, we need to check if there's a type hint in the URL or try to infer from the blob name
  if (url.startsWith('blob:')) {
    // Try to extract type information from URL
    const urlLower = url.toLowerCase();

    // Check for video formats
    if (urlLower.includes('mp4')) return 'video/mp4';
    if (urlLower.includes('webm')) return 'video/webm';
    if (urlLower.includes('ogg') || urlLower.includes('ogv'))
      return 'video/ogg';
    if (urlLower.includes('mov')) return 'video/quicktime';
    if (urlLower.includes('avi')) return 'video/x-msvideo';

    // Check for audio formats
    if (urlLower.includes('mp3')) return 'audio/mp3';
    if (urlLower.includes('wav')) return 'audio/wav';
    if (urlLower.includes('aac')) return 'audio/aac';

    return 'video/mp4';
  }

  const extension = url.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogg':
    case 'ogv':
      return 'video/ogg';
    case 'mov':
      return 'video/quicktime';
    case 'avi':
      return 'video/x-msvideo';
    case 'flv':
      return 'video/x-flv';
    case 'm3u8':
      return 'application/x-mpegURL';
    case 'ts':
      return 'video/MP2T';
    case 'mp3':
      return 'audio/mp3';
    case 'wav':
      return 'audio/wav';
    case 'aac':
      return 'audio/aac';
    default:
      // Default to mp4 if we can't determine the type
      return 'video/mp4';
  }
}

function convertSrtToVtt(srt: string): string {
  // WebVTT format requires periods instead of commas for timestamps
  // But we'll keep the original SRT format with commas in the editor display
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
