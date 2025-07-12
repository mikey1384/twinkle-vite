import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext } from '~/contexts';

export default function useCommunitySocket() {
  const onUpdateCommunityFunds = useAppContext(
    (v) => v.user.actions.onUpdateCommunityFunds
  );

  useEffect(() => {
    socket.on('community_funds_updated', handleCommunityFundsUpdated);

    return function cleanUp() {
      socket.off('community_funds_updated', handleCommunityFundsUpdated);
    };

    function handleCommunityFundsUpdated({
      totalFunds,
      change
    }: {
      totalFunds: number;
      change: {
        amount: number;
        type: string;
        action: string;
        userId: number;
        username: string;
      };
    }) {
      onUpdateCommunityFunds({ totalFunds, change });
    }
  });
}