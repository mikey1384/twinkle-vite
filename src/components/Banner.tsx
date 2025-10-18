import React, { useEffect, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, wideBorderRadius, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

export default function Banner({
  children,
  color,
  innerRef,
  loading,
  onClick,
  spinnerDelay = 1000,
  style = {}
}: {
  children: React.ReactNode;
  color?: string;
  innerRef?: React.RefObject<any>;
  loading?: boolean;
  onClick?: () => void;
  spinnerDelay?: number;
  style?: React.CSSProperties;
}) {
  const warningRole = useRoleColor('warning', { fallback: 'redOrange' });
  const timerRef: React.RefObject<any> = useRef(null);
  const [spinnerShown, setSpinnerShown] = useState(false);
  const hue = color || warningRole.colorKey;

  function tint(key: string, a: number) {
    const fn = (Color as any)[key];
    return typeof fn === 'function' ? fn(a) : key;
  }

  useEffect(() => {
    if (loading) {
      timerRef.current = setTimeout(() => {
        setSpinnerShown(true);
      }, spinnerDelay);
    } else {
      clearTimeout(timerRef.current);
      setSpinnerShown(false);
    }
  }, [loading, spinnerDelay]);

  return (
    <div
      ref={innerRef}
      className={css`
        opacity: ${loading ? 0.6 : 1};
        width: calc(100% - 1.2rem);
        margin: 0.6rem;
        background: ${tint(hue, 0.22)};
        color: ${Color.darkBlueGray()};
        padding: 1rem 1.2rem;
        font-size: 1.6rem;
        border: 1px solid ${tint(hue, 0.42)};
        border-radius: ${wideBorderRadius};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        transition: background 0.18s ease, border-color 0.18s ease,
          transform 0.06s ease, opacity 0.18s ease;
        ${onClick && !loading ? 'cursor: pointer;' : 'cursor: default;'}
        &:hover {
          ${onClick && !loading
            ? `background: ${tint(hue, 0.28)}; border-color: ${tint(hue, 0.5)};`
            : ''};
        }
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.4rem;
          padding: 0.9rem 1rem;
        }
      `}
      style={style}
      onClick={loading || !onClick ? () => null : onClick}
    >
      {children}
      {loading && spinnerShown && (
        <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
      )}
    </div>
  );
}
