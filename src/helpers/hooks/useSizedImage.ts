import React, { useCallback, useLayoutEffect, useState } from 'react';
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
// the picture then needs the box height times its aspect ratio (`aspect`,
// width / height; 16:9 for app covers) when that is wider than the box.
const FALLBACK_SIZES = '360px';

export default function useSizedImage({
  src,
  fit = 'contain',
  aspect = 16 / 9,
  onError
}: {
  src: string;
  fit?: 'contain' | 'cover';
  aspect?: number;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
  // A callback ref, so measuring re-runs when the <img> mounts later (e.g.
  // after a failed earlier picture had replaced it with a fallback).
  const [img, imgRef] = useState<HTMLImageElement | null>(null);
  const srcSet = getSizedImageSrcSet(src);
  const [failedSrcSet, setFailedSrcSet] = useState('');
  const [sizes, setSizes] = useState('');
  const useCopies = Boolean(srcSet) && failedSrcSet !== srcSet;

  useLayoutEffect(() => {
    if (!useCopies || !img) return;
    const measure = () => {
      const rect = img.getBoundingClientRect();
      const needed =
        fit === 'cover' ? Math.max(rect.width, rect.height * aspect) : rect.width;
      // Round up to a 10 px step so small layout jitter does not re-pick.
      setSizes(needed > 0 ? `${Math.ceil(needed / 10) * 10}px` : FALLBACK_SIZES);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(img);
    return () => observer.disconnect();
  }, [aspect, fit, img, useCopies]);

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
