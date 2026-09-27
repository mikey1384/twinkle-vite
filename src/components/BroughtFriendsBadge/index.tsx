import React, { useEffect, useRef, useState } from 'react';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import { css, keyframes } from '@emotion/css';
import { isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';
import { broughtFriendsHeadline, getBroughtFriendsTier } from './tiers';

const deviceIsMobile = isMobile(navigator);

const glow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 0.15rem var(--bf-tier)); }
  50% { filter: drop-shadow(0 0 0.55rem var(--bf-tier)); }
`;

// The "Brought N people" medallion in the profile cover's achievement row:
// same size as the achievement thumbs, with the count on a small plate.
export default function BroughtFriendsBadge({
  count,
  thumbSize = '3rem',
  onClick,
  style
}: {
  count: number;
  thumbSize?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const tier = getBroughtFriendsTier(count);
  const timerRef = useRef<any>(null);
  const badgeRef = useRef<HTMLButtonElement | null>(null);
  const [titleContext, setTitleContext] = useState<any>(null);

  useEffect(() => {
    if (titleContext && deviceIsMobile) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => setTitleContext(null),
        mobileFullTextRevealShowDuration
      );
    }
    return () => clearTimeout(timerRef.current);
  }, [titleContext]);

  if (!tier) return null;
  const label = `${broughtFriendsHeadline(count)} · ${tier.name}`;

  return (
    <button
      ref={badgeRef}
      type="button"
      aria-label={label}
      onClick={() => {
        if (deviceIsMobile) showLabel();
        onClick?.();
      }}
      onMouseOver={showLabel}
      onMouseLeave={() => setTitleContext(null)}
      style={
        {
          '--bf-tier': tier.color,
          width: thumbSize,
          height: thumbSize,
          ...style
        } as React.CSSProperties
      }
      className={css`
        position: relative;
        flex-shrink: 0;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        cursor: pointer;
        overflow: visible;
        > img {
          animation: ${glow} 3.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          > img {
            animation: none;
            filter: drop-shadow(0 0 0.3rem var(--bf-tier));
          }
        }
      `}
    >
      <img
        src={tier.badgeSrc}
        alt=""
        loading="lazy"
        className={css`
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        `}
      />
      <span
        className={css`
          position: absolute;
          right: -0.45rem;
          bottom: -0.35rem;
          min-width: 1.7rem;
          padding: 0.1rem 0.35rem;
          border-radius: 1rem;
          background: #10142a;
          border: 0.12rem solid var(--bf-tier);
          color: #fff;
          font-size: 1.1rem;
          font-weight: 800;
          line-height: 1.2;
          text-shadow: none;
          text-align: center;
          white-space: nowrap;
        `}
      >
        {count >= 1000 ? `${Math.floor(count / 1000)}k` : count}
      </span>
      {titleContext && <FullTextReveal textContext={titleContext} text={label} />}
    </button>
  );

  function showLabel() {
    const rect = badgeRef.current?.getBoundingClientRect?.();
    if (!rect) return;
    setTitleContext({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    });
  }
}
