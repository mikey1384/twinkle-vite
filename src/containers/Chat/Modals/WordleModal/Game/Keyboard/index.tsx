import React, { useEffect } from 'react';
import { getStatuses } from '../helpers/statuses';
import Key from './Key';
import { ENTER_TEXT, DELETE_TEXT } from '../../constants/strings';

export default function Keyboard({
  isChecking,
  isDeleteReady,
  isEnterReady,
  onChar,
  onDelete,
  onEnter,
  guesses,
  isRevealing,
  maxWordLength,
  solution,
  style,
  uiScale = 1
}: {
  isChecking: boolean;
  isDeleteReady: boolean;
  isEnterReady: boolean;
  onChar: (value: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  guesses: string[];
  isRevealing: boolean;
  maxWordLength: number;
  solution: string;
  style: React.CSSProperties;
  uiScale?: number;
}) {
  const charStatuses = getStatuses({ guesses, solution });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (isChecking) return;

      if (e.code === 'Enter') {
        onEnter();
      } else if (e.code === 'Backspace') {
        onDelete();
      } else if (e.code.startsWith('Key')) {
        // e.code will be something like "KeyA", "KeyB", etc.
        // We just want the final letter, e.g. "KeyA" -> "A"
        const letter = e.code.slice(-1);
        onChar(letter);
      }
    };

    window.addEventListener('keyup', listener);
    return () => {
      window.removeEventListener('keyup', listener);
    };
  }, [isChecking, onEnter, onDelete, onChar]);

  return (
    <div style={{ ...style, opacity: isChecking ? 0.5 : 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: `${2 * uiScale}px`
        }}
      >
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={handleClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
            uiScale={uiScale}
            isChecking={isChecking}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: `${2 * uiScale}px`
        }}
      >
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={handleClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
            maxWordLength={maxWordLength}
            uiScale={uiScale}
            isChecking={isChecking}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Key
          status={isEnterReady ? 'ready' : ''}
          width={65.4}
          onClick={handleClick}
          value="ENTER"
          uiScale={uiScale}
          isChecking={isChecking}
        >
          {ENTER_TEXT}
        </Key>
        {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={handleClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
            uiScale={uiScale}
            isChecking={isChecking}
          />
        ))}
        <Key
          status={isDeleteReady ? 'canDelete' : ''}
          width={65.4}
          onClick={handleClick}
          value="DELETE"
          uiScale={uiScale}
          isChecking={isChecking}
        >
          {DELETE_TEXT}
        </Key>
      </div>
    </div>
  );

  function handleClick(value: string) {
    if (value === 'ENTER') {
      onEnter();
    } else if (value === 'DELETE') {
      onDelete();
    } else {
      onChar(value);
    }
  }
}
