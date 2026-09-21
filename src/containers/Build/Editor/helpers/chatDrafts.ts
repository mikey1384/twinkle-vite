import type { BuildAppReference } from './appReferences';
import type { BuildCommentFeedback } from '~/helpers/buildCommentFeedback';

export interface BuildChatDraft {
  message: string;
  apps: BuildAppReference[];
  feedback: BuildCommentFeedback[];
}

const emptyDraft: BuildChatDraft = { message: '', apps: [], feedback: [] };

// Drafts are local user input, scoped to an account and workspace. Keep a small
// in-memory cache so a round trip to an app's comments preserves the composer.
export function createBuildChatDraftStore() {
  const drafts = new Map<string, BuildChatDraft>();
  const listeners = new Map<string, Set<() => void>>();
  return {
    forWorkspace(userId: number, buildId: number) {
      const key = `${userId}:${buildId}`;
      const getSnapshot = () => drafts.get(key) || emptyDraft;
      return {
        getSnapshot,
        subscribe(listener: () => void) {
          const current = listeners.get(key) || new Set<() => void>();
          current.add(listener);
          listeners.set(key, current);
          return () => {
            current.delete(listener);
            if (!current.size) listeners.delete(key);
          };
        },
        setField<K extends keyof BuildChatDraft>(
          field: K,
          value:
            | BuildChatDraft[K]
            | ((current: BuildChatDraft[K]) => BuildChatDraft[K])
        ) {
          const current = getSnapshot();
          const next =
            typeof value === 'function' ? value(current[field]) : value;
          if (Object.is(current[field], next)) return;
          drafts.delete(key);
          const updated = { ...current, [field]: next };
          if (
            updated.message ||
            updated.apps.length ||
            updated.feedback.length
          ) {
            drafts.set(key, updated);
          }
          if (drafts.size > 30) {
            for (const candidate of drafts.keys()) {
              if (candidate !== key && !listeners.has(candidate)) {
                drafts.delete(candidate);
                if (drafts.size <= 30) break;
              }
            }
          }
          listeners.get(key)?.forEach((listener) => listener());
        }
      };
    }
  };
}
