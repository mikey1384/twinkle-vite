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
  style
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
}) {
  const charStatuses = getStatuses({ guesses, solution });

  const onClick = (value: string) => {
    if (value === 'ENTER') {
      onEnter();
    } else if (value === 'DELETE') {
      onDelete();
    } else {
      onChar(value);
    }
  };

  useEffect(() => {
    const listener = (e: any) => {
      if (isChecking) return;
      if (e.code === 'Enter') {
        onEnter();
      } else if (e.code === 'Backspace') {
        onDelete();
      } else {
        const key = e.key.toUpperCase();
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
          onChar(key);
        }
      }
    };
    window.addEventListener('keyup', listener);
    return function cleanUp() {
      window.removeEventListener('keyup', listener);
    };
  }, [onEnter, onDelete, onChar, isChecking]);

  return (
    <div style={{ ...style, opacity: isChecking ? 0.5 : 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2px'
        }}
      >
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
            isChecking={isChecking}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2px'
        }}
      >
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
            maxWordLength={maxWordLength}
            isChecking={isChecking}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Key
          status={isEnterReady ? 'ready' : ''}
          width={65.4}
          onClick={onClick}
          value="ENTER"
          isChecking={isChecking}
        >
          {ENTER_TEXT}
        </Key>
        {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((key) => (
          <Key
            value={key}
            key={key}
            onClick={onClick}
            status={charStatuses[key]}
            isRevealing={isRevealing}
            isChecking={isChecking}
          />
        ))}
        <Key
          status={isDeleteReady ? 'canDelete' : ''}
          width={65.4}
          onClick={onClick}
          value="DELETE"
          isChecking={isChecking}
        >
          {DELETE_TEXT}
        </Key>
      </div>
    </div>
  );
}
