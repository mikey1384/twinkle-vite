import React, { useEffect, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';

interface GameRecordProps {
  channelId: number;
  messageId: number;
  showPgn?: boolean;
  style?: React.CSSProperties;
}

export default function GameRecord(props: GameRecordProps) {
  const userId = useKeyContext((v) => v.myState.userId);
  return (
    <GameRecordContent
      key={`${userId}:${props.channelId}:${props.messageId}:${!!props.showPgn}`}
      {...props}
    />
  );
}

// Reveal chips for a finished chat chess game: FEN of this message's
// position, plus the full game PGN on the game's final message. The server
// only returns data for concluded games, so tapping mid-game answers with
// the "revealed when the game ends" note instead of leaking the position.
function GameRecordContent({
  channelId,
  messageId,
  showPgn,
  style
}: GameRecordProps) {
  const fetchChessGameRecord = useAppContext(
    (v) => v.requestHelpers.fetchChessGameRecord
  );
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'unfinished' | 'loaded' | 'error'
  >('idle');
  const [record, setRecord] = useState<any>(null);
  const [copied, setCopied] = useState('');
  const copyTimerRef = useRef<any>(null);
  const mounted = useRef(true);
  const pending = useRef(false);
  const copyVersion = useRef(0);
  const [copyError, setCopyError] = useState('');
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      copyVersion.current++;
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  return (
    <ErrorBoundary componentPath="Chat/Chess/GameRecord">
      <div
        style={style}
        className={css`
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow-wrap: anywhere;
          line-height: 1.5;
          button {
            min-height: 44px;
            max-width: 100%;
            font-family: inherit;
          }
          button:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: 2px;
          }
          font-size: 14px;
          color: ${Color.darkerGray()};
        `}
      >
        {copyError && (
          <p role="alert" style={{ fontSize: 14, lineHeight: 1.5 }}>
            {copyError}
          </p>
        )}
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
                  font-size: 14px;
                  color: ${Color.darkerGray()};
                `}
              >
                The FEN and PGN are revealed when the game ends.
              </div>
            )}
            {status === 'error' && (
              <div
                role="alert"
                className={css`
                  font-size: 14px;
                  color: ${Color.darkerGray()};
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
                font-size: 14px;
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
                  font-size: 14px;
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
                  flex: 1 1 0;
                  min-width: 0;
                  font-family: monospace;
                  font-size: 14px;
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
                    tabIndex={0}
                    aria-label="PGN move list"
                    className={css`
                      flex: 1 1 0;
                      min-width: 0;
                      margin: 0;
                      font-family: monospace;
                      font-size: 14px;
                      white-space: pre-wrap;
                      word-break: break-word;
                      max-height: 240px;
                      &:focus-visible {
                        outline: 2px solid currentColor;
                        outline-offset: 2px;
                      }
                      overflow-y: auto;
                      padding: 0.5rem 0.7rem;
                      background: #fff;
                      border: 1px solid ${Color.borderGray()};
                      border-radius: 4px;
                      @media (max-width: ${mobileMaxWidth}) {
                        max-height: 180px;
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
                    font-size: 14px;
                    color: ${Color.darkerGray()};
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
        aria-label={
          copied === kind
            ? `${kind.toUpperCase()} copied`
            : `Copy ${kind.toUpperCase()}`
        }
        onClick={() => handleCopy(kind, text)}
        className={css`
          flex-shrink: 0;
          border: 1px solid ${Color.borderGray()};
          background: #fff;
          color: ${Color.darkerGray()};
          border-radius: 4px;
          padding: 0.5rem 0.8rem;
          font-size: 14px;
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
    if (pending.current || !mounted.current) return;
    pending.current = true;
    setStatus('loading');
    try {
      if (
        ![channelId, messageId].every(
          (id) => Number.isSafeInteger(id) && id > 0
        )
      )
        throw new Error('Invalid record');
      const data = await fetchChessGameRecord({ channelId, messageId });
      if (!mounted.current) return;
      if (data?.finished === true) {
        if (
          typeof data.fen !== 'string' ||
          !data.fen.trim() ||
          (data.pgn != null && typeof data.pgn !== 'string')
        )
          throw new Error('Invalid record');
        setRecord(data);
        setStatus('loaded');
      } else if (data?.finished === false) {
        setStatus('unfinished');
      } else throw new Error('Invalid record response');
    } catch {
      if (mounted.current) setStatus('error');
    } finally {
      if (mounted.current) pending.current = false;
    }
  }

  async function handleCopy(kind: string, text: string) {
    const version = ++copyVersion.current;
    setCopyError('');
    setCopied('');
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(text);
      if (!mounted.current || version !== copyVersion.current) return;
      setCopied(kind);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(''), 1500);
    } catch {
      if (mounted.current && version === copyVersion.current)
        setCopyError(
          'Could not copy. Select the record text and copy it manually.'
        );
    }
  }
}
