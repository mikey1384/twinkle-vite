import React, { useReducer, ReactNode, useMemo, useRef } from 'react';
import { createContext } from '../selectableContext';
import ContentActions from './actions';
import ContentReducer from './reducer';
import { shouldApplyRewardLevelRevision } from '~/helpers/rewardLevelRevision';

export const ContentContext = createContext({});
export const initialContentState = {};

export function ContentContextProvider({ children }: { children: ReactNode }) {
  const [contentState, contentDispatch] = useReducer(
    ContentReducer,
    initialContentState
  );
  const latestContentStateRef =
    useRef<Record<string, any>>(initialContentState);
  const rewardLevelRevisionsRef = useRef(new Map<string, number>());
  const canonicalRewardLevelsRef = useRef(
    new Map<string, { rewardLevel: number; rewardLevelRevision?: number }>()
  );
  latestContentStateRef.current = contentState;
  const memoizedActions = useMemo(
    () =>
      ContentActions(
        contentDispatch,
        shouldApplyRewardLevelUpdate,
        getCanonicalRewardLevel
      ),
    [contentDispatch]
  );
  const getContentStateSnapshot = useMemo(
    () => () => latestContentStateRef.current,
    []
  );
  const contextValue = useMemo(
    () => ({
      state: contentState,
      actions: memoizedActions,
      getContentStateSnapshot
    }),
    [contentState, getContentStateSnapshot, memoizedActions]
  );
  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );

  function shouldApplyRewardLevelUpdate({
    contentId,
    contentType,
    rewardLevel,
    rewardLevelRevision
  }: {
    contentId: number;
    contentType: string;
    rewardLevel?: number;
    rewardLevelRevision?: number;
  }) {
    const shouldApply = shouldApplyRewardLevelRevision({
      revisions: rewardLevelRevisionsRef.current,
      contentId,
      contentType,
      rewardLevelRevision
    });
    if (shouldApply && Number.isFinite(rewardLevel)) {
      canonicalRewardLevelsRef.current.set(`${contentType}:${contentId}`, {
        rewardLevel: rewardLevel as number,
        rewardLevelRevision
      });
    }
    return shouldApply;
  }

  function getCanonicalRewardLevel(contentId: number, contentType: string) {
    const knownRewardLevel = canonicalRewardLevelsRef.current.get(
      `${contentType}:${contentId}`
    );
    if (knownRewardLevel) return knownRewardLevel;
    const content = latestContentStateRef.current[contentType + contentId];
    if (!content || content.contentType !== contentType) return undefined;
    return {
      rewardLevel: content.rewardLevel,
      rewardLevelRevision: content.rewardLevelRevision
    };
  }
}
