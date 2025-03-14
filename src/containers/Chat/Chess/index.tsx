import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Game from './Game';
import FallenPieces from './FallenPieces';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import RewindRequestButton from './RewindRequestButton';
import PromotionModal from './PromotionModal';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { initializeChessBoard, getPositionId } from './helpers/model.js';
import {
  checkerPos,
  getPieceIndex,
  isGameOver,
  isPossibleAndLegal,
  kingWillBeCapturedBy,
  returnBoardAfterMove,
  highlightPossiblePathsFromSrc,
  getOpponentPlayerColor,
  getPlayerPieces
} from './helpers/model';
import { isMobile } from '~/helpers';
import { useChatContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

export default function Chess({
  countdownNumber,
  channelId,
  gameWinnerId,
  interactable,
  initialState,
  isFromModal,
  messageId,
  lastChessMessageId,
  loaded,
  moveViewed,
  newChessState,
  onBoardClick,
  onChessMove,
  onAcceptRewind,
  onCancelRewindRequest,
  onDeclineRewind,
  onDiscussClick,
  onRewindClick = () => null,
  onSpoilerClick,
  opponentId = 0,
  opponentName = '',
  rewindRequestId,
  senderId = 0,
  senderName,
  spoilerOff,
  style
}: {
  channelId: number;
  rewindRequestMessageSenderId?: number;
  countdownNumber?: number;
  gameWinnerId?: number;
  interactable?: boolean;
  initialState: any;
  isFromModal?: boolean;
  lastChessMessageId?: number;
  loaded: boolean;
  messageId?: number;
  moveViewed?: boolean;
  myId: number;
  newChessState?: any;
  onBoardClick?: () => void;
  onChessMove?: (v: any) => void;
  onAcceptRewind?: (v: any) => void;
  onCancelRewindRequest?: () => void;
  onDeclineRewind?: () => void;
  onDiscussClick?: () => void;
  onRewindClick?: () => void;
  onSpoilerClick?: (v: number) => void;
  opponentId?: number;
  opponentName?: string;
  rewindRequestId?: number;
  senderId?: number;
  senderName?: string;
  spoilerOff?: boolean;
  style?: React.CSSProperties;
}) {
  const { userId, banned } = useKeyContext((v) => v.myState);
  const creatingNewDMChannel = useChatContext(
    (v) => v.state.creatingNewDMChannel
  );
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const playerColors = useRef({
    [userId]: 'white',
    [opponentId]: 'black'
  });
  const [squares, setSquares] = useState<any[]>([]);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [whiteFallenPieces, setWhiteFallenPieces] = useState<any[]>([]);
  const [blackFallenPieces, setBlackFallenPieces] = useState<any[]>([]);
  const [highlighted, setHighlighted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [status, setStatus] = useState('');
  const [gameOverMsg, setGameOverMsg] = useState('');

  const [promotionData, setPromotionData] = useState<any>(null);

  const fallenPieces: React.RefObject<any> = useRef({
    white: [],
    black: []
  });
  const enPassantTarget: React.RefObject<any> = useRef(null);
  const capturedPiece: React.RefObject<any> = useRef(null);

  const boardState = useMemo(
    () => (initialState ? { ...initialState } : null),
    [initialState]
  );

  const awaitingMoveLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          {opponentName ? <p>{`${opponentName}님의`}</p> : null}
          <p>회신 대기중</p>
        </>
      );
    }
    return (
      <>
        <p>Awaiting</p>
        {opponentName ? <p>{`${opponentName}'s move`}</p> : null}
      </>
    );
  }, [opponentName]);

  const move = useMemo(() => {
    if (boardState) {
      return boardState.move;
    } else {
      return {};
    }
  }, [boardState]);

  const myColor = useMemo(
    () => boardState?.playerColors?.[userId] || 'white',
    [userId, boardState]
  );

  const userMadeLastMove = useMemo(
    () => move?.by === userId,
    [move?.by, userId]
  );
  const isCheck = boardState?.isCheck;
  const isCheckmate = boardState?.isCheckmate;
  const isStalemate = boardState?.isStalemate;
  const isRewinded = boardState?.isRewinded;
  const isDiscussion = boardState?.isDiscussion;
  const isDraw = boardState?.isDraw;
  const gameStateText = isCheckmate
    ? 'Checkmate!'
    : isStalemate
    ? 'Stalemate!'
    : isDraw
    ? `It's a draw...`
    : isCheck
    ? 'Check!'
    : '';

  useEffect(() => {
    if (!newChessState) {
      playerColors.current = boardState
        ? boardState.playerColors
        : {
            [userId]: 'white',
            [opponentId]: 'black'
          };
      setSquares(
        initializeChessBoard({ initialState, loading: !loaded, myId: userId })
      );
      capturedPiece.current = null;
      if (boardState) {
        enPassantTarget.current = boardState.enPassantTarget || null;
        setBlackFallenPieces(boardState.fallenPieces?.black);
        setWhiteFallenPieces(boardState.fallenPieces?.white);
        fallenPieces.current = boardState?.fallenPieces;
      } else {
        enPassantTarget.current = null;
        setBlackFallenPieces([]);
        setWhiteFallenPieces([]);
        fallenPieces.current = {
          white: [],
          black: []
        };
      }
      if (interactable && !userMadeLastMove) {
        setSquares((prevSquares) =>
          prevSquares.map((square) =>
            square.color === playerColors.current[userId]
              ? {
                  ...square,
                  state:
                    gameOverMsg || ['check', 'checkmate'].includes(square.state)
                      ? square.state
                      : 'highlighted'
                }
              : square
          )
        );
        setGameOverMsg('');
        setStatus('');
      }
    }
  }, [
    gameOverMsg,
    initialState,
    interactable,
    loaded,
    userId,
    newChessState,
    opponentId,
    boardState,
    userMadeLastMove
  ]);

  const handleMove = useCallback(
    ({
      newSquares,
      dest,
      isCheck,
      isDraw,
      isCheckmate,
      isStalemate
    }: {
      newSquares: any[];
      dest?: number;
      isCheck: boolean;
      isDraw?: boolean;
      isCheckmate: boolean;
      isStalemate: boolean;
    }) => {
      const moveNumber = move.number ? move.number + 1 : 1;
      const moveDetail =
        typeof dest === 'number'
          ? {
              piece: {
                ...squares[selectedIndex],
                state: 'blurred',
                isPiece: false
              },
              from: getPositionId({ index: selectedIndex, myColor }),
              to: getPositionId({ index: dest, myColor }),
              srcIndex: myColor === 'black' ? 63 - selectedIndex : selectedIndex
            }
          : {};
      onChessMove?.({
        state: {
          move: {
            number: moveNumber,
            by: userId,
            ...moveDetail
          },
          capturedPiece: capturedPiece.current?.type,
          playerColors: playerColors.current || {
            [userId]: 'white',
            [opponentId]: 'black'
          },
          board: (myColor === 'black'
            ? newSquares.map(
                (square, index) => newSquares[newSquares.length - 1 - index]
              )
            : newSquares
          ).map((square) =>
            square.state === 'highlighted'
              ? { ...square, state: '' }
              : square.state === 'check' && isCheckmate
              ? { ...square, state: 'checkmate' }
              : square
          ),
          fallenPieces: fallenPieces.current,
          enPassantTarget: enPassantTarget.current,
          isCheck,
          isCheckmate,
          isDraw,
          isStalemate
        },
        isCheckmate,
        isStalemate,
        moveNumber
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [move.number, myColor, userId, opponentId, selectedIndex, squares]
  );

  const processResult = useCallback(
    ({
      myKingIndex,
      newSquares,
      dest,
      src
    }: {
      myKingIndex: number;
      newSquares: any[];
      dest?: number;
      src?: number;
    }) => {
      let isCheck = false;
      const newWhiteFallenPieces = [...whiteFallenPieces];
      const newBlackFallenPieces = [...blackFallenPieces];
      const potentialCapturers = kingWillBeCapturedBy({
        kingIndex: myKingIndex,
        myColor,
        squares: newSquares
      });
      if (potentialCapturers.length > 0) {
        setSquares((prevSquares) =>
          prevSquares.map((square, index) => {
            if (potentialCapturers.includes(index)) {
              return {
                ...square,
                state: 'danger'
              };
            }
            return {
              ...square,
              state: square.state === 'danger' ? '' : square.state
            };
          })
        );
        setStatus('Your King will be captured if you make that move.');
        return {};
      }
      if (typeof dest === 'number') {
        if (typeof src === 'number' && squares[src].type === 'pawn') {
          if (enPassantTarget.current) {
            const srcColumn = src % 8;
            const destRow = Math.floor(dest / 8);
            const destColumn = dest % 8;
            const enPassantTargetRow = Math.floor(enPassantTarget.current / 8);
            const enPassantTargetColumn = enPassantTarget.current % 8;
            const attacking =
              Math.abs(srcColumn - destColumn) === 1 &&
              destColumn === enPassantTargetColumn &&
              destRow === enPassantTargetRow - 1;
            const enPassanting = !squares[dest].isPiece && attacking;
            if (enPassanting) {
              myColor === 'white'
                ? newBlackFallenPieces.push(squares[enPassantTarget.current])
                : newWhiteFallenPieces.push(squares[enPassantTarget.current]);
              capturedPiece.current = squares[enPassantTarget.current];
            }
          }
        }
        if (squares[dest].isPiece) {
          squares[dest].color === 'white'
            ? newWhiteFallenPieces.push(squares[dest])
            : newBlackFallenPieces.push(squares[dest]);
          capturedPiece.current = squares[dest];
        }
      }
      setSelectedIndex(-1);
      const theirKingIndex = getPieceIndex({
        color: getOpponentPlayerColor(myColor),
        squares: newSquares,
        type: 'king'
      });
      if (
        checkerPos({
          squares: newSquares,
          kingIndex: theirKingIndex,
          myColor
        }).length !== 0
      ) {
        newSquares[theirKingIndex] = {
          ...newSquares[theirKingIndex],
          state: 'check'
        };
        isCheck = true;
      }
      if (typeof dest === 'number') {
        newSquares[dest].moved = true;
      }
      setSquares(newSquares);
      setWhiteFallenPieces(newWhiteFallenPieces);
      setBlackFallenPieces(newBlackFallenPieces);
      fallenPieces.current = {
        white: newWhiteFallenPieces,
        black: newBlackFallenPieces
      };
      setStatus('');
      if (typeof dest === 'number' && typeof src === 'number') {
        const target =
          newSquares[dest]?.type === 'pawn' && dest === src - 16
            ? 63 - dest
            : null;

        enPassantTarget.current = target;
      }
      const gameOver = isGameOver({
        squares: newSquares,
        enPassantTarget: enPassantTarget.current,
        myColor
      });
      if (gameOver) {
        if (gameOver === 'Checkmate') {
          setSquares((prevSquares) =>
            prevSquares.map((square, index) =>
              index === theirKingIndex
                ? { ...square, state: 'checkmate' }
                : square
            )
          );
        }
        setGameOverMsg(gameOver);
      }
      return {
        moved: true,
        isCheck,
        isCheckmate: gameOver === 'Checkmate',
        isStalemate: gameOver === 'Stalemate',
        isDraw: gameOver === 'Draw'
      };
    },
    [blackFallenPieces, myColor, squares, whiteFallenPieces]
  );

  const handlePromote = useCallback(
    (chosenPieceType: string) => {
      if (!promotionData) return;

      const { src, dest, squaresAfterMove } = promotionData;

      squaresAfterMove[dest] = {
        ...squaresAfterMove[dest],
        type: chosenPieceType
      };

      const myKingIndex = getPieceIndex({
        color: myColor,
        squares: squaresAfterMove,
        type: 'king'
      });

      const { moved, isCheck, isCheckmate, isStalemate, isDraw } =
        processResult({
          myKingIndex,
          newSquares: squaresAfterMove,
          dest,
          src
        });

      if (moved) {
        handleMove({
          newSquares: squaresAfterMove,
          dest,
          isCheck,
          isCheckmate,
          isStalemate,
          isDraw
        });
      }

      setPromotionData(null);
    },
    [promotionData, processResult, handleMove, myColor]
  );

  const handleClick = useCallback(
    (index: number) => {
      if (!interactable || newChessState || userMadeLastMove) return;
      if (selectedIndex === -1) {
        if (!squares[index] || squares[index].color !== myColor) {
          return;
        }
        setSquares((prevSquares) =>
          highlightPossiblePathsFromSrc({
            squares: prevSquares,
            src: index,
            enPassantTarget: enPassantTarget.current,
            myColor
          })
        );
        setStatus('');
        setSelectedIndex(index);
      } else {
        if (squares[index] && squares[index].color === myColor) {
          setSelectedIndex(index);
          setStatus('');
          setSquares((prevSquares) =>
            highlightPossiblePathsFromSrc({
              squares: prevSquares,
              src: index,
              enPassantTarget: enPassantTarget.current,
              myColor
            })
          );
        } else {
          if (
            isPossibleAndLegal({
              src: selectedIndex,
              dest: index,
              squares,
              enPassantTarget: enPassantTarget.current,
              myColor
            })
          ) {
            const pieceType = squares[selectedIndex].type;
            const finalRow = 0;
            const destRow = Math.floor(index / 8);

            const newSquares = returnBoardAfterMove({
              squares,
              src: selectedIndex,
              dest: index,
              enPassantTarget: enPassantTarget.current
            });
            const myKingIndex = getPieceIndex({
              color: myColor,
              squares: newSquares,
              type: 'king'
            });

            if (pieceType === 'pawn' && destRow === finalRow) {
              setPromotionData({
                src: selectedIndex,
                dest: index,
                squaresAfterMove: newSquares
              });
              return;
            }

            const { moved, isCheck, isCheckmate, isDraw, isStalemate } =
              processResult({
                myKingIndex,
                newSquares,
                dest: index,
                src: selectedIndex
              });
            if (moved) {
              handleMove({
                newSquares,
                dest: index,
                isCheck,
                isCheckmate,
                isStalemate,
                isDraw
              });
            }
          }
        }
      }
    },
    [
      handleMove,
      interactable,
      myColor,
      newChessState,
      processResult,
      selectedIndex,
      squares,
      userMadeLastMove
    ]
  );

  const handleSpoilerClick = useCallback(() => {
    if (
      banned?.chess ||
      selectedChannelId !== channelId ||
      senderId === userId ||
      creatingNewDMChannel
    ) {
      return;
    }
    onSpoilerClick?.(senderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    banned?.chess,
    channelId,
    creatingNewDMChannel,
    selectedChannelId,
    senderId,
    userId
  ]);

  const handleCastling = useCallback(
    (direction: string) => {
      const actualSquares = squares.map((square) =>
        square.isPiece ? square : {}
      );
      const { playerPieces } = getPlayerPieces({
        color: getOpponentPlayerColor(myColor),
        squares: actualSquares
      });
      const kingPos = getPieceIndex({
        color: myColor,
        squares: actualSquares,
        type: 'king'
      });
      let rookPos = -1;
      let kingMidDest = -1;
      let kingEndDest = -1;

      if (direction === 'right') {
        rookPos = 63;
        if (myColor === 'white') {
          kingMidDest = 61;
          kingEndDest = 62;
        } else {
          kingMidDest = 60;
          kingEndDest = 61;
        }
      } else {
        rookPos = 56;
        if (myColor === 'white') {
          kingMidDest = 59;
          kingEndDest = 58;
        } else {
          kingMidDest = 58;
          kingEndDest = 57;
        }
      }

      for (const piece of playerPieces) {
        if (
          isPossibleAndLegal({
            src: piece.index,
            dest: kingMidDest,
            squares: actualSquares,
            myColor
          })
        ) {
          setSquares(
            actualSquares.map((square, index) => {
              if (index === piece.index) {
                return {
                  ...square,
                  state: 'danger'
                };
              }
              return {
                ...square,
                state: square.state === 'danger' ? '' : square.state
              };
            })
          );
          setStatus(
            `Castling not allowed because the king cannot pass through a square that is attacked by an enemy piece`
          );
          return;
        }
      }
      const rookDest = kingMidDest;
      const newSquares = returnBoardAfterMove({
        squares: returnBoardAfterMove({
          squares: actualSquares,
          src: kingPos,
          dest: kingEndDest,
          isCastling: true
        }),
        src: rookPos,
        dest: rookDest,
        kingEndDest,
        isCastling: true
      });
      const { moved, isCheck, isCheckmate, isStalemate } = processResult({
        myKingIndex: kingEndDest,
        newSquares
      });
      if (moved) {
        handleMove({ newSquares, isCheck, isCheckmate, isStalemate });
      }
    },
    [handleMove, myColor, processResult, squares]
  );

  const statusMsgShown = useMemo(() => {
    const isCountdownShown = !!countdownNumber;
    const isLastChessMessage =
      lastChessMessageId && (messageId || 0) >= lastChessMessageId;
    const isGameOver = isCheckmate || isDraw || isStalemate;
    const shouldHideStatus = isGameOver || isDiscussion || moveViewed;

    if (isCountdownShown) {
      return true;
    }

    const isActiveGame =
      (isLastChessMessage || isFromModal) &&
      !shouldHideStatus &&
      loaded &&
      userMadeLastMove;

    return isActiveGame;
  }, [
    countdownNumber,
    isCheckmate,
    isDiscussion,
    isDraw,
    isFromModal,
    isStalemate,
    lastChessMessageId,
    loaded,
    messageId,
    moveViewed,
    userMadeLastMove
  ]);

  const gameStatusMessageShown = useMemo(() => {
    return (
      loaded &&
      boardState &&
      (userMadeLastMove ||
        spoilerOff ||
        isRewinded ||
        isCheckmate ||
        isStalemate ||
        isDiscussion ||
        isDraw)
    );
  }, [
    boardState,
    isCheckmate,
    isDiscussion,
    isDraw,
    isRewinded,
    isStalemate,
    loaded,
    spoilerOff,
    userMadeLastMove
  ]);

  const chessBoardShown = useMemo(() => {
    return (
      spoilerOff ||
      userMadeLastMove ||
      !!isCheckmate ||
      !!isDiscussion ||
      !!isStalemate ||
      !!isRewinded ||
      !!isDraw
    );
  }, [
    spoilerOff,
    userMadeLastMove,
    isCheckmate,
    isDiscussion,
    isStalemate,
    isRewinded,
    isDraw
  ]);

  const dropdownProps = useMemo(() => {
    const result = [
      {
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon icon="comments" />
            <span style={{ marginLeft: '1rem' }}>Discuss</span>
          </div>
        ),
        onClick: handleDiscussClick
      }
    ];
    if (lastChessMessageId !== messageId && !!initialState?.previousState) {
      result.push({
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon icon="clock-rotate-left" />
            <span style={{ marginLeft: '1rem' }}>Propose Retry</span>
          </div>
        ),
        onClick: onRewindClick
      });
    }
    return result;

    function handleDiscussClick() {
      const spoilerIsShownAndGameIsInProgress =
        lastChessMessageId &&
        messageId === lastChessMessageId &&
        userMadeLastMove &&
        !isCheckmate &&
        !isDiscussion &&
        !isStalemate &&
        !isRewinded &&
        !isDraw;
      if (spoilerIsShownAndGameIsInProgress) {
        return setConfirmModalShown(true);
      }
      onDiscussClick?.();
    }
  }, [
    initialState?.previousState,
    isCheckmate,
    isDiscussion,
    isDraw,
    isRewinded,
    isStalemate,
    lastChessMessageId,
    messageId,
    onDiscussClick,
    onRewindClick,
    userMadeLastMove
  ]);

  const gameDropdownButtonShown = useMemo(() => {
    return (
      chessBoardShown &&
      !isDiscussion &&
      !!dropdownProps?.length &&
      loaded &&
      boardState &&
      !isCheckmate &&
      !isStalemate &&
      !isDraw
    );
  }, [
    chessBoardShown,
    isDiscussion,
    boardState,
    dropdownProps?.length,
    isCheckmate,
    isDraw,
    isStalemate,
    loaded
  ]);

  return (
    <div
      className={css`
        .menu-button {
          display: ${highlighted ? 'block' : 'none'};
          @media (max-width: ${mobileMaxWidth}) {
            display: block;
          }
        }
      `}
      style={{
        position: 'relative',
        background: isDiscussion ? 'none' : Color.wellGray(),
        ...style
      }}
    >
      {gameDropdownButtonShown ? (
        <div
          className={css`
            position: absolute;
            top: 1rem;
            right: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              right: 0;
              top: 0;
            }
          `}
        >
          <DropdownButton
            skeuomorphic
            buttonStyle={{
              fontSize: '1rem',
              lineHeight: 1
            }}
            className="menu-button"
            color="darkerGray"
            icon={deviceIsMobile ? 'chevron-down' : 'ellipsis-h'}
            menuProps={dropdownProps}
            onDropdownShown={setHighlighted}
          />
        </div>
      ) : null}
      {gameStatusMessageShown ? (
        <div
          className={css`
            top: 1rem;
            left: 1rem;
            padding: 0.5rem 1rem;
            background: ${Color.white(0.9)};
            border: 1px solid ${Color.darkGray()};
            position: absolute;
            font-size: 1.5rem;
            z-index: 5;
            @media (max-width: ${mobileMaxWidth}) {
              top: 0;
              left: 0.5rem;
              width: CALC(100% - 5rem);
              position: relative;
              font-size: 1.2rem;
              p {
                display: inline;
              }
            }
          `}
        >
          {move.number && (
            <span>
              Move{' '}
              {`${Math.ceil(move.number / 2)}-${move.number % 2 === 0 ? 2 : 1}`}
              :{' '}
            </span>
          )}
          <span>
            {isFromModal && (
              <>
                {userMadeLastMove ? 'You' : opponentName}
                {move.piece && <span>{' moved '}</span>}
              </>
            )}
          </span>
          {isFromModal && !move.piece && <span> </span>}
          <div
            className={css`
              display: ${move.piece ? 'block' : 'inline'};
              @media (max-width: ${mobileMaxWidth}) {
                display: inline;
              }
            `}
          >
            {isFromModal && move.piece && (
              <>
                {move.piece?.type === 'queen' || move.piece?.type === 'king'
                  ? 'the '
                  : 'a '}
              </>
            )}
            {move.piece ? <b>{move.piece?.type}</b> : <b>castled</b>}
            {chessBoardShown && (
              <>
                {move.piece?.type && (
                  <>
                    {' '}
                    <span>
                      from <b>{move.from}</b>
                    </span>{' '}
                    <span>
                      to <b>{move.to}</b>
                    </span>
                    {boardState?.capturedPiece && (
                      <>
                        {' '}
                        <span>capturing</span>{' '}
                        <span>
                          {boardState?.capturedPiece === 'queen' ? 'the' : 'a'}{' '}
                        </span>
                        <b>{boardState?.capturedPiece}</b>
                      </>
                    )}
                  </>
                )}
                {(isCheck || isCheckmate || isStalemate || isDraw) && (
                  <div
                    className={css`
                      font-weight: bold;
                      margin-top: 1rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        margin-top: 1rem;
                      }
                    `}
                  >
                    {gameStateText}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
      <div
        className={css`
          user-select: none;
          font: 14px 'Century Gothic', Futura, sans-serif;
          .dark {
            background-color: ${Color.sandyBrown()};
          }

          .dark.arrived {
            background-color: ${Color.brownOrange(0.8)};
          }

          .dark.blurred {
            background-color: ${Color.brownOrange(0.8)};
          }

          .dark.highlighted {
            background-color: RGB(164, 236, 137);
          }

          .dark.check {
            background-color: ${Color.orange()};
          }

          .dark.danger {
            background-color: yellow;
          }

          .dark.checkmate {
            background-color: red;
          }

          .light {
            background-color: ${Color.ivory()};
          }

          .light.arrived {
            background-color: ${Color.brownOrange(0.3)};
          }

          .light.blurred {
            background-color: ${Color.brownOrange(0.3)};
          }

          .light.highlighted {
            background-color: RGB(174, 255, 196);
          }

          .light.check {
            background-color: ${Color.orange()};
          }

          .light.danger {
            background-color: yellow;
          }

          .light.checkmate {
            background-color: red;
          }
        `}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div
            className={css`
              height: 4.5rem;
              display: flex;
              flex-direction: column;
              margin-top: 1.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 0.5rem;
                margin-bottom: 1rem;
                height: 3rem;
              }
            `}
          >
            {loaded && chessBoardShown && (
              <FallenPieces
                myColor={myColor}
                {...{
                  [myColor === 'white'
                    ? 'whiteFallenPieces'
                    : 'blackFallenPieces']:
                    myColor === 'white' ? whiteFallenPieces : blackFallenPieces
                }}
              />
            )}
          </div>
          <Game
            loading={!loaded || (!isDiscussion && !opponentId)}
            spoilerOff={!!gameWinnerId || chessBoardShown}
            interactable={!!interactable && !newChessState && !userMadeLastMove}
            squares={squares}
            myColor={myColor}
            onClick={handleClick}
            onBoardClick={onBoardClick}
            onCastling={handleCastling}
            onSpoilerClick={handleSpoilerClick}
            opponentName={opponentName}
          />
          <div
            style={{
              height: '6rem',
              display: 'flex',
              width: '100%',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              className={css`
                display: flex;
                flex-direction: column;
                margin: 1rem 0;
                @media (max-width: ${mobileMaxWidth}) {
                  height: 3rem;
                }
              `}
            >
              {loaded && chessBoardShown && (
                <FallenPieces
                  myColor={myColor}
                  {...{
                    [myColor === 'white'
                      ? 'blackFallenPieces'
                      : 'whiteFallenPieces']:
                      myColor === 'white'
                        ? blackFallenPieces
                        : whiteFallenPieces
                  }}
                />
              )}
            </div>
            {(status || gameOverMsg) && (
              <div
                style={{
                  color: '#fff',
                  background: Color.black(0.7),
                  padding: '0.5rem',
                  marginTop: '1.5rem',
                  position: 'absolute',
                  fontSize: '2rem'
                }}
              >
                {status || gameOverMsg}
              </div>
            )}
          </div>
        </div>
      </div>
      {!isFromModal && (isCheckmate || isStalemate || isDraw || isRewinded) && (
        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}>
          <div
            style={{
              background: isStalemate
                ? Color.pink(0.8)
                : isDraw
                ? Color.logoBlue(0.8)
                : isCheckmate && userMadeLastMove
                ? Color.gold(0.9)
                : isCheckmate
                ? Color.black(0.8)
                : Color.magenta(0.8),
              color: '#fff',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              padding: '1rem 2rem',
              textAlign: 'center',
              borderRadius
            }}
          >
            {isStalemate || isDraw ? (
              <>
                {isStalemate && <p>Stalemate!</p>}
                <p>{`It's a draw`}</p>
              </>
            ) : isCheckmate && userMadeLastMove ? (
              <>
                <p>Boom - Checkmate!</p>
                <p>You win</p>
              </>
            ) : isCheckmate ? (
              <>
                <p>Checkmate...</p>
                <p>{opponentName} wins</p>
              </>
            ) : isRewinded ? (
              <div>
                <Icon icon="clock-rotate-left" />
                <span style={{ marginLeft: '1rem' }}>Rewound</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {statusMsgShown && !isRewinded && (
        <div
          className={css`
            padding: 0.5rem 1rem;
            background: ${Color.white(0.9)};
            border: 1px solid ${Color.darkGray()};
            bottom: 1rem;
            right: 1rem;
            position: absolute;
            font-size: ${countdownNumber && countdownNumber < 110
              ? '3.5rem'
              : '2.5rem'};
            font-weight: bold;
            color: ${countdownNumber && countdownNumber < 110 ? 'red' : ''};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${countdownNumber && countdownNumber < 110
                ? '2.5rem'
                : '1.5rem'};
            }
          `}
        >
          {countdownNumber
            ? countdownNumber >= 110
              ? `${Math.floor(countdownNumber / 600)}:${String(
                  Math.floor((countdownNumber % 600) / 10)
                ).padStart(2, '0')}`
              : Number((countdownNumber % 600) / 10).toFixed(1)
            : awaitingMoveLabel}
        </div>
      )}
      {confirmModalShown && (
        <ConfirmModal
          onHide={() => setConfirmModalShown(false)}
          title="Discuss chess position"
          descriptionFontSize="1.7rem"
          description="Are you sure? The chess move you just made will be seen by your opponent."
          onConfirm={() => {
            onDiscussClick?.();
            setConfirmModalShown(false);
          }}
        />
      )}
      {rewindRequestId &&
        boardState?.isRewindRequest &&
        rewindRequestId === messageId && (
          <RewindRequestButton
            isMyMessage={userId === senderId}
            onCancelRewindRequest={onCancelRewindRequest}
            onAcceptRewind={() => onAcceptRewind?.(boardState)}
            onDeclineRewind={onDeclineRewind}
            username={senderName}
          />
        )}
      {promotionData && (
        <PromotionModal
          onHide={() => setPromotionData(null)}
          onPromote={handlePromote}
        />
      )}
    </div>
  );
}
