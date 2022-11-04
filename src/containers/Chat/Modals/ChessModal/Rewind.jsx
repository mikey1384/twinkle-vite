import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Chess from '../../Chess';
import { useAppContext } from '~/contexts';

Rewind.propTypes = {
  channelId: PropTypes.number.isRequired,
  myId: PropTypes.number.isRequired,
  rewindRequestId: PropTypes.number.isRequired
};

export default function Rewind({ channelId, myId, rewindRequestId }) {
  const fetchCurrentRewindRequest = useAppContext(
    (v) => v.requestHelpers.fetchCurrentRewindRequest
  );
  const [rewindRequestMessage, setRewindRequestMessage] = useState();
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
    <div>
      <Chess
        loaded={loaded}
        myId={myId}
        channelId={channelId}
        initialState={rewindRequestMessage?.chessState}
        style={{ width: '100%' }}
      />
    </div>
  );
}
