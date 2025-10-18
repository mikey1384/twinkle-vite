import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useChatContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
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
  const alertColorKey = alertRole.colorKey || 'gold';
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
            filled={chessButtonIsGlowing}
            onClick={onChessButtonClick}
            color={chessButtonIsGlowing ? alertColorKey : buttonColor}
            hoverColor={
              chessButtonIsGlowing ? alertColorKey : buttonHoverColor
            }
          >
            <Icon size="lg" icon={['fas', 'chess']} />
          </Button>
          <Button
            disabled={loading || isChessBanned || isRestrictedChannel}
            variant="soft"
            tone="raised"
            filled={omokButtonIsGlowing}
            onClick={onOmokButtonClick}
            color={omokButtonIsGlowing ? alertColorKey : buttonColor}
            hoverColor={
              omokButtonIsGlowing ? alertColorKey : buttonHoverColor
            }
            
            // Avoid extra spacing between split label children (O + mok)
            // by zeroing out Button's internal gap
            style={{ marginLeft: '0.5rem', gap: 0 }}
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
          color={buttonColor}
          hoverColor={buttonHoverColor}
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
          color={buttonColor}
          hoverColor={buttonHoverColor}
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
