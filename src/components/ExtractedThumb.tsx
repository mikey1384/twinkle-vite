import React, { useEffect, useRef, useState } from 'react';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';

export default function ExtractedThumb({
  isHidden,
  src,
  onThumbnailLoad,
  style,
  thumbUrl,
  onThumbnailLoadFail
}: {
  isHidden?: boolean;
  src: string;
  onThumbnailLoad?: (data: {
    thumbnails: string[];
    selectedIndex: number;
  }) => void;
  style?: React.CSSProperties;
  thumbUrl?: string;
  onThumbnailLoadFail?: () => void;
}) {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [seeked, setSeeked] = useState(false);
  const [loadingThumb, setLoadingThumb] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [thumbnailBroken, setThumbnailBroken] = useState(false);
  const videoRef: React.RefObject<any> = useRef<Record<string, any>>({});
  const canvasRef: React.RefObject<any> = useRef<Record<string, any>>(null);
  const numThumbnails = 10;

  useEffect(() => {
    if (thumbUrl) {
      setThumbnail(thumbUrl);
    } else {
      if (videoRef.current && metadataLoaded && dataLoaded && suspended) {
        if (!videoRef.current.currentTime) {
          videoRef.current.currentTime = videoRef.current.duration / 2;
        }
        if (seeked && !thumbnail) {
          handleLoadThumbnail();
        }
      } else {
        onThumbnailLoadFail?.();
      }
    }

    async function handleLoadThumbnail() {
      setLoadingThumb(true);
      try {
        const thumbnailArray: string[] = [];
        const duration = videoRef.current.duration;
        const interval = duration / numThumbnails;

        for (let i = 0; i < numThumbnails; i++) {
          const time = i * interval;
          await captureThumbnailAtTime(time, thumbnailArray);
        }

        const selectedIndex = Math.floor(thumbnailArray.length / 2);
        setThumbnail(thumbnailArray[selectedIndex]);
        if (onThumbnailLoad) {
          onThumbnailLoad({ thumbnails: thumbnailArray, selectedIndex });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingThumb(false);
      }
    }

    function captureThumbnailAtTime(
      time: number,
      thumbnailArray: string[]
    ): Promise<void> {
      return new Promise((resolve) => {
        const handleSeeked = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.height = videoRef.current.videoHeight;
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current
              .getContext('2d')
              .drawImage(videoRef.current, 0, 0);
            const thumbnail = canvasRef.current.toDataURL('image/png');
            thumbnailArray.push(thumbnail);
            resolve();
          }
        };

        videoRef.current.currentTime = time;
        videoRef.current.addEventListener('seeked', handleSeeked, {
          once: true
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, metadataLoaded, seeked, suspended, thumbUrl]);

  return thumbnail ? (
    isHidden || thumbnailBroken ? null : (
      <img
        style={{ objectFit: 'cover', ...style }}
        src={thumbnail}
        alt="video thumbnail"
        onError={() => setThumbnailBroken(true)}
      />
    )
  ) : (
    <div style={style}>
      {!isHidden && loadingThumb && (
        <Loading style={{ width: '100%', height: '100%' }} />
      )}
      <canvas
        className={css`
          display: block;
          height: 1px;
          left: 0;
          object-fit: contain;
          position: fixed;
          top: 0;
          width: 1px;
          z-index: -1;
        `}
        ref={canvasRef}
      ></canvas>
      <video
        autoPlay
        playsInline
        crossOrigin="anonymous"
        muted
        className={css`
          display: block;
          height: 1px;
          left: 0;
          object-fit: contain;
          position: fixed;
          top: 0;
          width: 1px;
          z-index: -1;
        `}
        ref={videoRef}
        src={src}
        onLoadedMetadata={() => setMetadataLoaded(true)}
        onLoadedData={() => setDataLoaded(true)}
        onSuspend={() => setSuspended(true)}
        onSeeked={() => setSeeked(true)}
      />
    </div>
  );
}
