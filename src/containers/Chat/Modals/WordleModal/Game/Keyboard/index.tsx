import React, { useEffect } from 'react';
import { getStatuses } from '../helpers/statuses';
import Key from './Key';
import { ENTER_TEXT, DELETE_TEXT } from '../../constants/strings';
import { shouldIgnoreWordleKeyboardEvent } from './keyboardEventPolicy';

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
      if (shouldIgnoreWordleKeyboardEvent(e)) return;

      const isEnter = e.code === 'Enter' || e.code === 'NumpadEnter';
      const isDelete = e.code === 'Backspace';
      const isLetter = e.code.startsWith('Key');
      if (!isEnter && !isDelete && !isLetter) return;
      // Held keys and a pending submission still must not navigate the browser.
      e.preventDefault();
      if (isChecking || e.repeat) return;

      if (isEnter) {
        onEnter();
      } else if (isDelete) {
        onDelete();
      } else if (isLetter) {
        // e.code will be something like "KeyA", "KeyB", etc.
        // We just want the final letter, e.g. "KeyA" -> "A"
        const letter = e.code.slice(-1);
        onChar(letter);
      }
    };

    // Consume game keys before the browser's default action (notably Safari's
    // Backspace navigation). Focused controls retain their own Enter behavior.
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, [isChecking, onEnter, onDelete, onChar]);

  return (
    <div style={{ ...style, opacity: isChecking ? 0.5 : 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: `${5 * uiScale}px`
        }}
      >
        {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((key) => (
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: `${5 * uiScale}px`
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
          maxWordLength={maxWordLength}
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
            maxWordLength={maxWordLength}
            uiScale={uiScale}
            isChecking={isChecking}
          />
        ))}
        <Key
          status={isDeleteReady ? 'canDelete' : ''}
          width={65.4}
          onClick={handleClick}
          value="DELETE"
          maxWordLength={maxWordLength}
          uiScale={uiScale}
          isChecking={isChecking}
        >
          {DELETE_TEXT}
        </Key>
      </div>
    </div>
  );

  function handleClick(value: string) {
    if (isChecking) return;
    if (value === 'ENTER') {
      onEnter();
    } else if (value === 'DELETE') {
      onDelete();
    } else {
      onChar(value);
    }
  }
}
