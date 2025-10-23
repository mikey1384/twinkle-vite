import React, { useState } from 'react';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function RewindRequestButton({
  isMyMessage,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
  username
}: {
  isMyMessage: boolean;
  onCancelRewindRequest?: () => void;
  onAcceptRewind: (chessState: any) => void;
  onDeclineRewind?: () => void;
  username?: string;
}) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  return (
    <div
      style={{
        padding: '0.5rem',
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        border: `1px solid ${Color.black()}`,
        background: Color.white(0.9)
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>
        {`${
          isMyMessage ? 'You' : username
        } proposed a new game from this position`}
      </p>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isMyMessage ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '3rem' }}>Waiting for response...</span>
            <Button
              onClick={() => {
                setIsCanceling(true);
                onCancelRewindRequest?.();
              }}
              loading={isCanceling}
              style={{ paddingBottom: '0.5rem' }}
              variant="ghost"
              color="red"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex' }}>
            <Button
              onClick={(chessState) => {
                setIsAccepting(true);
                onAcceptRewind(chessState);
              }}
              loading={isAccepting}
              style={{ paddingBottom: '0.5rem' }}
              variant="ghost"
              color="green"
            >
              <Icon icon="check" />
              <span style={{ marginLeft: '0.7rem' }}>Accept</span>
            </Button>
            <Button
              onClick={() => {
                setIsDeclining(true);
                onDeclineRewind?.();
              }}
              loading={isDeclining}
              style={{ paddingBottom: '0.5rem' }}
              variant="ghost"
              color="red"
            >
              <Icon icon="xmark" />
              <span style={{ marginLeft: '0.7rem' }}>Decline</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
