import { useState } from 'react';
import usePendingAction from '~/helpers/hooks/usePendingAction';

// One mutation at a time per control group: busy flag, the server's error
// message, then the page reloads canonical state (no optimistic updates).
export default function useQuestAction(onChanged: () => Promise<void> | void) {
  const { pendingAction, runAction } = usePendingAction();
  const busy = pendingAction !== null;
  const [error, setError] = useState('');
  return { busy, pendingAction, error, setError, run };

  async function run(action: () => Promise<unknown>, key = 'default') {
    return (await runAction(key, async () => {
      setError('');
      try {
        await action();
        await onChanged();
        return true;
      } catch (err: any) {
        setError(err?.message || 'Something went wrong. Please try again.');
        return false;
      }
    })) ?? false;
  }
}
