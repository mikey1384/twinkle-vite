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
  onThumbnailLoad?: (thumbnail: string) => void;
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

  useEffect(() => {
    if (thumbUrl) {
      setThumbnail(thumbUrl);
    } else {
      if (videoRef.current && metadataLoaded && dataLoaded && suspended) {
        if (!videoRef.current?.currentTime) {
          videoRef.current.currentTime = videoRef.current.duration / 2;
        }
        if (seeked && !thumbnail) {
          handleLoadThumbnail();
        }
      } else {
        onThumbnailLoadFail?.();
      }
    }
    function handleLoadThumbnail() {
      setLoadingThumb(true);
      try {
        if (canvasRef.current && videoRef.current) {
          canvasRef.current.height = videoRef.current.videoHeight;
          canvasRef.current.width = videoRef.current.videoWidth;

          canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0);
          const thumbnail = canvasRef.current.toDataURL('image/png');

          videoRef.current.src = '';
          videoRef.current.remove();
          videoRef.current.remove();
          setThumbnail(thumbnail);
          if (onThumbnailLoad) {
            onThumbnailLoad(thumbnail);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingThumb(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, metadataLoaded, seeked, suspended, thumbUrl, thumbnail]);

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
