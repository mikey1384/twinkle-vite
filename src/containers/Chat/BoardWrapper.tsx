import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

interface ChessTopInfo {
  type: 'chess';
  moveNumber?: number;
  isFromModal?: boolean;
  userMadeLastMove?: boolean;
  pieceType?: string | null;
  from?: string;
  to?: string;
  capturedPiece?: string | null;
  boardShown?: boolean;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  isDraw?: boolean;
}

interface OmokTopInfo {
  type: 'omok';
  moveNumber?: number;
  actorLabel?: string;
  color?: 'black' | 'white';
  positionLabel?: string;
  pendingIsWinning?: boolean;
  winner?: 'you' | 'opponent' | null;
  boardShown?: boolean;
}

type TopInfo = ChessTopInfo | OmokTopInfo;

export default function BoardWrapper({
  children,
  statusShown,
  gameInfo,
  timerData,
  timerPlacement = 'overlay',
  beforeBoard,
  afterBoard,
  style,
  size = 'regular'
}: {
  children: React.ReactNode;
  statusShown?: boolean;
  gameInfo?: TopInfo;
  timerData?: {
    shown?: boolean;
    countdownNumber?: number | null;
    awaitingOpponentName?: string;
  };
  timerPlacement?: 'overlay' | 'inline';
  beforeBoard?: React.ReactNode;
  afterBoard?: React.ReactNode;
  style?: React.CSSProperties;
  size?: 'regular' | 'compact';
}) {
  const isCompact = size === 'compact';
  const headerFontSize = isCompact ? '1.1rem' : '1.5rem';
  const mobileHeaderFontSize = isCompact ? '0.9rem' : '1.2rem';
  const headerPadding = isCompact ? '0.4rem 0.75rem' : '0.5rem 1rem';
  const headerGap = isCompact ? '0.5rem' : '0.75rem';
  const boardStatusMarginTop = isCompact ? '0.35rem' : '0.5rem';
  const rowGap = isCompact ? '0.5rem' : '0.75rem';
  const mobileRowGap = isCompact ? '0.35rem' : '0.5rem';
  const countdownLargeFont = isCompact ? '2.5rem' : '3.5rem';
  const countdownRegularFont = isCompact ? '1.8rem' : '2.5rem';
  const mobileCountdownLargeFont = isCompact ? '1.75rem' : '2.5rem';
  const mobileCountdownRegularFont = isCompact ? '1.2rem' : '1.5rem';
  const awaitingMoveLabel = useMemo(() => {
    if (!timerData?.shown) return null;
    if (typeof timerData?.countdownNumber === 'number') {
      const n = timerData.countdownNumber;
      return n >= 110
        ? `${Math.floor(n / 600)}:${String(Math.floor((n % 600) / 10)).padStart(
            2,
            '0'
          )}`
        : Number((n % 600) / 10).toFixed(1);
    }
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          <span>회신 대기중</span>
          {timerData?.awaitingOpponentName ? (
            <span>{` (${timerData.awaitingOpponentName})`}</span>
          ) : null}
        </>
      );
    }
    return (
      <>
        <span>Awaiting</span>
        {timerData?.awaitingOpponentName ? (
          <span>{` ${timerData.awaitingOpponentName}'s move`}</span>
        ) : (
          <span>{` opponent's move`}</span>
        )}
      </>
    );
  }, [
    timerData?.awaitingOpponentName,
    timerData?.countdownNumber,
    timerData?.shown
  ]);

  function renderTopLeft() {
    if (!statusShown) return null;
    if (!gameInfo) return null;

    if (gameInfo.type === 'chess') {
      const {
        moveNumber,
        pieceType,
        from,
        to,
        capturedPiece,
        boardShown,
        isCheck,
        isCheckmate,
        isStalemate,
        isDraw
      } = gameInfo;
      const pair = moveNumber
        ? `${Math.ceil(moveNumber / 2)}-${moveNumber % 2 === 0 ? 2 : 1}`
        : '';
      const pieceLabel = pieceType || 'castled';
      const headerGrid = css`
        display: grid;
        grid-template-columns: ${isCompact ? 'auto auto' : 'auto 1fr'};
        column-gap: ${headerGap};
        align-items: center;
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 1fr;
          row-gap: ${isCompact ? '0.2rem' : '0.25rem'};
          align-items: start;
        }
      `;
      const moveCell = css`
        white-space: nowrap;
        align-self: center;
      `;
      const actionCell = css`
        align-self: center;
        @media (max-width: ${mobileMaxWidth}) {
          line-height: 1.25;
        }
      `;
      return (
        <div
          className={css`
            padding: ${headerPadding};
            background: ${Color.white(0.9)};
            border: 1px solid ${Color.darkGray()};
            font-size: ${headerFontSize};
            box-sizing: border-box;
            white-space: ${isCompact ? 'nowrap' : 'normal'};
            display: ${isCompact ? 'inline-block' : 'block'};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${mobileHeaderFontSize};
            }
          `}
          style={{ width: isCompact ? 'max-content' : undefined }}
        >
          <div className={headerGrid}>
            <div className={moveCell}>
              {moveNumber ? (
                <span>
                  Move <b>{pair}</b>:
                </span>
              ) : null}
            </div>
            <div className={actionCell}>
              <b>{pieceLabel}</b>
              {boardShown && pieceType ? (
                <>
                  <span>{' from '}</span>
                  <b>{from}</b>
                  <span>{' to '}</span>
                  <b>{to}</b>
                  {capturedPiece ? (
                    <>
                      <span>{' capturing '}</span>
                      <span>{capturedPiece === 'queen' ? 'the ' : 'a '}</span>
                      <b>{capturedPiece}</b>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
          {boardShown && (isCheck || isCheckmate || isStalemate || isDraw) ? (
            <div
              className={css`
                font-weight: bold;
                margin-top: ${boardStatusMarginTop};
              `}
            >
              {isCheckmate
                ? 'Checkmate!'
                : isStalemate
                ? 'Stalemate!'
                : isDraw
                ? `It's a draw...`
                : isCheck
                ? 'Check!'
                : ''}
            </div>
          ) : null}
        </div>
      );
    }

    const {
      moveNumber,
      color,
      positionLabel,
      pendingIsWinning,
      winner,
      boardShown
    } = gameInfo;
    return (
      <div
        className={css`
          padding: ${headerPadding};
          background: ${Color.white(0.9)};
          border: 1px solid ${Color.darkGray()};
          font-size: ${headerFontSize};
          display: flex;
          flex-wrap: ${isCompact ? 'nowrap' : 'wrap'};
          align-items: center;
          gap: ${headerGap};
          box-sizing: border-box;
          white-space: ${isCompact ? 'nowrap' : 'normal'};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${mobileHeaderFontSize};
          }
        `}
        style={{
          width: isCompact ? 'max-content' : undefined,
          display: isCompact ? 'inline-flex' : undefined
        }}
      >
        {moveNumber ? (
          <span>
            Move <b>{moveNumber}</b>:
          </span>
        ) : null}
        {boardShown && color && positionLabel ? (
          <span>
            <b>{color}</b> stone at <b>{positionLabel}</b>
          </span>
        ) : null}
        {pendingIsWinning ? (
          <span>
            <b>Five in a row!</b> Confirm to seal the win.
          </span>
        ) : null}
        {winner ? <span>五目!</span> : null}
      </div>
    );
  }

  const gridClass = css`
    display: grid;
    grid-template-rows: auto auto auto auto auto;
    row-gap: ${rowGap};
    width: 100%;
    align-items: start;
    justify-items: start;
    @media (max-width: ${mobileMaxWidth}) {
      row-gap: ${mobileRowGap};
    }
  `;

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <div className={gridClass}>
        <div style={{ justifySelf: 'start' }}>{renderTopLeft()}</div>

        <div style={{ justifySelf: 'center' }}>{beforeBoard}</div>

        <div
          style={{
            justifySelf: 'center',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {children}
        </div>

        <div style={{ justifySelf: 'center' }}>{afterBoard}</div>

        {timerPlacement === 'inline' ? (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              justifySelf: 'end'
            }}
          >
            {timerData?.shown ? (
              <div
                className={css`
                  padding: 0.5rem 1rem;
                  background: ${Color.white(0.9)};
                  border: 1px solid ${Color.darkGray()};
                  font-size: ${typeof timerData?.countdownNumber === 'number' &&
                  (timerData?.countdownNumber as number) < 110
                    ? countdownLargeFont
                    : countdownRegularFont};
                  font-weight: bold;
                  color: ${typeof timerData?.countdownNumber === 'number' &&
                  (timerData?.countdownNumber as number) < 110
                    ? 'red'
                    : ''};
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: ${typeof timerData?.countdownNumber ===
                      'number' && (timerData?.countdownNumber as number) < 110
                      ? mobileCountdownLargeFont
                      : mobileCountdownRegularFont};
                  }
                `}
              >
                {awaitingMoveLabel}
              </div>
            ) : null}
          </div>
        ) : (
          <div />
        )}
      </div>

      {timerPlacement === 'overlay' ? (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            zIndex: 6
          }}
        >
          {timerData?.shown ? (
            <div
              className={css`
                padding: 0.5rem 1rem;
                background: ${Color.white(0.9)};
                border: 1px solid ${Color.darkGray()};
                font-size: ${typeof timerData?.countdownNumber === 'number' &&
                timerData.countdownNumber < 110
                  ? countdownLargeFont
                  : countdownRegularFont};
                font-weight: bold;
                color: ${typeof timerData?.countdownNumber === 'number' &&
                timerData.countdownNumber < 110
                  ? 'red'
                  : ''};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: ${typeof timerData?.countdownNumber === 'number' &&
                  timerData.countdownNumber < 110
                    ? mobileCountdownLargeFont
                    : mobileCountdownRegularFont};
                }
              `}
            >
              {awaitingMoveLabel}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
