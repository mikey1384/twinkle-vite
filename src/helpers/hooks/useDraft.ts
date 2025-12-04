import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';

const SAVE_DEBOUNCE_MS = 3000;
const SAVED_INDICATOR_MS = 3000;

interface UseDraftParams {
  contentType: string;
  rootType?: string;
  rootId?: number;
  enabled?: boolean;
}

interface DraftData {
  content?: string;
  title?: string;
  description?: string;
  secretAnswer?: string;
  rewardLevel?: number;
}

export default function useDraft({
  contentType,
  rootType,
  rootId,
  enabled = true
}: UseDraftParams) {
  const saveDraftApi = useAppContext((v) => v.requestHelpers.saveDraft);
  const deleteDraftApi = useAppContext((v) => v.requestHelpers.deleteDraft);
  const checkDraftsApi = useAppContext((v) => v.requestHelpers.checkDrafts);

  const [draftId, setDraftId] = useState<number | null>(null);
  const [savingState, setSavingState] = useState<'idle' | 'saved'>('idle');

  const draftIdRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const savedIndicatorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const saveDraft = useCallback(
    (draftData: DraftData) => {
      if (!enabled) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }

      setSavingState('idle');

      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const result = await saveDraftApi({
            ...draftData,
            contentType,
            draftId: draftIdRef.current,
            rootType,
            rootId
          });

          if (result?.draftId) {
            setDraftId(result.draftId);
            draftIdRef.current = result.draftId;
          }

          setSavingState('saved');
          savedIndicatorTimeoutRef.current = window.setTimeout(() => {
            setSavingState('idle');
          }, SAVED_INDICATOR_MS);
        } catch (error) {
          console.error('Failed to save draft:', error);
          setSavingState('idle');
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [contentType, enabled, rootId, rootType, saveDraftApi]
  );

  const deleteDraft = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (draftIdRef.current) {
      try {
        await deleteDraftApi(draftIdRef.current);
        setDraftId(null);
        draftIdRef.current = null;
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }
  }, [deleteDraftApi]);

  const loadDraft = useCallback(async () => {
    if (!enabled) return null;

    try {
      const drafts = await checkDraftsApi({
        contentType,
        rootType,
        rootId
      });

      const draft = drafts.find(
        (d: { type: string; rootType?: string; rootId?: number }) => {
          if (d.type !== contentType) return false;
          // Always filter by rootType/rootId if they're provided
          if (rootType && rootId) {
            return d.rootType === rootType && d.rootId === rootId;
          }
          return true;
        }
      );

      if (draft) {
        setDraftId(draft.id);
        draftIdRef.current = draft.id;
        return draft;
      }

      return null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }, [checkDraftsApi, contentType, enabled, rootId, rootType]);

  const cancelPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  return {
    draftId,
    savingState,
    saveDraft,
    deleteDraft,
    loadDraft,
    cancelPendingSave
  };
}
