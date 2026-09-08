import React, { useRef, useState } from 'react';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import useChatDialogRequest from '../Modals/useChatDialogRequest';

export default function RewindRequestButton({
  isMyMessage,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
  username
}: {
  isMyMessage: boolean;
  onCancelRewindRequest?: () => void;
  onAcceptRewind?: () => void;
  onDeclineRewind?: () => void;
  username?: string;
}) {
  const request = useChatDialogRequest('chess-retry');
  const [activeAction, setActiveAction] = useState('');
  const [completed, setCompleted] = useState(false);
  const completedRef = useRef(false);
  function respond(action: string, callback?: () => void) {
    if (!callback || request.pending.current || completedRef.current) return;
    setActiveAction(action);
    return request.run('Could not confirm your response. Check the game before trying again.', async isCurrent => {
      await callback();
      if (!isCurrent()) return;
      completedRef.current = true;
      setCompleted(true);
    });
  }

  return (
    <div
      style={{
        padding: 12,
        marginBlock: 12,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        borderRadius: 8,
        border: `1px solid ${Color.black()}`,
        background: Color.white(0.9)
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: 16, lineHeight: 1.5, overflowWrap: 'anywhere', margin: '0 0 12px', color: Color.black() }}>
        {`${
          isMyMessage ? 'You' : username || 'Your opponent'
        } proposed a new game from this position`}
      </p>
      {request.error && <p ref={request.errorRef} id={request.errorId} role="alert" style={{ fontSize: 14, lineHeight: 1.5, color: Color.black() }}>{request.error}</p>}
      {(request.busy || completed) && <p role="status" style={{ fontSize: 14, lineHeight: 1.5, color: Color.black() }}>{completed ? `${activeAction === 'cancel' ? 'Request canceled.' : activeAction === 'accept' ? 'Request accepted.' : 'Request declined.'} Waiting for the game to update.` : activeAction === 'cancel' ? 'Canceling request…' : 'Sending response…'}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isMyMessage ? (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
            {!request.busy && !completed && <span style={{ fontSize: 14, lineHeight: 1.5, color: Color.black() }}>Waiting for response...</span>}
            <Button
              onClick={() => respond('cancel', onCancelRewindRequest)}
              loading={request.busy && activeAction === 'cancel'}
              disabled={request.busy || completed || !onCancelRewindRequest}
              style={{ minHeight: 44, fontSize: 14 }}
              aria-label="Cancel chess retry request"
              variant="ghost"
              color="red"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => respond('accept', onAcceptRewind)}
              loading={request.busy && activeAction === 'accept'}
              disabled={request.busy || completed || !onAcceptRewind}
              style={{ minHeight: 44, fontSize: 14 }}
              aria-label="Accept chess retry request"
              variant="ghost"
              color="green"
            >
              <Icon icon="check" />
              <span style={{ marginLeft: '0.7rem' }}>Accept</span>
            </Button>
            <Button
              onClick={() => respond('decline', onDeclineRewind)}
              loading={request.busy && activeAction === 'decline'}
              disabled={request.busy || completed || !onDeclineRewind}
              style={{ minHeight: 44, fontSize: 14 }}
              aria-label="Decline chess retry request"
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
