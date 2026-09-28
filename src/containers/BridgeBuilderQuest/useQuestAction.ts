import { useState } from 'react';

// One mutation at a time per control group: busy flag, the server's error
// message, then the page reloads canonical state (no optimistic updates).
export default function useQuestAction(onChanged: () => Promise<void> | void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return { busy, error, setError, run };

  async function run(action: () => Promise<unknown>) {
    if (busy) return false;
    setBusy(true);
    setError('');
    try {
      await action();
      await onChanged();
      return true;
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }
}
