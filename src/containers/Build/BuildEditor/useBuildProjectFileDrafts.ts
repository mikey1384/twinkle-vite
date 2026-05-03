import { useRef } from 'react';

export interface BuildProjectFilesDraftState {
  files: Array<{ path: string; content?: string }>;
  hasUnsavedChanges: boolean;
  saving: boolean;
}

interface BuildProjectFileSaveResult {
  success: boolean;
  error?: string;
}

interface BuildProjectFileDraftFeedbackEvent {
  kind: 'lifecycle' | 'status';
  phase: string | null;
  message: string;
  pageFeedbackOnMissingRequestId?: boolean;
}

interface BuildProjectFilePersistenceOptions {
  settleErrorMessage: string;
  draftChangedMessage: string;
  initialSaveMessage: string;
  retrySaveMessage: string;
  savedMessage: string;
  saveFailurePrefix: string;
  pageFeedbackOnMissingRequestId?: boolean;
  returnTrueOnEmptyDraft?: boolean;
}

interface BuildProjectFileDraftsApi {
  resetDraftState(files: Array<{ path: string; content?: string }>): void;
  handleProjectFilesDraftStateChange(
    state: BuildProjectFilesDraftState
  ): void;
  ensureProjectFilesPersistedBeforeContributionAction(options: {
    action: 'merge' | 'update-from-main';
  }): Promise<boolean>;
  ensureProjectFilesPersistedBeforeRun(options: {
    runType: 'copilot' | 'greeting';
  }): Promise<boolean>;
  ensureProjectFilesPersistedBeforePublish(): Promise<boolean>;
}

interface UseBuildProjectFileDraftsOptions {
  isOwner: boolean;
  normalizeProjectFilePath: (rawPath: string) => string;
  persistProjectFilesDraft: (
    files: Array<{ path: string; content?: string }>
  ) => Promise<BuildProjectFileSaveResult>;
  onAppendFeedbackEvent: (event: BuildProjectFileDraftFeedbackEvent) => void;
}

export default function useBuildProjectFileDrafts({
  isOwner,
  normalizeProjectFilePath,
  persistProjectFilesDraft,
  onAppendFeedbackEvent
}: UseBuildProjectFileDraftsOptions): BuildProjectFileDraftsApi {
  const projectFilesDraftRef = useRef<Array<{ path: string; content?: string }>>(
    []
  );
  const hasUnsavedProjectFilesRef = useRef(false);
  const savingProjectFilesRef = useRef(false);
  const isOwnerRef = useRef(isOwner);
  const normalizeProjectFilePathRef = useRef(normalizeProjectFilePath);
  const persistProjectFilesDraftRef = useRef(persistProjectFilesDraft);
  const onAppendFeedbackEventRef = useRef(onAppendFeedbackEvent);
  const apiRef = useRef<BuildProjectFileDraftsApi | null>(null);

  isOwnerRef.current = isOwner;
  normalizeProjectFilePathRef.current = normalizeProjectFilePath;
  persistProjectFilesDraftRef.current = persistProjectFilesDraft;
  onAppendFeedbackEventRef.current = onAppendFeedbackEvent;

  if (!apiRef.current) {
    function wait(ms: number) {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    function normalizeDraftFiles(
      files: Array<{ path: string; content?: string }>
    ) {
      return Array.isArray(files)
        ? files.map((file) => ({
            path: normalizeProjectFilePathRef.current(file.path),
            content: typeof file.content === 'string' ? file.content : ''
          }))
        : [];
    }

    function draftSignature(files: Array<{ path: string; content?: string }>) {
      return files
        .map(
          (file) =>
            `${file.path}\n${typeof file.content === 'string' ? file.content : ''}`
        )
        .join('\n---\n');
    }

    function appendFeedbackEvent(event: BuildProjectFileDraftFeedbackEvent) {
      onAppendFeedbackEventRef.current(event);
    }

    async function waitForProjectFileSaveToSettle(timeoutMs = 12000) {
      const startedAt = Date.now();
      while (
        savingProjectFilesRef.current &&
        Date.now() - startedAt < timeoutMs
      ) {
        await wait(100);
      }
      return !savingProjectFilesRef.current;
    }

    async function ensureProjectFilesPersisted(
      options: BuildProjectFilePersistenceOptions
    ) {
      const MAX_AUTOSAVE_ATTEMPTS = 3;
      if (!isOwnerRef.current) {
        return true;
      }

      const settled = await waitForProjectFileSaveToSettle();
      if (!settled) {
        appendFeedbackEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: options.settleErrorMessage,
          pageFeedbackOnMissingRequestId:
            options.pageFeedbackOnMissingRequestId
        });
        return false;
      }

      let attempt = 0;
      while (hasUnsavedProjectFilesRef.current) {
        if (attempt >= MAX_AUTOSAVE_ATTEMPTS) {
          appendFeedbackEvent({
            kind: 'lifecycle',
            phase: 'error',
            message: options.draftChangedMessage,
            pageFeedbackOnMissingRequestId:
              options.pageFeedbackOnMissingRequestId
          });
          return false;
        }
        attempt += 1;

        const pendingFiles = normalizeDraftFiles(projectFilesDraftRef.current);
        if (!pendingFiles.length && options.returnTrueOnEmptyDraft) {
          return true;
        }
        const pendingSignature = draftSignature(pendingFiles);

        appendFeedbackEvent({
          kind: 'status',
          phase: options.pageFeedbackOnMissingRequestId ? 'publish' : 'planning',
          message:
            attempt === 1
              ? options.initialSaveMessage
              : options.retrySaveMessage,
          pageFeedbackOnMissingRequestId:
            options.pageFeedbackOnMissingRequestId
        });
        const saveResult =
          await persistProjectFilesDraftRef.current(pendingFiles);
        if (!saveResult.success) {
          appendFeedbackEvent({
            kind: 'lifecycle',
            phase: 'error',
            message: `${options.saveFailurePrefix}${saveResult.error || 'failed to save files'}`,
            pageFeedbackOnMissingRequestId:
              options.pageFeedbackOnMissingRequestId
          });
          return false;
        }

        await wait(40);
        const settledAfterSave = await waitForProjectFileSaveToSettle(4000);
        if (!settledAfterSave) {
          appendFeedbackEvent({
            kind: 'lifecycle',
            phase: 'error',
            message: options.settleErrorMessage,
            pageFeedbackOnMissingRequestId:
              options.pageFeedbackOnMissingRequestId
          });
          return false;
        }

        if (!hasUnsavedProjectFilesRef.current) {
          appendFeedbackEvent({
            kind: 'status',
            phase: options.pageFeedbackOnMissingRequestId ? 'publish' : 'planning',
            message: options.savedMessage,
            pageFeedbackOnMissingRequestId:
              options.pageFeedbackOnMissingRequestId
          });
          return true;
        }

        const latestSignature = draftSignature(
          normalizeDraftFiles(projectFilesDraftRef.current)
        );
        if (latestSignature === pendingSignature) {
          const settleDeadline = Date.now() + 1200;
          while (
            hasUnsavedProjectFilesRef.current &&
            Date.now() < settleDeadline
          ) {
            await wait(60);
          }
          if (!hasUnsavedProjectFilesRef.current) {
            appendFeedbackEvent({
              kind: 'status',
              phase: options.pageFeedbackOnMissingRequestId
                ? 'publish'
                : 'planning',
              message: options.savedMessage,
              pageFeedbackOnMissingRequestId:
                options.pageFeedbackOnMissingRequestId
            });
            return true;
          }
        }
      }

      return true;
    }

    apiRef.current = {
      resetDraftState(files) {
        projectFilesDraftRef.current = normalizeDraftFiles(files);
        hasUnsavedProjectFilesRef.current = false;
        savingProjectFilesRef.current = false;
      },

      handleProjectFilesDraftStateChange(state) {
        projectFilesDraftRef.current = normalizeDraftFiles(state.files);
        hasUnsavedProjectFilesRef.current = Boolean(state.hasUnsavedChanges);
        savingProjectFilesRef.current = Boolean(state.saving);
      },

      ensureProjectFilesPersistedBeforeContributionAction({ action }) {
        const isUpdateFromMain = action === 'update-from-main';
        const actionText = isUpdateFromMain ? 'updating from main' : 'merging';
        const actionVerb = isUpdateFromMain ? 'update from main' : 'merge';
        return ensureProjectFilesPersisted({
          settleErrorMessage: `Please wait for file save to finish before ${actionText} this branch.`,
          draftChangedMessage: `Unable to ${actionVerb}: file drafts kept changing during auto-save. Please stop editing and try again.`,
          initialSaveMessage: `Saving unsaved files before ${actionVerb}...`,
          retrySaveMessage:
            `Draft changed during save. Saving latest edits before ${actionVerb}...`,
          savedMessage: `Saved pending file edits before ${actionVerb}.`,
          saveFailurePrefix: `Unable to ${actionVerb}: `,
          returnTrueOnEmptyDraft: true
        });
      },

      ensureProjectFilesPersistedBeforeRun({ runType }) {
        return ensureProjectFilesPersisted({
          settleErrorMessage:
            'Please wait for file save to finish before starting a new run.',
          draftChangedMessage:
            'Unable to start run: file drafts kept changing during auto-save. Please stop editing and try again.',
          initialSaveMessage: 'Saving unsaved files before starting run...',
          retrySaveMessage: 'Draft changed during save. Saving latest edits again...',
          savedMessage: 'Saved pending file edits.',
          saveFailurePrefix: `Unable to start ${runType}: `,
          returnTrueOnEmptyDraft: true
        });
      },

      ensureProjectFilesPersistedBeforePublish() {
        return ensureProjectFilesPersisted({
          settleErrorMessage:
            'Please wait for file save to finish before publishing.',
          draftChangedMessage:
            'Unable to publish: file drafts kept changing during auto-save. Please stop editing and publish again.',
          initialSaveMessage: 'Saving unsaved files before publish...',
          retrySaveMessage:
            'Draft changed during save. Saving latest edits before publish...',
          savedMessage: 'Saved pending file edits before publish.',
          saveFailurePrefix: 'Unable to publish: ',
          pageFeedbackOnMissingRequestId: true
        });
      }
    };
  }

  return apiRef.current;
}
