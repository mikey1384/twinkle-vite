import React from 'react';
import Chess from '../../Chess';
import Icon from '~/components/Icon';
import { getUserChatSquareColors } from '../../Chess/helpers/theme';

export default function ChessTarget({
  myId,
  channelId,
  chessTarget,
  onClose
}: {
  myId: number;
  channelId: number;
  chessTarget: any;
  onClose: () => any;
}) {
  return (
    <div
      style={{
        height: '24rem',
        width: '100%',
        position: 'relative',
        padding: '1rem 6rem 2rem 0.5rem',
        marginBottom: '2px'
      }}
    >
      <Icon
        icon="times"
        size="lg"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          cursor: 'pointer',
          zIndex: 2,
          padding: '0.5rem 0.75rem'
        }}
        onClick={onClose}
      />
      <Chess
        loaded
        myId={myId}
        channelId={channelId}
        initialState={chessTarget}
        style={{ width: '100%' }}
        squareColors={getUserChatSquareColors(myId)}
        displaySize="compact"
      />
    </div>
  );
}
