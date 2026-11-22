import { useEffect } from 'react';
import { useKeyContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { socialWalkupStore } from '~/helpers/socialWalkups';

// Walk-up events for this member ("someone walked up", "your match is
// ready", "they left"), kept for whichever app page is open or about to
// open: a match can become ready while the app is still loading.
export default function useSocialWalkupSocket() {
  const userId = useKeyContext((v) => v.myState.userId);
  useEffect(() => {
    if (!userId) return;
    function handleEvent(event: any) {
      socialWalkupStore.apply(event);
    }
    socket.on('social_walkup_event', handleEvent);
    return () => {
      socket.off('social_walkup_event', handleEvent);
    };
  }, [userId]);
}
