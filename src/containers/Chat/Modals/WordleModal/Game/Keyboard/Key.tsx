import React, { useMemo, useRef } from 'react';
import { borderRadius, Color } from '~/constants/css';
import { REVEAL_TIME_MS } from '../../constants/settings';

export default function Key({
  children,
  isChecking,
  width = 40,
  value,
  onClick,
  isRevealing,
  maxWordLength = 0,
  status = ''
}: {
  children?: React.ReactNode;
  isChecking?: boolean;
  width?: number;
  value?: string;
  onClick: (v: any) => void;
  isRevealing?: boolean;
  maxWordLength?: number;
  status?: string;
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
      className="unselectable"
      style={{
        borderRadius,
        color: '#fff',
        cursor: isChecking ? 'default' : 'pointer',
        marginRight: '2px',
        border: 0,
        fontWeight:
          status === 'ready' || status === 'canDelete' ? 'bold' : 'normal',
        transitionDelay: isRevealing ? `${keyDelayMs}ms` : 'unset',
        width: `${width}px`,
        height: '5.5rem',
        backgroundColor
      }}
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
