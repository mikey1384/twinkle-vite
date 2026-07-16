import React, { useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';

// Reveal chips for a finished chat chess game: FEN of this message's
// position, plus the full game PGN on the game's final message. The server
// only returns data for concluded games, so tapping mid-game answers with
// the "revealed when the game ends" note instead of leaking the position.
export default function GameRecord({
  channelId,
  messageId,
  showPgn,
  style
}: {
  channelId: number;
  messageId: number;
  showPgn?: boolean;
  style?: React.CSSProperties;
}) {
  const fetchChessGameRecord = useAppContext(
    (v) => v.requestHelpers.fetchChessGameRecord
  );
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'unfinished' | 'loaded' | 'error'
  >('idle');
  const [record, setRecord] = useState<any>(null);
  const [copied, setCopied] = useState('');
  const copyTimerRef = useRef<any>(null);

  return (
    <ErrorBoundary componentPath="Chat/Chess/GameRecord">
      <div
        style={style}
        className={css`
          width: 100%;
          font-size: 1.1rem;
          color: ${Color.darkerGray()};
        `}
      >
        {status !== 'loaded' ? (
          // The message stays mounted when the game later concludes, so the
          // unfinished/error states must keep a retry button instead of
          // dead-ending into static text.
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5rem;
            `}
          >
            {status === 'unfinished' && (
              <div
                className={css`
                  font-size: 1.1rem;
                  color: ${Color.gray()};
                `}
              >
                The FEN and PGN are revealed when the game ends.
              </div>
            )}
            {status === 'error' && (
              <div
                className={css`
                  font-size: 1.1rem;
                  color: ${Color.gray()};
                `}
              >
                Could not load the game record.
              </div>
            )}
            <button
              type="button"
              disabled={status === 'loading'}
              onClick={handleReveal}
              className={css`
                border: 1px solid ${Color.borderGray()};
                background: #fff;
                color: ${Color.darkerGray()};
                border-radius: 5px;
                padding: 0.5rem 1rem;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                &:hover {
                  background: ${Color.highlightGray()};
                }
                &:disabled {
                  opacity: 0.6;
                  cursor: default;
                }
              `}
            >
              {status === 'loading'
                ? 'Loading...'
                : status === 'unfinished'
                ? 'Check Again'
                : status === 'error'
                ? 'Try Again'
                : showPgn
                ? 'Show FEN & PGN'
                : 'Show FEN'}
            </button>
          </div>
        ) : (
          <div
            className={css`
              border: 1px solid ${Color.borderGray()};
              border-radius: 5px;
              background: ${Color.wellGray(0.4)};
              padding: 1rem;
              display: flex;
              flex-direction: column;
              gap: 0.7rem;
            `}
          >
            {record?.white && record?.black && (
              <div
                className={css`
                  font-size: 1.1rem;
                  font-weight: bold;
                `}
              >
                {record.white.username} vs {record.black.username}
                {record.result && record.result !== '*'
                  ? ` · ${record.result}`
                  : ''}
              </div>
            )}
            <div
              className={css`
                display: flex;
                align-items: flex-start;
                gap: 0.7rem;
              `}
            >
              <div
                className={css`
                  flex-grow: 1;
                  font-family: monospace;
                  font-size: 1.1rem;
                  word-break: break-all;
                  padding: 0.5rem 0.7rem;
                  background: #fff;
                  border: 1px solid ${Color.borderGray()};
                  border-radius: 4px;
                `}
              >
                {record?.fen}
              </div>
              {renderCopyButton('fen', record?.fen)}
            </div>
            {showPgn &&
              (record?.pgn ? (
                <div
                  className={css`
                    display: flex;
                    align-items: flex-start;
                    gap: 0.7rem;
                  `}
                >
                  <pre
                    className={css`
                      flex-grow: 1;
                      margin: 0;
                      font-family: monospace;
                      font-size: 1.1rem;
                      white-space: pre-wrap;
                      word-break: break-word;
                      max-height: 20rem;
                      overflow-y: auto;
                      padding: 0.5rem 0.7rem;
                      background: #fff;
                      border: 1px solid ${Color.borderGray()};
                      border-radius: 4px;
                      @media (max-width: ${mobileMaxWidth}) {
                        max-height: 15rem;
                      }
                    `}
                  >
                    {record.pgn}
                  </pre>
                  {renderCopyButton('pgn', record.pgn)}
                </div>
              ) : (
                <div
                  className={css`
                    font-size: 1.1rem;
                    color: ${Color.gray()};
                  `}
                >
                  The move list could not be reconstructed for this game, so
                  only the FEN is available.
                </div>
              ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  function renderCopyButton(kind: string, text?: string) {
    if (!text) return null;
    return (
      <button
        type="button"
        onClick={() => handleCopy(kind, text)}
        className={css`
          flex-shrink: 0;
          border: 1px solid ${Color.borderGray()};
          background: #fff;
          color: ${Color.darkerGray()};
          border-radius: 4px;
          padding: 0.5rem 0.8rem;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          &:hover {
            background: ${Color.highlightGray()};
          }
        `}
      >
        {copied === kind ? 'Copied!' : 'Copy'}
      </button>
    );
  }

  async function handleReveal() {
    setStatus('loading');
    try {
      const data = await fetchChessGameRecord({ channelId, messageId });
      if (data?.finished) {
        setRecord(data);
        setStatus('loaded');
      } else {
        setStatus('unfinished');
      }
    } catch {
      setStatus('error');
    }
  }

  async function handleCopy(kind: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(''), 1500);
    } catch {
      // Clipboard can be unavailable (permissions); the text stays visible
      // and selectable, so there is nothing further to do.
    }
  }
}
