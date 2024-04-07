import React, { useEffect, useMemo, useRef, useState } from 'react';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import { imageHeights } from '~/constants/state';

export default function Image({
  imageUrl,
  backgroundColor,
  onClick
}: {
  backgroundColor?: string;
  imageUrl: string;
  onClick?: () => void;
}) {
  const ImageRef = useRef<any>(null);
  const defaultMinHeight = useMemo(
    () => (!imageUrl ? 0 : imageHeights[imageUrl] || 0),
    [imageUrl]
  );

  const [imageHeight, setImageHeight] = useState(defaultMinHeight);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const { contentRect } = entries[0];
      const newHeight = contentRect.height;
      setImageHeight(newHeight);
    });

    if (ImageRef.current) {
      resizeObserver.observe(ImageRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        imageHeights[imageUrl] = imageHeight;
      }
    };
  }, [imageUrl, imageHeight]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {imageUrl ? (
        <div
          onClick={onClick}
          style={{
            cursor: onClick ? 'pointer' : 'default',
            width: '100%',
            height: '100%',
            background: backgroundColor || Color.black()
          }}
        >
          <img
            ref={ImageRef}
            style={{
              width: '100%',
              height: imageHeight || '100%',
              objectFit: 'contain'
            }}
            src={imageUrl}
            rel=""
          />
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
}
