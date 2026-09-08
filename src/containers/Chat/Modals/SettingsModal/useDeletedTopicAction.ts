import { useEffect, useRef, useState } from 'react';
import useChatDialogRequest from '../useChatDialogRequest';

type Action = { id: number; kind: 'restore' | 'delete' };
export default function useDeletedTopicAction(scope: string) {
  const request = useChatDialogRequest(scope);
  const receipt = useRef<Action | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { receipt.current = null; setConfirmed(false); }, [scope]);
  return { ...request, confirmed, runAction };

  async function runAction(action: Action, mutate: () => Promise<any>, refresh: (current: () => boolean) => Promise<void>) {
    if (receipt.current && (receipt.current.id !== action.id || receipt.current.kind !== action.kind)) return;
    await request.run('Couldn’t confirm this action. Please try again.', async current => {
      if (!receipt.current) {
        const result = await mutate();
        if (!current()) return;
        if (result?.success !== true) throw new Error('Missing topic mutation acknowledgement');
        receipt.current = action;
        setConfirmed(true);
      }
      await refresh(current);
      if (!current()) return;
      receipt.current = null;
      setConfirmed(false);
    });
  }
}
