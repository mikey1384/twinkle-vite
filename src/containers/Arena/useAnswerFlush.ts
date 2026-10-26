import { useEffect, useRef } from 'react';

export const ANSWER_FLUSH_EVENT = 'arena:flush-answers';

// Typed fields keep a local draft. Every exam flushes those drafts before
// submission (including automatic time-up), then awaits the server saves.
export default function useAnswerFlush(commit: () => void) {
  const latest = useRef(commit);
  latest.current = commit;
  useEffect(() => {
    const flush = () => latest.current();
    window.addEventListener(ANSWER_FLUSH_EVENT, flush);
    return () => window.removeEventListener(ANSWER_FLUSH_EVENT, flush);
  }, []);
}
