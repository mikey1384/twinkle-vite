import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Chess from '../../Chess';
import { useAppContext } from '~/contexts';

Rewind.propTypes = {
  channelId: PropTypes.number.isRequired,
  initialState: PropTypes.object.isRequired,
  myId: PropTypes.number.isRequired
};

export default function Rewind({ channelId, initialState, myId }) {
  const fetchCurrentRewindRequest = useAppContext(
    (v) => v.requestHelpers.fetchCurrentRewindRequest
  );
  const [rewindRequestMessage, setRewindRequestMessage] = useState();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    init();
    async function init() {
      const data = await fetchCurrentRewindRequest(channelId);
      console.log(data);
      setRewindRequestMessage({});
      setLoaded(true);
      console.log(rewindRequestMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Chess
        loaded={loaded}
        myId={myId}
        channelId={channelId}
        initialState={initialState}
        style={{ width: '100%' }}
      />
    </div>
  );
}
