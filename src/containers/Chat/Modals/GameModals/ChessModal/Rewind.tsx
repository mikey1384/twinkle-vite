import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import Chess from '../../../Chess';
import { useAppContext, useChatContext } from '~/contexts';
import { getUserChatSquareColors } from '../../../Chess/helpers/theme';

export default function Rewind({
  channelId,
  isCountdownActive,
  myId,
  onAcceptRewind,
  onCancelRewindRequest,
  onDeclineRewind,
  rewindRequestId
}: {
  channelId: number;
  isCountdownActive?: boolean;
  myId: number;
  onAcceptRewind: (v: any) => void;
  onCancelRewindRequest: () => void;
  onDeclineRewind: () => void;
  rewindRequestId: number;
}) {
  const fetchCurrentRewindRequest = useAppContext(
    (v) => v.requestHelpers.fetchCurrentRewindRequest
  );
  const chessThemeVersion = useChatContext((v) => v.state.chessThemeVersion);
  const scope = `${myId}:${channelId}:${rewindRequestId}`;
  const latestScope = useRef(scope);
  latestScope.current = scope;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{scope: string; status: 'loading' | 'loaded' | 'error'; message?: any}>({scope, status: 'loading'});
  const current = result.scope === scope ? result : {scope, status: 'loading'};

  const squareColors = useMemo(() => {
    void chessThemeVersion;
    return getUserChatSquareColors(myId);
  }, [myId, chessThemeVersion]);

  useEffect(() => {
    let active = true;
    setResult({scope, status: 'loading'});
    void init();
    async function init() {
      try {
        if (![myId, channelId, rewindRequestId].every(id => Number.isSafeInteger(id) && id > 0)) throw new Error('Invalid request');
        const message = await fetchCurrentRewindRequest({channelId, rewindRequestId});
        if (Number(message?.id) !== rewindRequestId || !Number.isSafeInteger(Number(message?.userId)) || Number(message.userId) <= 0 || !message?.chessState || typeof message.chessState !== 'object' || Array.isArray(message.chessState) || !message.chessState.isRewindRequest) throw new Error('Invalid retry position');
        if (active && latestScope.current === scope) setResult({scope, status: 'loaded', message});
      } catch {
        if (active && latestScope.current === scope) setResult({scope, status: 'error'});
      }
    }
    return () => { active = false; };
  }, [scope, myId, channelId, rewindRequestId, attempt, fetchCurrentRewindRequest]);

  if (current.status !== 'loaded') return (
    <div style={{padding: 16, fontSize: 16, lineHeight: 1.5}}>
      <p role={current.status === 'error' ? 'alert' : 'status'}>{current.status === 'error' ? 'Could not load this retry position. It may no longer be available.' : 'Loading retry position…'}</p>
      {current.status === 'error' && <Button variant="ghost" style={{minHeight: 44, fontSize: 14}} onClick={() => setAttempt(value => value + 1)}>Try again</Button>}
    </div>
  );
  const rewindRequestMessage = result.message;

  return (
    <Chess
      key={`${scope}:${chessThemeVersion}`}
      isCountdownActive={isCountdownActive}
      loaded
      myId={myId}
      channelId={channelId}
      initialState={rewindRequestMessage.chessState}
      messageId={rewindRequestMessage.id}
      onAcceptRewind={onAcceptRewind}
      onCancelRewindRequest={onCancelRewindRequest}
      onDeclineRewind={onDeclineRewind}
      rewindRequestId={rewindRequestId}
      senderId={rewindRequestMessage.userId}
      senderName={rewindRequestMessage?.username}
      style={{ width: '100%' }}
      squareColors={squareColors}
    />
  );
}
