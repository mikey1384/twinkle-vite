import { useEffect, useRef } from 'react';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { normalizeViewCount } from '~/helpers/viewCount';

export function useRecordContentPageView({
  contentId,
  contentType,
  enabled,
  rootType
}: {
  contentId?: number | null;
  contentType?: string | null;
  enabled: boolean;
  rootType?: string | null;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const recordContentView = useAppContext(
    (v) => v.requestHelpers.recordContentView
  );
  const onSetContentState = useContentContext(
    (v) => v.actions.onSetContentState
  );
  const requestKeyRef = useRef('');

  useEffect(() => {
    const normalizedContentId = Math.floor(Number(contentId) || 0);
    const normalizedContentType = String(contentType || '').trim();
    const normalizedRootType = String(rootType || '').trim();
    if (
      !enabled ||
      !normalizedContentId ||
      !normalizedContentType ||
      normalizedContentType === 'build'
    ) {
      return;
    }

    const requestUserId = userId;
    const requestKey = `${normalizedContentType}-${normalizedContentId}-${normalizedRootType}-${
      requestUserId || 0
    }`;
    if (requestKeyRef.current === requestKey) return;
    requestKeyRef.current = requestKey;
    recordView(requestKey, requestUserId);

    async function recordView(requestKey: string, requestUserId: number) {
      try {
        const data = await recordContentView({
          contentId: normalizedContentId,
          contentType: normalizedContentType,
          rootType: normalizedRootType
        });
        if (
          checkUserChange(requestUserId) ||
          requestKeyRef.current !== requestKey ||
          !data ||
          typeof data.viewCount === 'undefined'
        ) {
          return;
        }
        onSetContentState({
          contentId: normalizedContentId,
          contentType: normalizedContentType,
          newState: {
            viewCount: normalizeViewCount(data.viewCount)
          }
        });
      } catch (error) {
        if (checkUserChange(requestUserId)) return;
        console.error(error);
        if (requestKeyRef.current === requestKey) {
          requestKeyRef.current = '';
        }
      }
    }
    // checkUserChange/recordContentView/onSetContentState are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, contentType, enabled, rootType, userId]);
}
