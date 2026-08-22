export function applySpoilerStatusChange({
  state,
  contentId,
  contentType,
  missingSubjectState,
  prevSecretViewerId,
  shown
}: {
  state: Record<string, any>;
  contentId: number;
  contentType: string;
  missingSubjectState: Record<string, any>;
  prevSecretViewerId?: number;
  shown: boolean;
}) {
  let newState = state;
  const contentKeys = Object.keys(state);
  for (const contentKey of contentKeys) {
    const prevContentState = state[contentKey];
    const contentMatches =
      prevContentState.contentId === contentId &&
      prevContentState.contentType === contentType;
    const targetSubjectMatches =
      prevContentState.targetObj?.subject?.id === contentId;
    if (!contentMatches && !targetSubjectMatches) {
      continue;
    }

    const topLevelChanged =
      prevContentState.prevSecretViewerId !== prevSecretViewerId ||
      prevContentState.secretShown !== shown;
    const targetSubjectChanged =
      targetSubjectMatches &&
      prevContentState.targetObj?.subject?.secretShown !== shown;
    if (!topLevelChanged && !targetSubjectChanged) {
      continue;
    }

    if (newState === state) {
      newState = { ...state };
    }
    newState[contentKey] = {
      ...prevContentState,
      prevSecretViewerId,
      secretShown: shown,
      ...(targetSubjectMatches && prevContentState.targetObj
        ? {
            targetObj: {
              ...prevContentState.targetObj,
              subject: {
                ...prevContentState.targetObj.subject,
                secretShown: shown
              }
            }
          }
        : {})
    };
  }

  const subjectKey = 'subject' + contentId;
  if (!newState[subjectKey]) {
    if (newState === state) {
      newState = { ...state };
    }
    newState[subjectKey] = missingSubjectState;
  }
  return newState;
}
