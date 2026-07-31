import type {
  BuildStudioBrowseMode,
  BuildStudioSection,
  BuildStudioTab,
  PromptStudioBrowseMode,
  PromptStudioTab
} from '~/contexts/Build/reducer';

export interface BuildStudioPreferences {
  activeTab: BuildStudioTab;
  browseModes: {
    community: BuildStudioBrowseMode;
    open_source: BuildStudioBrowseMode;
  };
  section: BuildStudioSection;
  promptTab: PromptStudioTab;
  promptBrowseModes: {
    community: PromptStudioBrowseMode;
  };
}

export type BuildStudioPreferencesPatch = Omit<
  Partial<BuildStudioPreferences>,
  'browseModes' | 'promptBrowseModes'
> & {
  browseModes?: Partial<BuildStudioPreferences['browseModes']>;
  promptBrowseModes?: Partial<BuildStudioPreferences['promptBrowseModes']>;
};

interface BuildStudioPreferenceSaveQueue {
  latestSaveId: number;
  lastConfirmedData: any;
  pendingCount: number;
  queuedPreferences: BuildStudioPreferences | null;
  unconfirmedPatches: Array<{
    saveId: number;
    patch: BuildStudioPreferencesPatch;
  }>;
  tail: Promise<void>;
}

const preferenceSaveQueues = new Map<string, BuildStudioPreferenceSaveQueue>();

export function normalizeBuildStudioPreferences(
  value: any
): BuildStudioPreferences {
  return {
    activeTab: normalizeBuildStudioTab(value?.activeTab),
    browseModes: {
      community: normalizeBrowseMode(value?.browseModes?.community),
      open_source: normalizeBrowseMode(value?.browseModes?.open_source)
    },
    section: value?.section === 'prompts' ? 'prompts' : 'apps',
    promptTab: value?.promptTab === 'my' ? 'my' : 'community',
    promptBrowseModes: {
      community: normalizePromptBrowseMode(value?.promptBrowseModes?.community)
    }
  };
}

export function getBuildStudioPreferencesKey(value: any) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return JSON.stringify(normalizeBuildStudioPreferences(value));
}

export function mergeBuildStudioPreferences({
  current,
  patch
}: {
  current: any;
  patch: BuildStudioPreferencesPatch;
}): BuildStudioPreferences {
  const normalizedCurrent = normalizeBuildStudioPreferences(current);
  const scalarPatch = Object.fromEntries(
    Object.entries(patch).filter(
      ([key, value]) =>
        key !== 'browseModes' &&
        key !== 'promptBrowseModes' &&
        value !== undefined
    )
  );
  return normalizeBuildStudioPreferences({
    ...normalizedCurrent,
    ...scalarPatch,
    browseModes: {
      ...normalizedCurrent.browseModes,
      ...(patch.browseModes || {})
    },
    promptBrowseModes: {
      ...normalizedCurrent.promptBrowseModes,
      ...(patch.promptBrowseModes || {})
    }
  });
}

export function enqueueBuildStudioPreferenceSave({
  current,
  patch,
  save,
  scope,
  onConfirmed,
  onError
}: {
  current: any;
  patch: BuildStudioPreferencesPatch;
  save: (patch: BuildStudioPreferencesPatch) => Promise<any>;
  scope: number | string;
  onConfirmed: (data: any) => void;
  onError: (error: unknown) => void;
}) {
  const queue = getBuildStudioPreferenceSaveQueue(scope);
  if (queue.pendingCount === 0) {
    queue.lastConfirmedData = null;
    queue.queuedPreferences = null;
  }
  const unconfirmedPatch = mergeBuildStudioPreferencePatches(
    queue.unconfirmedPatches.map(({ patch: unconfirmed }) => unconfirmed)
  );
  // A later user action may arrive before an earlier PUT has returned. Compose
  // its explicit patch over the queued intent so omitted fields cannot regress
  // to the caller's older persisted snapshot.
  const basePreferences =
    queue.queuedPreferences ||
    mergeBuildStudioPreferences({
      current,
      patch: unconfirmedPatch
    });
  const preferences = mergeBuildStudioPreferences({
    current: basePreferences,
    patch
  });
  if (
    getBuildStudioPreferencesKey(preferences) ===
    getBuildStudioPreferencesKey(basePreferences)
  ) {
    if (queue.pendingCount > 0) {
      return queue.tail;
    }
    if (queue.unconfirmedPatches.length === 0) {
      return Promise.resolve();
    }
  }

  const saveId = queue.latestSaveId + 1;
  queue.latestSaveId = saveId;
  queue.pendingCount += 1;
  queue.queuedPreferences = preferences;
  queue.unconfirmedPatches.push({ saveId, patch });
  const performSave = async () => {
    try {
      // Only send sparse user intent. Failed earlier entries remain in this
      // per-user queue and are folded into the next write, while untouched
      // fields continue to come from the server's atomic canonical merge.
      const requestPatch = mergeBuildStudioPreferencePatches(
        queue.unconfirmedPatches
          .filter(({ saveId: unconfirmedSaveId }) => unconfirmedSaveId <= saveId)
          .map(({ patch: unconfirmed }) => unconfirmed)
      );
      const data = await save(requestPatch);
      queue.lastConfirmedData = data;
      queue.unconfirmedPatches = queue.unconfirmedPatches.filter(
        ({ saveId: unconfirmedSaveId }) => unconfirmedSaveId > saveId
      );
      const confirmedPreferences = getConfirmedBuildStudioPreferences(data);
      if (confirmedPreferences) {
        queue.queuedPreferences = mergeBuildStudioPreferences({
          current: confirmedPreferences,
          patch: mergeBuildStudioPreferencePatches(
            queue.unconfirmedPatches.map(
              ({ patch: unconfirmed }) => unconfirmed
            )
          )
        });
      }
      if (saveId === queue.latestSaveId) {
        onConfirmed(data);
      }
    } catch (error) {
      onError(error);
      // If an earlier queued write succeeded before the latest one failed,
      // publish that confirmed response so shared state matches the server.
      if (saveId === queue.latestSaveId && queue.lastConfirmedData) {
        onConfirmed(queue.lastConfirmedData);
      }
    } finally {
      queue.pendingCount = Math.max(0, queue.pendingCount - 1);
      if (queue.pendingCount === 0) {
        queue.lastConfirmedData = null;
        if (queue.unconfirmedPatches.length === 0) {
          queue.queuedPreferences = null;
        }
      }
    }
  };
  const savePromise = queue.tail.then(performSave, performSave);
  queue.tail = savePromise;
  return savePromise;
}

function getBuildStudioPreferenceSaveQueue(
  scope: number | string
): BuildStudioPreferenceSaveQueue {
  const key = String(scope);
  const existingQueue = preferenceSaveQueues.get(key);
  if (existingQueue) return existingQueue;
  const queue: BuildStudioPreferenceSaveQueue = {
    latestSaveId: 0,
    lastConfirmedData: null,
    pendingCount: 0,
    queuedPreferences: null,
    unconfirmedPatches: [],
    tail: Promise.resolve()
  };
  preferenceSaveQueues.set(key, queue);
  return queue;
}

function mergeBuildStudioPreferencePatches(
  patches: BuildStudioPreferencesPatch[]
): BuildStudioPreferencesPatch {
  const merged: BuildStudioPreferencesPatch = {};
  for (const patch of patches) {
    if (patch.activeTab !== undefined) {
      merged.activeTab = patch.activeTab;
    }
    if (patch.section !== undefined) {
      merged.section = patch.section;
    }
    if (patch.promptTab !== undefined) {
      merged.promptTab = patch.promptTab;
    }
    if (patch.browseModes) {
      merged.browseModes = {
        ...(merged.browseModes || {}),
        ...patch.browseModes
      };
    }
    if (patch.promptBrowseModes) {
      merged.promptBrowseModes = {
        ...(merged.promptBrowseModes || {}),
        ...patch.promptBrowseModes
      };
    }
  }
  return merged;
}

function getConfirmedBuildStudioPreferences(
  data: any
): BuildStudioPreferences | null {
  const value = data?.buildStudio || data?.state?.buildStudio;
  return value && typeof value === 'object'
    ? normalizeBuildStudioPreferences(value)
    : null;
}

function normalizeBuildStudioTab(value: any): BuildStudioTab {
  if (
    value === 'collaborating' ||
    value === 'community' ||
    value === 'open_source'
  ) {
    return value;
  }
  return 'mine';
}

function normalizeBrowseMode(value: any): BuildStudioBrowseMode {
  return value === 'leaderboard' ? 'leaderboard' : 'recent';
}

function normalizePromptBrowseMode(value: any): PromptStudioBrowseMode {
  return value === 'leaderboard' ? 'leaderboard' : 'recent';
}
