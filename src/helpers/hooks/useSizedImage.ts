import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { getSizedImageSrcSet } from '~/helpers/sizedImages';

// Props for an <img> that shows a stored image which has smaller copies (see
// helpers/sizedImages.ts): the copies go in srcset with `sizes` set to the
// width the image is actually drawn at, so the browser downloads and decodes
// a copy that fits the tile (and the screen's pixel density) instead of the
// full-size original. The original stays as src: if a copy fails to load, the
// copies are dropped and the original shows. Images without copies get their
// src unchanged.
//
// `fit: 'cover'` is for an image cropped to fill its box (object-fit: cover):
// a 16:9 cover then needs the box height times 16/9 when that is wider.
const FALLBACK_SIZES = '360px';

export default function useSizedImage({
  src,
  fit = 'contain',
  onError
}: {
  src: string;
  fit?: 'contain' | 'cover';
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const srcSet = getSizedImageSrcSet(src);
  const [failedSrcSet, setFailedSrcSet] = useState('');
  const [sizes, setSizes] = useState('');
  const useCopies = Boolean(srcSet) && failedSrcSet !== srcSet;

  useLayoutEffect(() => {
    if (!useCopies) return;
    const img = imgRef.current;
    if (!img) return;
    const measure = () => {
      const rect = img.getBoundingClientRect();
      const needed =
        fit === 'cover' ? Math.max(rect.width, (rect.height * 16) / 9) : rect.width;
      // Round up to a 10 px step so small layout jitter does not re-pick.
      setSizes(needed > 0 ? `${Math.ceil(needed / 10) * 10}px` : FALLBACK_SIZES);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(img);
    return () => observer.disconnect();
  }, [fit, useCopies]);

  const handleError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (useCopies) {
        setFailedSrcSet(srcSet);
        return;
      }
      onError?.(event);
    },
    [onError, srcSet, useCopies]
  );

  if (!useCopies) {
    return { ref: imgRef, src, onError: handleError };
  }
  // Until the drawn width is known (before the first paint) nothing is
  // fetched, so the original is never downloaded alongside a copy.
  // sizes and srcset are listed before src so they are on the element when
  // src lands (Safari otherwise starts fetching src first).
  return sizes
    ? { ref: imgRef, sizes, srcSet, src, onError: handleError }
    : { ref: imgRef, src: undefined, onError: handleError };
}
