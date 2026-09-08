import { useEffect, useId, useRef, useState } from 'react';

// A dialog owns its pending action. Closing or changing account/channel makes
// late completions obsolete; the existing API cannot abort a committed write.
export default function useChatDialogRequest(scope: string | number) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLParagraphElement>(null);
  const errorId = useId();
  const pending = useRef(false);
  const generation = useRef(0);
  const latestScope = useRef(scope);
  latestScope.current = scope;
  useEffect(() => {
    pending.current = false;
    setBusy(false);
    setError('');
    return () => { generation.current += 1; };
  }, [scope]);
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest' });
  }, [error]);

  return { busy, error, errorRef, errorId, run, pending };

  async function run(message: string, action: (isCurrent: () => boolean) => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    const version = ++generation.current;
    const isCurrent = () => generation.current === version && latestScope.current === scope;
    setBusy(true);
    setError('');
    try {
      await action(isCurrent);
    } catch {
      if (isCurrent()) setError(message);
    } finally {
      if (isCurrent()) {
        pending.current = false;
        setBusy(false);
      }
    }
  }
}
