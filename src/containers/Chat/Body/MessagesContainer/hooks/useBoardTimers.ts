import { useEffect, useRef, useState } from 'react';
import { countdownStore } from '~/contexts/GameCountdown';
import { socket } from '~/constants/sockets/api';
import {
  getLatestGameBoundaryMessageId,
  getPendingTerminalToken
} from '~/containers/Chat/helpers/gameMessageIds';

type BoardGameType = 'chess' | 'omok';

export default function useBoardTimers({
  currentChannel,
  onSetChessModalShown,
  onSetOmokModalShown,
  selectedChannelId
}: {
  currentChannel: any;
  onSetChessModalShown: (shown: boolean) => void;
  onSetOmokModalShown: (shown: boolean) => void;
  selectedChannelId: number;
}) {
  const [boardCountdownObj, setBoardCountdownObj] = useState<
    Record<number, Partial<Record<BoardGameType, number | null>>>
  >({});
  const latestBoardMessageIdRef = useRef<
    Record<number, Partial<Record<BoardGameType, number>>>
  >({});
  const pendingTerminalTokenRef = useRef<
    Record<number, Partial<Record<BoardGameType, string>>>
  >({});

  useEffect(() => {
    const channelId = Number(currentChannel?.id || selectedChannelId || 0);
    if (!channelId) return;
    const latestChessMessageId = Number(
      getLatestGameBoundaryMessageId(currentChannel, 'chess') || 0
    );
    const latestOmokMessageId = Number(
      getLatestGameBoundaryMessageId(currentChannel, 'omok') || 0
    );
    setPendingTerminalToken({
      channelId,
      gameType: 'chess',
      token: getPendingTerminalToken(currentChannel, 'chess')
    });
    setPendingTerminalToken({
      channelId,
      gameType: 'omok',
      token: getPendingTerminalToken(currentChannel, 'omok')
    });
    if (latestChessMessageId > 0) {
      setLatestBoardMessageId({
        channelId,
        gameType: 'chess',
        messageId: latestChessMessageId
      });
    }
    if (latestOmokMessageId > 0) {
      setLatestBoardMessageId({
        channelId,
        gameType: 'omok',
        messageId: latestOmokMessageId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentChannel?.id,
    currentChannel?.lastChessMessageId,
    currentChannel?.lastChessTerminalMessageId,
    currentChannel?.lastChessPendingTerminalToken,
    currentChannel?.lastOmokMessageId,
    currentChannel?.lastOmokTerminalMessageId,
    currentChannel?.lastOmokPendingTerminalToken,
    currentChannel?.latestChessBoardMessageId,
    currentChannel?.latestOmokBoardMessageId,
    selectedChannelId
  ]);

  useEffect(() => {
    socket.on('chess_timer_cleared', handleBoardTimerCleared);
    socket.on('chess_countdown_number_received', handleCountdownUpdate);
    socket.on('new_message_received', handleReceiveMessage);

    function handleBoardTimerCleared({
      channelId,
      gameType = 'chess'
    }: {
      channelId: number;
      gameType?: BoardGameType;
    }) {
      countdownStore.set(channelId, gameType, null);
      setBoardCountdownObj((prev) => ({
        ...prev,
        [channelId]: {
          ...(prev[channelId] || {}),
          [gameType]: null
        }
      }));
    }

    function handleCountdownUpdate({
      channelId,
      number,
      gameType = 'chess',
      startMessageId
    }: {
      channelId: number;
      number: number;
      gameType?: BoardGameType;
      startMessageId?: number;
    }) {
      if (hasPendingTerminalBoundary(channelId, gameType)) {
        clearBoardCountdown(channelId, gameType);
        return;
      }
      const normalizedStartMessageId = Number(startMessageId || 0);
      const latestKnownMessageId = getLatestBoardMessageId(channelId, gameType);
      if (
        normalizedStartMessageId > 0 &&
        latestKnownMessageId > normalizedStartMessageId
      ) {
        clearBoardCountdown(channelId, gameType);
        return;
      }
      if (channelId === selectedChannelId) {
        if (gameType === 'chess' && number === 0) {
          onSetChessModalShown(false);
        }
        if (gameType === 'omok' && number === 0) {
          onSetOmokModalShown(false);
        }
      }
      countdownStore.set(channelId, gameType, number);
      setBoardCountdownObj((prev) => {
        const wasActive =
          typeof prev[channelId]?.[gameType] === 'number' &&
          (prev[channelId]?.[gameType] ?? 0) > 0;
        const isActive = typeof number === 'number' && number > 0;
        if (wasActive !== isActive) {
          return {
            ...prev,
            [channelId]: {
              ...(prev[channelId] || {}),
              [gameType]: isActive ? number : 0
            }
          };
        }
        return prev;
      });
    }

    function handleReceiveMessage({ message }: { message: any }) {
      if (!message.isChessMsg) return;
      const content: string = message?.content || '';
      const normalizedChannelId = Number(message?.channelId || 0);
      const normalizedMessageId = Number(message?.id || 0);
      let gameType: BoardGameType;
      if (message.gameType === 'omok') {
        gameType = 'omok';
      } else if (message.gameType === 'chess') {
        gameType = 'chess';
      } else if (message.omokState) {
        gameType = 'omok';
      } else if (/omok/i.test(content)) {
        gameType = 'omok';
      } else {
        gameType = 'chess';
      }
      const isTerminalMessage =
        typeof message?.gameWinnerId === 'number' ||
        !!message?.isDraw ||
        !!message?.isAbort ||
        !!message?.isResign;
      if (normalizedChannelId > 0 && normalizedMessageId > 0) {
        setLatestBoardMessageId({
          channelId: normalizedChannelId,
          gameType,
          messageId: normalizedMessageId
        });
        if (isTerminalMessage) {
          setPendingTerminalToken({
            channelId: normalizedChannelId,
            gameType,
            token: null
          });
        }
      } else if (normalizedChannelId > 0 && isTerminalMessage) {
        setPendingTerminalToken({
          channelId: normalizedChannelId,
          gameType,
          token: getPendingTerminalBoundaryToken({
            channelId: normalizedChannelId,
            gameType,
            message
          })
        });
      }
      countdownStore.set(message.channelId, gameType, null);
      setBoardCountdownObj((prev) => ({
        ...prev,
        [message.channelId]: {
          ...(prev[message.channelId] || {}),
          [gameType]: null
        }
      }));
    }

    return function cleanUp() {
      socket.off('chess_timer_cleared', handleBoardTimerCleared);
      socket.off('chess_countdown_number_received', handleCountdownUpdate);
      socket.off('new_message_received', handleReceiveMessage);
    };
  });

  return {
    boardCountdownObj,
    clearBoardCountdown,
    setLatestBoardMessageId
  };

  function setLatestBoardMessageId({
    channelId,
    gameType,
    messageId
  }: {
    channelId: number;
    gameType: BoardGameType;
    messageId: number;
  }) {
    const normalizedChannelId = Number(channelId || 0);
    const normalizedMessageId = Number(messageId || 0);
    if (!normalizedChannelId || normalizedMessageId <= 0) return;
    const latestForType = getLatestBoardMessageId(
      normalizedChannelId,
      gameType
    );
    if (normalizedMessageId <= latestForType) return;
    latestBoardMessageIdRef.current[normalizedChannelId] = {
      ...(latestBoardMessageIdRef.current[normalizedChannelId] || {}),
      [gameType]: normalizedMessageId
    };
    setPendingTerminalToken({
      channelId: normalizedChannelId,
      gameType,
      token: null
    });
  }

  function getLatestBoardMessageId(channelId: number, gameType: BoardGameType) {
    return Number(
      latestBoardMessageIdRef.current[Number(channelId || 0)]?.[gameType] || 0
    );
  }

  function setPendingTerminalToken({
    channelId,
    gameType,
    token
  }: {
    channelId: number;
    gameType: BoardGameType;
    token: string | null;
  }) {
    const normalizedChannelId = Number(channelId || 0);
    if (!normalizedChannelId) return;
    const currentEntry = pendingTerminalTokenRef.current[normalizedChannelId] || {};
    if (!token) {
      if (!currentEntry[gameType]) return;
      const nextEntry = { ...currentEntry };
      delete nextEntry[gameType];
      if (Object.keys(nextEntry).length === 0) {
        delete pendingTerminalTokenRef.current[normalizedChannelId];
      } else {
        pendingTerminalTokenRef.current[normalizedChannelId] = nextEntry;
      }
      return;
    }
    pendingTerminalTokenRef.current[normalizedChannelId] = {
      ...currentEntry,
      [gameType]: token
    };
  }

  function hasPendingTerminalBoundary(
    channelId: number,
    gameType: BoardGameType
  ) {
    return Boolean(
      pendingTerminalTokenRef.current[Number(channelId || 0)]?.[gameType]
    );
  }

  function getPendingTerminalBoundaryToken({
    channelId,
    gameType,
    message
  }: {
    channelId: number;
    gameType: BoardGameType;
    message: any;
  }) {
    const explicitId =
      typeof message?.id === 'string' && message.id
        ? message.id
        : typeof message?.id === 'number' && message.id > 0
          ? String(message.id)
          : null;
    if (explicitId) return explicitId;
    const content =
      typeof message?.content === 'string' ? message.content : 'terminal';
    const timeStamp = Number(message?.timeStamp || 0);
    const winnerId =
      typeof message?.gameWinnerId === 'number' ? message.gameWinnerId : 0;
    return [
      'pending-terminal',
      channelId,
      gameType,
      timeStamp,
      winnerId,
      Number(Boolean(message?.isDraw)),
      Number(Boolean(message?.isAbort)),
      Number(Boolean(message?.isResign)),
      content
    ].join(':');
  }

  function clearBoardCountdown(channelId: number, gameType: BoardGameType) {
    const normalizedChannelId = Number(channelId || 0);
    if (!normalizedChannelId) return;
    countdownStore.set(normalizedChannelId, gameType, null);
    setBoardCountdownObj((prev) => ({
      ...prev,
      [normalizedChannelId]: {
        ...(prev[normalizedChannelId] || {}),
        [gameType]: null
      }
    }));
  }
}
