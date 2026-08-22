import { useEffect } from 'react';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { loadCanonicalSecretVisibility } from '~/contexts/Content/secretVisibilityRequests';

export default function useSubjectSecretVisibility({
  subjectHasSecretMessage,
  subjectId
}: {
  subjectHasSecretMessage: boolean;
  subjectId?: number;
}) {
  const checkIfUserResponded = useAppContext(
    (v) => v.requestHelpers.checkIfUserResponded
  );
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const prevSecretViewerId = useContentState({
    contentType: 'subject',
    contentId: subjectId
  }).prevSecretViewerId;

  useEffect(() => {
    if (!subjectHasSecretMessage || !subjectId) return;
    if (!userId) {
      onChangeSpoilerStatus({ shown: false, subjectId });
      return;
    }
    if (Number(prevSecretViewerId || 0) === Number(userId)) {
      return;
    }

    const requestUserId = Number(userId);
    let current = true;
    void loadCanonicalSecretVisibility({
      subjectId,
      userId: requestUserId,
      load: () => checkIfUserResponded(subjectId)
    })
      .then((responded) => {
        if (
          !current ||
          responded === null ||
          checkUserChange(requestUserId)
        ) {
          return;
        }
        onChangeSpoilerStatus({
          shown: responded,
          subjectId,
          prevSecretViewerId: requestUserId
        });
      })
      .catch((error) => {
        if (current) {
          console.error('Failed to check secret response status:', error);
        }
      });

    return () => {
      current = false;
    };
    // Request/context helpers are stable and must not be hook dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    prevSecretViewerId,
    subjectHasSecretMessage,
    subjectId,
    userId
  ]);
}
