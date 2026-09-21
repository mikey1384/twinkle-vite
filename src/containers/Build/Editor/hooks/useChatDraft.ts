import {
  useMemo,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction
} from 'react';
import {
  createBuildChatDraftStore,
  type BuildChatDraft
} from '../helpers/chatDrafts';

const drafts = createBuildChatDraftStore();

export default function useChatDraft(userId: number, buildId: number) {
  const workspace = useMemo(
    () => drafts.forWorkspace(userId, buildId),
    [userId, buildId]
  );
  const draft = useSyncExternalStore(
    workspace.subscribe,
    workspace.getSnapshot,
    workspace.getSnapshot
  );
  const setters = useMemo(
    () => ({
      setBuildChatDraftMessage: ((value) =>
        workspace.setField('message', value)) as Dispatch<
        SetStateAction<string>
      >,
      setBuildChatDraftApps: ((value) =>
        workspace.setField('apps', value)) as Dispatch<
        SetStateAction<BuildChatDraft['apps']>
      >,
      setBuildChatDraftFeedback: ((value) =>
        workspace.setField('feedback', value)) as Dispatch<
        SetStateAction<BuildChatDraft['feedback']>
      >
    }),
    [workspace]
  );
  return {
    buildChatDraftMessage: draft.message,
    buildChatDraftApps: draft.apps,
    buildChatDraftFeedback: draft.feedback,
    ...setters
  };
}
