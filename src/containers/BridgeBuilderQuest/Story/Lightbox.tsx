import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const zoomIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
`;

export interface LightboxPhoto {
  id: number;
  src: string;
  caption: string;
  alt: string;
}

// The story's photo viewer: arrows / swipe to move, Esc or the backdrop to
// close.
export default function Lightbox({
  photos,
  startIndex,
  onClose
}: {
  photos: LightboxPhoto[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const touchStartX = useRef<number | null>(null);
  const photo = photos[index];

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    }
    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  if (!photo) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start === null || end === undefined) return;
        if (Math.abs(end - start) > 50) step(end < start ? 1 : -1);
      }}
      className={css`
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(8, 18, 32, 0.94);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 5.6rem 7rem 3rem;
        animation: ${fadeIn} 0.2s ease-out;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 5.6rem 1rem 2rem;
        }
      `}
    >
      <div
        className={css`
          position: absolute;
          top: 1.6rem;
          left: 2rem;
          right: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.4rem;
          font-weight: bold;
        `}
      >
        <span>
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={roundButton}
        >
          <Icon icon="times" />
        </button>
      </div>
      <figure
        key={photo.id}
        onClick={(event) => event.stopPropagation()}
        className={css`
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.4rem;
          max-width: 100%;
          animation: ${zoomIn} 0.25s ease-out;
        `}
      >
        <img
          src={photo.src}
          alt={photo.alt || photo.caption}
          className={css`
            max-width: min(100%, 1400px);
            max-height: calc(100vh - 16rem);
            object-fit: contain;
            border-radius: 0.8rem;
            box-shadow: 0 1.2rem 4rem rgba(0, 0, 0, 0.5);
          `}
        />
        {photo.caption && (
          <figcaption
            className={css`
              max-width: 64rem;
              text-align: center;
              color: #fff;
              font-size: 1.6rem;
              line-height: 1.5;
            `}
          >
            {photo.caption}
          </figcaption>
        )}
      </figure>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            className={`${roundButton} ${sideButton('left')}`}
          >
            <Icon icon="chevron-left" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            className={`${roundButton} ${sideButton('right')}`}
          >
            <Icon icon="chevron-right" />
          </button>
        </>
      )}
    </div>,
    document.body
  );

  function step(delta: number) {
    setIndex((current) => (current + delta + photos.length) % photos.length);
  }
}

const roundButton = css`
  width: 4.4rem;
  height: 4.4rem;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 1.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.28);
  }
  &:focus-visible {
    outline: 3px solid #99ccff;
  }
`;

function sideButton(side: 'left' | 'right') {
  return css`
    position: absolute;
    top: 50%;
    ${side}: 1.6rem;
    transform: translateY(-50%);
    @media (max-width: ${mobileMaxWidth}) {
      top: auto;
      bottom: 1.6rem;
      transform: none;
    }
  `;
}
