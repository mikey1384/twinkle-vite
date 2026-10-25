import React, { useEffect, useRef } from 'react';
import { css, cx } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import {
  frameClass,
  leanClass,
  photoClass,
  sheenClass,
  surfaceClass
} from './styles';

// The platinum (100M XP) surface: brushed metal, a slow light that crosses
// and rests, and on a pointer device a glow that leans toward the cursor like
// tilting real metal. With a photo, the picture sits set into the plate. The
// owner can switch the shine off; reduced motion always keeps it still.
// Looping motion is transform/opacity only (rule 09-29).
export default function PlatinumSurface({
  children,
  className,
  photoUrl,
  photoPosition = '50,50',
  shine = true,
  size = 'cover',
  style,
  innerRef
}: {
  children?: React.ReactNode;
  className?: string;
  photoUrl?: string | null;
  photoPosition?: string;
  shine?: boolean;
  size?: 'cover' | 'card' | 'strip';
  style?: React.CSSProperties;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const leanRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [x, y] = String(photoPosition || '50,50').split(',');

  useEffect(() => {
    const host = hostRef.current;
    const lean = leanRef.current;
    if (!host || !lean || !shine || size === 'strip') return;
    if (
      !window.matchMedia?.('(pointer: fine)').matches ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    function handleMove(event: PointerEvent) {
      const rect = host!.getBoundingClientRect();
      lean!.style.setProperty(
        '--pt-x',
        `${((event.clientX - rect.left) / rect.width - 0.5) * 60}px`
      );
      lean!.style.setProperty(
        '--pt-y',
        `${((event.clientY - rect.top) / rect.height - 0.5) * 40}px`
      );
    }
    function handleLeave() {
      lean!.style.setProperty('--pt-x', '0px');
      lean!.style.setProperty('--pt-y', '0px');
    }
    host.addEventListener('pointermove', handleMove);
    host.addEventListener('pointerleave', handleLeave);
    return () => {
      host.removeEventListener('pointermove', handleMove);
      host.removeEventListener('pointerleave', handleLeave);
    };
  }, [shine, size]);

  return (
    <div
      ref={(node) => {
        hostRef.current = node;
        if (typeof innerRef === 'function') innerRef(node);
        else if (innerRef)
          (innerRef as React.MutableRefObject<HTMLDivElement | null>).current =
            node;
      }}
      data-platinum-surface={size}
      className={cx(surfaceClass, photoUrl && frameClass(size), className)}
      style={style}
    >
      {photoUrl && (
        <div
          className={photoClass(size)}
          style={{
            backgroundImage: `url("${photoUrl.startsWith('http') ? photoUrl : `${cloudFrontURL}${photoUrl}`}")`,
            backgroundPosition: `${Number(x) || 50}% ${Number(y) || 50}%`
          }}
        />
      )}
      {shine && (
        <div className={cx(sheenClass(size), photoUrl && overPhotoClass)} />
      )}
      {shine && size !== 'strip' && (
        <div
          ref={leanRef}
          className={cx(leanClass, photoUrl && overPhotoClass)}
        />
      )}
      {children}
    </div>
  );
}

const overPhotoClass = css`
  z-index: 2;
  mix-blend-mode: overlay;
  opacity: 0.55;
`;
