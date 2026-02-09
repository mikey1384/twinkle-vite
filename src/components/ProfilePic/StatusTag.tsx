import React, { useEffect, useMemo, useState } from 'react';
import {
  borderRadius,
  innerBorderRadius,
  Color,
  tabletMaxWidth
} from '~/constants/css';
import { css } from '@emotion/css';
import { isPhone } from '~/helpers';

const deviceIsPhone = isPhone(navigator);
const WIDTH_THRESHOLD = parseInt(tabletMaxWidth, 10) || 820;

export default function StatusTag({
  isProfilePage,
  large,
  status = 'online',
  size = 'auto'
}: {
  isProfilePage?: boolean;
  large?: boolean;
  status?: 'online' | 'busy' | 'away';
  size?: 'auto' | 'medium' | 'large' | 'dot';
}) {
  const palette = useMemo(() => {
    return {
      solid: {
        online: Color.green(),
        busy: Color.red(),
        away: Color.orange()
      }[status],
      glow: {
        online: Color.green(0.55),
        busy: Color.red(0.55),
        away: Color.orange(0.55)
      }[status],
      halo: {
        online: Color.green(0.2),
        busy: Color.red(0.2),
        away: Color.orange(0.2)
      }[status]
    };
  }, [status]);

  const [compactViewport, setCompactViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= WIDTH_THRESHOLD;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function handleResize() {
      setCompactViewport(window.innerWidth <= WIDTH_THRESHOLD);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const forcedDot = size === 'dot';
  const forcedPill = size === 'medium' || size === 'large';
  const isCompact = deviceIsPhone || compactViewport;

  const showTextTag = useMemo(() => {
    if (forcedDot) return false;
    if (forcedPill) return true;
    if (!large) return false;
    if (!isProfilePage) return true;
    return !(deviceIsPhone || compactViewport);
  }, [compactViewport, forcedDot, forcedPill, isProfilePage, large]);

  const label = useMemo(() => {
    switch (status) {
      case 'busy':
        return 'Busy';
      case 'away':
        return 'Away';
      default:
        return 'Online';
    }
  }, [status]);

  const pillFontSize = useMemo(() => {
    if (size === 'medium') return isCompact ? '1rem' : '1.15rem';
    if (size === 'large') return isCompact ? '1.15rem' : '1.3rem';
    return isCompact ? '1.05rem' : '1.25rem';
  }, [isCompact, size]);

  const pillPadding = useMemo(() => {
    if (size === 'medium') return isCompact ? '0.22rem 0.55rem' : '0.28rem 0.7rem';
    if (size === 'large') return isCompact ? '0.3rem 0.7rem' : '0.34rem 0.85rem';
    return isCompact ? '0.22rem 0.55rem' : '0.3rem 0.7rem';
  }, [isCompact, size]);

  const pillMinWidth = useMemo(() => {
    if (size === 'medium') return isCompact ? '3.4rem' : '4.2rem';
    if (size === 'large') return isCompact ? '4.4rem' : '5.4rem';
    return isCompact ? '3.6rem' : '4.6rem';
  }, [isCompact, size]);

  const pillMaxWidth = useMemo(() => {
    if (size === 'medium') return isCompact ? '6rem' : '7.4rem';
    if (size === 'large') return isCompact ? '6.6rem' : '8.8rem';
    return isCompact ? '6rem' : '7.5rem';
  }, [isCompact, size]);

  const dotDiameter = useMemo(() => {
    if (size === 'medium')
      return large ? (isCompact ? '1.05rem' : '1.2rem') : isCompact ? '0.85rem' : '0.95rem';
    if (size === 'large')
      return large ? (isCompact ? '1.2rem' : '1.4rem') : isCompact ? '0.95rem' : '1.15rem';
    return large ? (isCompact ? '1.1rem' : '1.3rem') : isCompact ? '0.9rem' : '1rem';
  }, [isCompact, large, size]);

  return showTextTag ? (
    <div
      className={css`
        top: 74%;
        left: 70%;
        background: #fff;
        position: absolute;
        border: 3px solid #fff;
        border-radius: ${borderRadius};
      `}
    >
      <div
        className={css`
          background: ${palette.solid};
          color: #fff;
          padding: ${pillPadding};
          min-width: ${pillMinWidth};
          max-width: ${pillMaxWidth};
          font-size: ${pillFontSize};
          text-align: center;
          border-radius: ${innerBorderRadius};
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 10px 20px -14px ${palette.glow};
          white-space: nowrap;
          overflow: hidden;
        `}
      >
        <span>{label}</span>
      </div>
    </div>
  ) : (
    <div
      style={{
        top: '70%',
        left: '67%',
        background: '#fff',
        position: 'absolute',
        border: `${large ? '3px' : '2px'} solid #fff`,
        borderRadius: '47%'
      }}
    >
      <div
        style={{
          background: palette.solid,
          width: dotDiameter,
          height: dotDiameter,
          borderRadius: '50%',
          boxShadow: `0 0 0 ${large ? '2px' : '1.5px'} ${palette.halo}`
        }}
      />
    </div>
  );
}
