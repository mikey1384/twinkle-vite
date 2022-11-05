import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Chess from '../../Chess';
import { useAppContext } from '~/contexts';

Rewind.propTypes = {
  channelId: PropTypes.number.isRequired,
  countdownNumber: PropTypes.number,
  myId: PropTypes.number.isRequired,
  onCancelRewindRequest: PropTypes.func.isRequired,
  onAcceptRewind: PropTypes.func.isRequired,
  onDeclineRewind: PropTypes.func.isRequired,
  rewindRequestId: PropTypes.number
};

export default function Rewind({
  channelId,
  countdownNumber,
  myId,
  onAcceptRewind,
  onCancelRewindRequest,
  onDeclineRewind,
  rewindRequestId
}) {
  const fetchCurrentRewindRequest = useAppContext(
    (v) => v.requestHelpers.fetchCurrentRewindRequest
  );
  const [rewindRequestMessage, setRewindRequestMessage] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      const message = await fetchCurrentRewindRequest({
        channelId,
        rewindRequestId
      });
      setRewindRequestMessage(message);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Chess
      countdownNumber={countdownNumber}
      loaded={rewindRequestMessage.chessState && loaded}
      myId={myId}
      channelId={channelId}
      initialState={rewindRequestMessage.chessState}
      messageId={rewindRequestMessage.id}
      onAcceptRewind={onAcceptRewind}
      onCancelRewindRequest={onCancelRewindRequest}
      onDeclineRewind={onDeclineRewind}
      rewindRequestId={rewindRequestId}
      senderId={rewindRequestMessage.userId}
      senderName={rewindRequestMessage.username}
      style={{ width: '100%' }}
    />
  );
}
