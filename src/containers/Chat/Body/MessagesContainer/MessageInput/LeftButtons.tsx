import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useChatContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';
import { OmokCell, OmokColor } from '~/containers/Chat/Omok/helpers';

export default function LeftButtons({
  buttonColor,
  buttonHoverColor,
  hasWordleButton,
  isChessBanned,
  isRestrictedChannel,
  isTwoPeopleChannel,
  legacyTopicButtonShown,
  loading,
  nextDayTimeStamp,
  onChessButtonClick,
  onOmokButtonClick,
  onTopicButtonClick,
  onWordleButtonClick,
  topicId
}: {
  buttonColor: string;
  buttonHoverColor: string;
  hasWordleButton: boolean;
  isChessBanned: boolean;
  isRestrictedChannel: boolean;
  isTwoPeopleChannel: number | boolean;
  legacyTopicButtonShown: boolean;
  loading: boolean;
  nextDayTimeStamp: number;
  onChessButtonClick: () => void;
  onOmokButtonClick: () => void;
  onTopicButtonClick: () => void;
  onWordleButtonClick: () => void;
  topicId: number;
}) {
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const isGoldTheme = alertRole.themeName === 'gold';
  // Gold theme base buttons should be bluish to contrast with gold alerts
  const baseButtonColorKey = isGoldTheme ? 'bluerGray' : buttonColor;
  const baseHoverColorKey = isGoldTheme ? 'darkBluerGray' : buttonHoverColor;

  // Helper to tint Color keys
  const getTint = (key: string, alpha: number, fallbackKey = 'gold') => {
    const fn = (Color as any)[key];
    if (typeof fn === 'function') return fn(alpha);
    const fallbackFn = (Color as any)[fallbackKey];
    return typeof fallbackFn === 'function' ? fallbackFn(alpha) : fallbackKey;
  };
  // For alerted look: if gold theme, match gold-hovered from previous gold buttons
  const glowHoverKey = isGoldTheme ? 'gold' : baseHoverColorKey;
  const hoveredSoftBg = getTint(glowHoverKey, 0.18);
  const hoveredSoftBorder = getTint(glowHoverKey, 0.32);
  const hoveredText = getTint(glowHoverKey, 1);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const channelState = useChatContext(
    (v) => v.state.channelsObj[selectedChannelId]
  );
  const myId = useKeyContext((v) => v.myState.userId);

  const chessButtonIsGlowing = useMemo(() => {
    if (!isTwoPeopleChannel || !channelState) return false;
    const latestMessage = getLatestGameMessage(channelState, 'chess');
    const chessState = latestMessage?.chessState;
    if (!chessState) return false;
    if (
      chessState.isDiscussion ||
      chessState.isDraw ||
      chessState.isStalemate
    ) {
      return false;
    }
    const gameWinner =
      latestMessage?.gameWinnerId ?? chessState.winnerId ?? null;
    if (gameWinner !== null && gameWinner !== undefined) return false;
    const playerColors = chessState.playerColors || {};
    const myColor =
      playerColors?.[myId] ?? playerColors?.[String(myId)] ?? 'white';
    const moveNumber =
      typeof chessState.move?.number === 'number' ? chessState.move.number : 0;
    const nextColor = moveNumber % 2 === 0 ? 'white' : 'black';
    if (chessState.move?.by === myId) return false;
    return myColor === nextColor;
  }, [channelState, isTwoPeopleChannel, myId]);

  const omokButtonIsGlowing = useMemo(() => {
    if (!isTwoPeopleChannel || !channelState) return false;
    const latestMessage = getLatestGameMessage(channelState, 'omok');
    const omokState = latestMessage?.omokState;
    if (!omokState) return false;
    const gameWinner =
      latestMessage?.gameWinnerId ?? omokState.winnerId ?? null;
    if (gameWinner !== null && gameWinner !== undefined) return false;
    const board = Array.isArray(omokState.board) ? omokState.board : null;
    if (!board) return false;
    const stonesPlaced = countOmokStones(board);
    const nextColor: OmokColor = stonesPlaced % 2 === 0 ? 'black' : 'white';
    const playerColors = omokState.playerColors || {};
    const assigned =
      playerColors?.[myId] ?? playerColors?.[String(myId)] ?? nextColor;
    if (omokState.move?.by === myId) return false;
    return assigned === nextColor;
  }, [channelState, isTwoPeopleChannel, myId]);
  return (
    <div
      style={{
        margin: '0.2rem 1rem 0.2rem 0',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {isTwoPeopleChannel ? (
        <>
          <Button
            disabled={loading || isChessBanned || isRestrictedChannel}
            variant="soft"
            tone="raised"
            onClick={onChessButtonClick}
            color={baseButtonColorKey}
            hoverColor={baseHoverColorKey}
            style={
              chessButtonIsGlowing
                ? {
                    background: hoveredSoftBg,
                    borderColor: hoveredSoftBorder,
                    color: hoveredText
                  }
                : undefined
            }
          >
            <Icon size="lg" icon={['fas', 'chess']} />
          </Button>
          <Button
            disabled={loading || isChessBanned || isRestrictedChannel}
            variant="soft"
            tone="raised"
            onClick={onOmokButtonClick}
            color={baseButtonColorKey}
            hoverColor={baseHoverColorKey}
            
            // Avoid extra spacing between split label children (O + mok)
            // by zeroing out Button's internal gap
            style={{
              marginLeft: '0.5rem',
              gap: 0,
              ...(omokButtonIsGlowing
                ? {
                    background: hoveredSoftBg,
                    borderColor: hoveredSoftBorder,
                    color: hoveredText
                  }
                : {})
            }}
          >
            O<span className="desktop">mok</span>
          </Button>
        </>
      ) : hasWordleButton ? (
        <Button
          loading={loading || !nextDayTimeStamp}
          variant="soft"
          tone="raised"
          onClick={onWordleButtonClick}
          color={baseButtonColorKey}
          hoverColor={baseHoverColorKey}
          // Avoid extra spacing between split label children (W + ordle)
          // by zeroing out Button's internal gap
          style={{ gap: 0 }}
        >
          W<span className="desktop">ordle</span>
        </Button>
      ) : null}
      {topicId && legacyTopicButtonShown && (
        <Button
          disabled={loading}
          style={{
            marginLeft: isTwoPeopleChannel || hasWordleButton ? '0.5rem' : 0
          }}
          variant="soft"
          tone="raised"
          onClick={onTopicButtonClick}
          color={baseButtonColorKey}
          hoverColor={baseHoverColorKey}
        >
          <Icon
            size={isTwoPeopleChannel || hasWordleButton ? '' : 'lg'}
            icon="comment"
          />
        </Button>
      )}
    </div>
  );
}

function getLatestGameMessage(channelState: any, game: 'chess' | 'omok') {
  if (!channelState) return null;
  const messagesObj = channelState.messagesObj || {};
  const lastId =
    game === 'chess'
      ? channelState.lastChessMessageId
      : channelState.lastOmokMessageId;
  const direct =
    (lastId !== null && lastId !== undefined && messagesObj[lastId]) ||
    (lastId !== null && lastId !== undefined && messagesObj[String(lastId)]);
  if (direct) return direct;
  return game === 'chess'
    ? channelState.recentChessMessage || null
    : channelState.recentOmokMessage || null;
}

function countOmokStones(board: OmokCell[][]) {
  return board.reduce(
    (total, row) =>
      total +
      row.reduce(
        (rowSum, cell) =>
          rowSum + (cell === 'black' || cell === 'white' ? 1 : 0),
        0
      ),
    0
  );
}
