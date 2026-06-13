import { useEffect, useRef, useState } from 'react';

export type BuildProjectFileContributionAction =
  | 'merge'
  | 'replace'
  | 'update-from-main'
  | 'complete-merge'
  | 'reset-to-main';

export type BuildProjectFileDraftActionChoice =
  | 'save'
  | 'discard'
  | 'cancel';

export interface BuildProjectFileDraftActionPrompt {
  action: BuildProjectFileContributionAction;
}

export interface BuildProjectFilesDraftState {
  files: Array<{ path: string; content?: string }>;
  hasUnsavedChanges: boolean;
  saving: boolean;
}

interface BuildProjectFileSaveResult {
  success: boolean;
  error?: string;
}

interface BuildProjectFileContributionActionResult {
  ready: boolean;
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
  draftActionPrompt: BuildProjectFileDraftActionPrompt | null;
  resetDraftState(files: Array<{ path: string; content?: string }>): void;
  handleProjectFilesDraftStateChange(
    state: BuildProjectFilesDraftState
  ): void;
  prepareProjectFilesForContributionAction(options: {
    action: BuildProjectFileContributionAction;
  }): Promise<BuildProjectFileContributionActionResult>;
  resolveProjectFilesDraftActionPrompt(
    choice: BuildProjectFileDraftActionChoice
  ): void;
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
  discardProjectFilesDraft: () => Array<{ path: string; content?: string }>;
  onAppendFeedbackEvent: (event: BuildProjectFileDraftFeedbackEvent) => void;
}

export default function useProjectFileDrafts({
  isOwner,
  normalizeProjectFilePath,
  persistProjectFilesDraft,
  discardProjectFilesDraft,
  onAppendFeedbackEvent
}: UseBuildProjectFileDraftsOptions): BuildProjectFileDraftsApi {
  const [draftActionPrompt, setDraftActionPrompt] =
    useState<BuildProjectFileDraftActionPrompt | null>(null);
  const projectFilesDraftRef = useRef<Array<{ path: string; content?: string }>>(
    []
  );
  const hasUnsavedProjectFilesRef = useRef(false);
  const savingProjectFilesRef = useRef(false);
  const isOwnerRef = useRef(isOwner);
  const normalizeProjectFilePathRef = useRef(normalizeProjectFilePath);
  const persistProjectFilesDraftRef = useRef(persistProjectFilesDraft);
  const discardProjectFilesDraftRef = useRef(discardProjectFilesDraft);
  const onAppendFeedbackEventRef = useRef(onAppendFeedbackEvent);
  const pendingPromptResolveRef =
    useRef<((choice: BuildProjectFileDraftActionChoice) => void) | null>(null);
  const apiRef = useRef<BuildProjectFileDraftsApi | null>(null);

  isOwnerRef.current = isOwner;
  normalizeProjectFilePathRef.current = normalizeProjectFilePath;
  persistProjectFilesDraftRef.current = persistProjectFilesDraft;
  discardProjectFilesDraftRef.current = discardProjectFilesDraft;
  onAppendFeedbackEventRef.current = onAppendFeedbackEvent;

  useEffect(() => {
    return () => {
      const resolve = pendingPromptResolveRef.current;
      pendingPromptResolveRef.current = null;
      if (resolve) {
        resolve('cancel');
      }
    };
  }, []);

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

    function actionNeedsMergeLabel(
      action: BuildProjectFileContributionAction
    ) {
      return action === 'merge';
    }

    function actionText(action: BuildProjectFileContributionAction) {
      if (action === 'update-from-main') return 'updating from main';
      if (action === 'replace') return 'replacing';
      if (action === 'complete-merge') return 'completing this merge';
      if (action === 'reset-to-main') return 'resetting to main';
      return 'merging';
    }

    function waitForDraftActionChoice(
      action: BuildProjectFileContributionAction
    ) {
      if (pendingPromptResolveRef.current) {
        pendingPromptResolveRef.current('cancel');
        pendingPromptResolveRef.current = null;
      }
      setDraftActionPrompt({ action });
      return new Promise<BuildProjectFileDraftActionChoice>((resolve) => {
        pendingPromptResolveRef.current = resolve;
      });
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

    async function prepareProjectFilesForContributionAction({
      action
    }: {
      action: BuildProjectFileContributionAction;
    }): Promise<BuildProjectFileContributionActionResult> {
      if (!isOwnerRef.current) {
        return { ready: true };
      }

      const settled = await waitForProjectFileSaveToSettle();
      if (!settled) {
        appendFeedbackEvent({
          kind: 'lifecycle',
          phase: 'error',
          message: `Please wait for file save to finish before ${actionText(
            action
          )}.`
        });
        return { ready: false };
      }

      if (!hasUnsavedProjectFilesRef.current) {
        return { ready: true };
      }

      const pendingFiles = normalizeDraftFiles(projectFilesDraftRef.current);
      if (!pendingFiles.length) {
        return { ready: true };
      }

      const choice = await waitForDraftActionChoice(action);
      setDraftActionPrompt(null);
      pendingPromptResolveRef.current = null;
      if (choice === 'cancel') {
        return { ready: false };
      }

      if (choice === 'discard') {
        const discardedFiles = normalizeDraftFiles(
          discardProjectFilesDraftRef.current()
        );
        projectFilesDraftRef.current = discardedFiles;
        hasUnsavedProjectFilesRef.current = false;
        savingProjectFilesRef.current = false;
        appendFeedbackEvent({
          kind: 'status',
          phase: 'planning',
          message: actionNeedsMergeLabel(action)
            ? 'Discarded pending file edits before merge.'
            : 'Discarded pending file edits before continuing.'
        });
        return { ready: true };
      }

      const saved = await ensureProjectFilesPersisted({
        settleErrorMessage: `Please wait for file save to finish before ${actionText(
          action
        )}.`,
        draftChangedMessage:
          'Unable to continue: file drafts kept changing during save. Please stop editing and try again.',
        initialSaveMessage: actionNeedsMergeLabel(action)
          ? 'Saving unsaved files before merge...'
          : 'Saving unsaved files before continuing...',
        retrySaveMessage:
          'Draft changed during save. Saving latest edits again...',
        savedMessage: actionNeedsMergeLabel(action)
          ? 'Saved pending file edits before merge.'
          : 'Saved pending file edits before continuing.',
        saveFailurePrefix: 'Unable to continue: ',
        returnTrueOnEmptyDraft: true
      });
      return { ready: saved };
    }

    apiRef.current = {
      draftActionPrompt: null,

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

      prepareProjectFilesForContributionAction({ action }) {
        return prepareProjectFilesForContributionAction({ action });
      },

      resolveProjectFilesDraftActionPrompt(choice) {
        const resolve = pendingPromptResolveRef.current;
        pendingPromptResolveRef.current = null;
        setDraftActionPrompt(null);
        if (resolve) {
          resolve(choice);
        }
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

  return {
    ...(apiRef.current as BuildProjectFileDraftsApi),
    draftActionPrompt
  };
}
