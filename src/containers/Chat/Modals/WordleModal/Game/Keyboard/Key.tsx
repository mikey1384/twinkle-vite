import React, { useMemo, useRef } from 'react';
import { css } from '@emotion/css';
import { mediumBorderRadius, Color } from '~/constants/css';
import { REVEAL_TIME_MS } from '../../constants/settings';

export default function Key({
  children,
  isChecking,
  width = 40,
  value,
  onClick,
  isRevealing,
  maxWordLength = 0,
  status = '',
  uiScale = 1
}: {
  children?: React.ReactNode;
  isChecking?: boolean;
  width?: number;
  value?: string;
  onClick: (v: any) => void;
  isRevealing?: boolean;
  maxWordLength?: number;
  status?: string;
  uiScale?: number;
}) {
  const keyDelayMs = REVEAL_TIME_MS * maxWordLength;
  const prevBackgroundColor = useRef('');
  const backgroundColor = useMemo(() => {
    const colorKeys: Record<string, string> = {
      ready: 'blue',
      canDelete: 'cranberry',
      correct: 'limeGreen',
      present: 'brownOrange',
      absent: 'darkBlueGray'
    };
    if (isRevealing && prevBackgroundColor.current) {
      return prevBackgroundColor.current;
    }
    if (colorKeys[status]) {
      prevBackgroundColor.current = Color[colorKeys[status]]();
      return Color[colorKeys[status]]();
    }
    prevBackgroundColor.current = Color.lightBlueGray();
    return Color.lightBlueGray();
  }, [isRevealing, status]);

  return (
    <button
      className={`unselectable ${css`
        transition: background-color 0.15s ease;
        box-shadow: 0 2px 0 rgba(15, 23, 42, 0.22);
        &:active {
          transform: translateY(2px);
          box-shadow: none;
        }
      `}`}
      style={{
        borderRadius: mediumBorderRadius,
        color: '#fff',
        cursor: isChecking ? 'default' : 'pointer',
        marginRight: `${3 * uiScale}px`,
        border: 0,
        fontWeight: 700,
        transitionDelay: isRevealing ? `${keyDelayMs}ms` : 'unset',
        width: `${width * uiScale}px`,
        height: `${5.5 * uiScale}rem`,
        fontSize: `${Math.max(1.1, 1.2 * uiScale)}rem`,
        backgroundColor
      }}
      disabled={isChecking}
      onClick={handleClick}
    >
      {children || value}
    </button>
  );

  function handleClick(event: any) {
    onClick(value);
    event.currentTarget.blur();
  }
}
