import { useEffect, useRef } from 'react';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';

// Multiple surfaces can hold the same redacted comment. Share the canonical
// read, but let each mounted consumer guard its own viewer and lifetime.
const pendingReads = new Map<string, Promise<any>>();

export default function useRefreshUnlockedComment(comment: any) {
  const commentId = Number(comment?.contentId || comment?.id || 0);
  const subjectId = Number(
    comment?.subjectId ||
      comment?.targetObj?.subject?.id ||
      (comment?.rootType === 'subject' ? comment.rootId : 0)
  );
  const subjectShown = useContentContext(
    (v) => v.state[`subject${subjectId}`]?.secretShown
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const attemptedKeyRef = useRef('');
  const needsRefresh = Boolean(
    commentId && comment?.secretHidden && subjectShown && userId
  );

  useEffect(() => {
    if (!needsRefresh) {
      attemptedKeyRef.current = '';
      return;
    }
    const key = `${userId}:${subjectId}:${commentId}`;
    if (attemptedKeyRef.current === key) return;
    attemptedKeyRef.current = key;
    let current = true;
    const requestUserId = userId;
    let pending = pendingReads.get(key);
    if (!pending) {
      pending = Promise.resolve().then(() =>
        loadContent({ contentId: commentId, contentType: 'comment' })
      );
      pendingReads.set(key, pending);
      const clear = () => {
        if (pendingReads.get(key) === pending) pendingReads.delete(key);
      };
      void pending.then(clear, clear);
    }
    void pending.then(
      (data) => {
        if (!current || checkUserChange(requestUserId) || !data) return;
        onInitContent(data);
      },
      (error) => {
        if (current) console.error('Failed to reload unlocked comment:', error);
      }
    );
    return () => {
      current = false;
      // Effect replay (including StrictMode) must be able to subscribe again.
      attemptedKeyRef.current = '';
    };
    // Request/context helpers are stable; a still-redacted response must not
    // cause a request loop. Remounting the surface allows another attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentId, needsRefresh, subjectId, userId]);
}
