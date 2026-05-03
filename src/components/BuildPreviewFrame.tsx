import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';

const frameClass = css`
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(20, 35, 60, 0.14);
  border-radius: 0.65rem;
  background:
    linear-gradient(135deg, rgba(65, 140, 235, 0.12), rgba(41, 171, 135, 0.14)),
    #111827;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const toolbarClass = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.38rem;
  height: 1.9rem;
  padding: 0 0.75rem;
  background: rgba(255, 255, 255, 0.88);

  span {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: rgba(50, 65, 90, 0.42);
  }
`;

const fallbackClass = css`
  height: 100%;
  min-height: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.4rem 1rem 1rem;
  color: rgba(255, 255, 255, 0.88);
  text-align: center;

  svg {
    font-size: 2.4rem;
  }

  span {
    font-size: 1.05rem;
    font-weight: 800;
  }
`;

export default function BuildPreviewFrame({
  thumbnailUrl,
  alt,
  ariaLabel,
  className,
  fallbackLabel = 'Preview not captured',
  children
}: {
  thumbnailUrl?: string | null;
  alt: string;
  ariaLabel?: string;
  className?: string;
  fallbackLabel?: string;
  children?: React.ReactNode;
}) {
  const normalizedThumbnailUrl = String(thumbnailUrl || '').trim();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnailShown = Boolean(normalizedThumbnailUrl) && !thumbnailFailed;

  useEffect(() => {
    setThumbnailFailed(false);
  }, [normalizedThumbnailUrl]);

  return (
    <div className={cx(frameClass, className)} aria-label={ariaLabel}>
      <div className={toolbarClass} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {thumbnailShown ? (
        <img
          src={normalizedThumbnailUrl}
          alt={alt}
          onError={() => setThumbnailFailed(true)}
        />
      ) : (
        <div className={fallbackClass}>
          <Icon icon="laptop-code" />
          <span>{fallbackLabel}</span>
        </div>
      )}
      {children}
    </div>
  );
}
