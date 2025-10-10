import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Game from './Game';
import FallenPieces from './FallenPieces';
import BoardWrapper from '../BoardWrapper';
import DropdownButton from '~/components/Buttons/DropdownButton';
import NewModal from '~/components/NewModal';
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
import { useChatContext, useKeyContext, useChessContext } from '~/contexts';
import { getLevelCategory } from '../../Home/ChessPuzzleModal/helpers';

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
  style,
  squareColors,
  displaySize = 'regular'
}: {
  channelId: number;
  rewindRequestMessageSenderId?: number;
  countdownNumber?: number | null;
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
  displaySize?: 'regular' | 'compact';
  style?: React.CSSProperties;
  squareColors?: { light?: string; dark?: string };
}) {
  const isCompact = displaySize === 'compact';
  const userId = useKeyContext((v) => v.myState.userId);
  const onBumpChessThemeVersion = useChatContext(
    (v) => v.actions.onBumpChessThemeVersion
  );
  const banned = useKeyContext((v) => v.myState.banned);
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
  const [themeModalShown, setThemeModalShown] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [localSquareColors, setLocalSquareColors] = useState<
    { light?: string; dark?: string } | undefined
  >(undefined);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tw-chat-chess-theme-${userId}`);
      if (saved) setCurrentTheme(saved);
    } catch {}
  }, [userId]);

  const maxLevelUnlocked: number =
    useChessContext((v) => v.state.stats?.maxLevelUnlocked) ?? 1;

  const themeOptions = useMemo(
    () => [
      { label: 'Default', value: 'DEFAULT' },
      { label: 'Intermediate', value: 'INTERMEDIATE' },
      { label: 'Advanced', value: 'ADVANCED' },
      { label: 'Expert', value: 'EXPERT' },
      { label: 'Legendary', value: 'LEGENDARY' },
      { label: 'Genius', value: 'GENIUS' },
      { label: 'Level 42', value: 'LEVEL_42' }
    ],
    []
  );

  const allowedThemeValues = useMemo(() => {
    const category = getLevelCategory(maxLevelUnlocked);
    const order = [
      'DEFAULT',
      'INTERMEDIATE',
      'ADVANCED',
      'EXPERT',
      'LEGENDARY',
      'GENIUS'
    ];
    const maxIndex =
      category === 'GENIUS'
        ? order.indexOf('GENIUS')
        : category === 'LEGENDARY'
        ? order.indexOf('LEGENDARY')
        : category === 'EXPERT'
        ? order.indexOf('EXPERT')
        : category === 'ADVANCED'
        ? order.indexOf('ADVANCED')
        : category === 'INTERMEDIATE'
        ? order.indexOf('INTERMEDIATE')
        : order.indexOf('DEFAULT');
    const base = order.slice(0, maxIndex + 1);
    return maxLevelUnlocked >= 42 ? [...base, 'LEVEL_42'] : base;
  }, [maxLevelUnlocked]);

  const handleApplyTheme = useCallback(
    (value: string) => {
      setCurrentTheme(value);
      try {
        localStorage.setItem(`tw-chat-chess-theme-${userId}`, value);
      } catch {}
      const mapped =
        value === 'INTERMEDIATE'
          ? { light: '#dbeafe', dark: '#93c5fd' }
          : value === 'ADVANCED'
          ? { light: '#e2e8f0', dark: '#94a3b8' }
          : value === 'EXPERT'
          ? { light: '#ede9fe', dark: '#c4b5fd' }
          : value === 'LEGENDARY'
          ? { light: '#fee2e2', dark: '#fca5a5' }
          : value === 'GENIUS'
          ? { light: '#fef3c7', dark: '#fbbf24' }
          : value === 'LEVEL_42'
          ? { light: '#e0e7ff', dark: '#556377' }
          : undefined;
      setLocalSquareColors(mapped);
      // Notify chat to re-render other messages to pick up new theme
      onBumpChessThemeVersion();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  function getThemeMenu() {
    return themeOptions
      .filter((it) =>
        (allowedThemeValues as readonly string[]).includes(it.value)
      )
      .map((it) => ({
        label: it.label,
        onClick: () => {
          handleApplyTheme(it.value);
          try {
            localStorage.setItem(`tw-chat-chess-theme-${userId}`, it.value);
          } catch {}
        }
      }));
  }

  const themeMenuProps = useMemo(
    () =>
      themeOptions
        .filter((o) => allowedThemeValues.includes(o.value))
        .map((o) => ({
          label: o.label,
          onClick: () => {
            handleApplyTheme(o.value);
            setThemeModalShown(false);
          }
        })),
    [allowedThemeValues, handleApplyTheme, themeOptions]
  );

  const currentThemeLabel =
    themeOptions.find((o) => o.value === currentTheme)?.label || 'Default';

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
      !isFromModal
        ? {
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
        : null,
      {
        label: (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon icon="palette" />
            <span style={{ marginLeft: '1rem' }}>
              Theme{currentTheme ? `: ${currentThemeLabel}` : ''}
            </span>
          </div>
        ),
        onClick: () => setThemeModalShown(true)
      }
    ].filter(Boolean) as any[];
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
    userMadeLastMove,
    currentTheme,
    currentThemeLabel,
    isFromModal
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
      {themeModalShown ? (
        <NewModal
          isOpen
          onClose={() => setThemeModalShown(false)}
          title="Select Theme"
          size="sm"
        >
          <div
            style={{
              padding: '0.75rem',
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <DropdownButton
              color="darkerGray"
              icon="palette"
              text={`Theme: ${currentThemeLabel}`}
              skeuomorphic
              menuProps={themeMenuProps}
            />
          </div>
        </NewModal>
      ) : null}
      {gameDropdownButtonShown ||
      (isFromModal && allowedThemeValues.length > 1) ? (
        <div
          className={css`
            position: absolute;
            top: 1rem;
            right: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            z-index: 8;
            @media (max-width: ${mobileMaxWidth}) {
              right: 0;
              top: 0;
            }
          `}
        >
          {!deviceIsMobile && isFromModal && allowedThemeValues.length > 1 ? (
            <DropdownButton
              color="darkerGray"
              icon="palette"
              text={
                currentTheme
                  ? `Theme: ${
                      themeOptions.find((o) => o.value === currentTheme)
                        ?.label || 'Default'
                    }`
                  : 'Theme'
              }
              skeuomorphic
              menuProps={getThemeMenu()}
            />
          ) : null}
          {gameDropdownButtonShown ? (
            !(isFromModal && !deviceIsMobile) ? (
              <DropdownButton
                skeuomorphic
                buttonStyle={{
                  fontSize: '1rem',
                  lineHeight: 1
                }}
                className={isFromModal ? undefined : 'menu-button'}
                color="darkerGray"
                icon={deviceIsMobile ? 'chevron-down' : 'ellipsis-h'}
                menuProps={dropdownProps}
                onDropdownShown={setHighlighted}
              />
            ) : null
          ) : null}
        </div>
      ) : null}
      <BoardWrapper
        statusShown={gameStatusMessageShown}
        timerPlacement="inline"
        size={isCompact ? 'compact' : 'regular'}
        gameInfo={{
          type: 'chess',
          moveNumber: move?.number,
          isFromModal,
          userMadeLastMove,
          pieceType: move?.piece?.type || null,
          from: (move as any)?.from,
          to: (move as any)?.to,
          capturedPiece: boardState?.capturedPiece || null,
          boardShown: chessBoardShown,
          isCheck,
          isCheckmate,
          isStalemate,
          isDraw
        }}
        timerData={{
          shown: !isCompact && statusMsgShown && !isRewinded,
          countdownNumber,
          awaitingOpponentName: opponentName
        }}
        beforeBoard={
          !isCompact && loaded && chessBoardShown ? (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                margin: 0;
              `}
            >
              <FallenPieces
                myColor={myColor}
                size={isCompact ? 'compact' : 'regular'}
                {...{
                  [myColor === 'white'
                    ? 'whiteFallenPieces'
                    : 'blackFallenPieces']:
                    myColor === 'white' ? whiteFallenPieces : blackFallenPieces
                }}
              />
            </div>
          ) : undefined
        }
        afterBoard={
          <>
            {!isCompact && loaded && chessBoardShown && (
              <div
                className={css`
                  display: flex;
                  width: 100%;
                  flex-direction: column;
                  align-items: center;
                  margin: 0;
                `}
              >
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    margin: 0.5rem 0 0 0;
                  `}
                >
                  <FallenPieces
                    myColor={myColor}
                    size={isCompact ? 'compact' : 'regular'}
                    {...{
                      [myColor === 'white'
                        ? 'blackFallenPieces'
                        : 'whiteFallenPieces']:
                        myColor === 'white'
                          ? blackFallenPieces
                          : whiteFallenPieces
                    }}
                  />
                </div>
                {(status || gameOverMsg) && (
                  <div
                    style={{
                      color: '#fff',
                      background: Color.black(0.7),
                      padding: '0.5rem',
                      marginTop: '1rem',
                      position: 'absolute',
                      fontSize: isCompact ? '1.2rem' : '2rem'
                    }}
                  >
                    {status || gameOverMsg}
                  </div>
                )}
              </div>
            )}
            {!isFromModal &&
              (isCheckmate || isStalemate || isDraw || isRewinded) && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem'
                  }}
                >
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
                      fontSize: isCompact ? '1.6rem' : '2.5rem',
                      fontWeight: 'bold',
                      padding: isCompact ? '0.75rem 1.5rem' : '1rem 2rem',
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
          </>
        }
      >
        <div
          className={css`
            user-select: none;
            font: 14px 'Century Gothic', Futura, sans-serif;
            .dark {
              background-color: var(--chat-chess-dark, ${Color.sandyBrown()});
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
              background-color: var(--chat-chess-light, ${Color.ivory()});
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
          style={
            {
              '--chat-chess-light': (localSquareColors || squareColors)?.light,
              '--chat-chess-dark': (localSquareColors || squareColors)?.dark
            } as React.CSSProperties
          }
        >
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
            size={isCompact ? 'compact' : 'regular'}
          />
        </div>
      </BoardWrapper>
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
          color={myColor}
          onHide={() => setPromotionData(null)}
          onPromote={handlePromote}
        />
      )}
    </div>
  );
}
