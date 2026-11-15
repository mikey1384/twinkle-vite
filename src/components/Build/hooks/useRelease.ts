import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { useToast } from '~/contexts/Toast';
import { getBuildReleaseAction, releaseBuild } from '~/helpers/buildRelease';
import {
  finishUpdateNoteAfterPublish,
  ONE_TAP_CHOICE,
  resolveUpdateNoteReleaseStep,
  resolveUpdateNoteToastTarget,
  type BuildUpdateNoteChoice,
  type BuildUpdateNoteOutcome
} from '~/helpers/buildUpdateNote';
import type { UpdateNoteDialogProps } from '../UpdateNoteDialog';
import useRewardStatus from '../Rewards/useRewardStatus';

export default function useRelease({
  buildId,
  enabled,
  isPublic,
  hasUnpublishedChanges,
  hasUnsavedChanges = false,
  busy = false,
  changeKey = '',
  save,
  preparePublish,
  onPublished,
  onReviewProposal,
  onError,
  onUpdateNote
}: {
  buildId: number;
  enabled: boolean;
  isPublic: boolean;
  hasUnpublishedChanges?: boolean;
  hasUnsavedChanges?: boolean;
  busy?: boolean;
  changeKey?: string;
  save?: () => Promise<boolean>;
  preparePublish?: () => Promise<{ thumbnailUrl?: string }>;
  onPublished: (result: any) => void | Promise<void>;
  onReviewProposal: () => void;
  onError?: (error: any) => void;
  // How the optional update note went, after the update itself succeeded.
  onUpdateNote?: (outcome: BuildUpdateNoteOutcome) => void;
}) {
  const requestReview = useAppContext(
    (v) => v.requestHelpers.requestBuildRewardReview
  );
  const publish = useAppContext((v) => v.requestHelpers.publishBuild);
  const postUpdateNote = useAppContext(
    (v) => v.requestHelpers.postBuildUpdateNote
  );
  const skipUpdateNote = useAppContext(
    (v) => v.requestHelpers.skipBuildUpdateNote
  );
  const loadUpdateNoteReleaseState = useAppContext(
    (v) => v.requestHelpers.loadBuildUpdateNoteReleaseState
  );
  const showToast = useToast();
  const navigate = useNavigate();
  // A toast can be tapped after this surface closed or moved to another
  // app; its tap must still lead somewhere real (openNoteFlow).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const rewardStatus = useRewardStatus(buildId, enabled, changeKey);
  const activeRequest = useRef(false);
  const currentBuildId = useRef(buildId);
  currentBuildId.current = buildId;
  const [publishing, setPublishing] = useState(false);
  // Every surface that updates a live app renders <UpdateNoteDialog> with
  // `updateDialog`: before publishing (the release waits here for the
  // owner's answer) or after a one-tap update ("Add an update note").
  const [dialogState, setDialogState] = useState<
    | { mode: 'before_publish'; buildId: number; firstTime: boolean; enabled: boolean }
    | {
        mode: 'after_publish';
        buildId: number;
        artifactVersionId: number;
        initialDraft?: { content: string; draftId: number | null };
      }
    | null
  >(null);
  const updateDialogAnswer = useRef<
    ((choice: BuildUpdateNoteChoice | null) => void) | null
  >(null);
  const [failure, setFailure] = useState<{
    buildId: number;
    message: string;
  } | null>(null);
  const action = getBuildReleaseAction({
    settings: rewardStatus.settings,
    isPublic,
    hasUnpublishedChanges,
    hasUnsavedChanges,
    busy: publishing || busy
  });

  return {
    action,
    publishing: publishing || busy,
    error: failure?.buildId === buildId ? failure.message : '',
    rewardStatus,
    run,
    updateDialog: getUpdateDialogProps()
  };

  function getUpdateDialogProps(): UpdateNoteDialogProps | null {
    if (!dialogState) return null;
    if (dialogState.mode === 'after_publish') {
      return { ...dialogState, onClose: () => setDialogState(null) };
    }
    return {
      ...dialogState,
      onConfirm: (choice: BuildUpdateNoteChoice) => answerUpdateDialog(choice),
      onCancel: () => answerUpdateDialog(null)
    };
  }

  function answerUpdateDialog(choice: BuildUpdateNoteChoice | null) {
    const answer = updateDialogAnswer.current;
    updateDialogAnswer.current = null;
    setDialogState(null);
    answer?.(choice);
  }

  // Update stays one tap: the dialog only shows when the server says so (the
  // first time, or while the owner's remembered choice is on).
  async function confirmUpdate(noteChoice: {
    current: BuildUpdateNoteChoice | null;
  }) {
    let state: any = null;
    try {
      // Short and without retries (UPDATE_NOTE_RELEASE_STATE_TIMEOUT_MS).
      state = await loadUpdateNoteReleaseState(buildId);
    } catch {
      // No answer: update in one tap; a note never blocks a release.
    }
    if (resolveUpdateNoteReleaseStep(state) === 'one_tap') {
      noteChoice.current = ONE_TAP_CHOICE;
      return true;
    }
    return new Promise<boolean>((resolve) => {
      updateDialogAnswer.current = (choice) => {
        noteChoice.current = choice;
        resolve(Boolean(choice));
      };
      setDialogState({
        mode: 'before_publish',
        buildId,
        firstTime: Boolean(state?.firstTime),
        enabled: Boolean(state?.enabled)
      });
    });
  }

  // Update was pressed while Lumine was still writing: the draft waits for
  // the owner's review in the same "add a note" flow; nothing posts unseen.
  function offerDraftReview({
    artifactVersionId,
    content,
    draftId
  }: {
    artifactVersionId: number;
    content: string;
    draftId: number | null;
  }) {
    const releasedBuildId = buildId;
    showToast({
      message: 'Your note is ready: review and post',
      duration: 12000,
      onClick: () =>
        openNoteFlow(releasedBuildId, {
          mode: 'after_publish',
          buildId: releasedBuildId,
          artifactVersionId,
          initialDraft: { content, draftId }
        })
    });
  }

  // The update confirmation for a one-tap update, with its link.
  function offerUpdateNoteLink(artifactVersionId: number) {
    const releasedBuildId = buildId;
    showToast({
      message: 'Your update is live. Add an update note',
      duration: 8000,
      onClick: () =>
        openNoteFlow(releasedBuildId, {
          mode: 'after_publish',
          buildId: releasedBuildId,
          artifactVersionId
        })
    });
  }

  // Open the note dialog here only while this surface is still showing the
  // same app. Otherwise go to that app's workspace: a ready draft waits there
  // as a card, and the build chat can write one for the link case.
  function openNoteFlow(
    releasedBuildId: number,
    dialog: NonNullable<typeof dialogState>
  ) {
    if (
      resolveUpdateNoteToastTarget({
        mounted: mountedRef.current,
        currentBuildId: currentBuildId.current,
        releasedBuildId
      }) === 'dialog'
    ) {
      setDialogState(dialog);
      return;
    }
    navigate(`/build/${releasedBuildId}`);
  }

  async function run() {
    if (!enabled || !buildId || activeRequest.current || action.disabled)
      return;
    activeRequest.current = true;
    setPublishing(true);
    setFailure(null);
    const noteChoice: { current: BuildUpdateNoteChoice | null } = {
      current: null
    };
    try {
      const outcome = await releaseBuild({
        buildId,
        save,
        preparePublish,
        confirmUpdate: isPublic ? () => confirmUpdate(noteChoice) : undefined,
        loadRewards: rewardStatus.load,
        requestReview: async (id) => {
          await requestReview(id);
          // The draft can change while the request or its chat notification is
          // in flight. Confirm the current candidate through the ordered reader.
          return rewardStatus.load();
        },
        publish
      });
      if (currentBuildId.current !== buildId) return;
      if (outcome.kind === 'published') {
        const choice = noteChoice.current;
        if (choice) {
          // After the publish succeeded, from the server's result. Runs in
          // the background: the update never waits on the note.
          void finishUpdateNoteAfterPublish({
            buildId,
            choice,
            result: outcome.result,
            post: postUpdateNote,
            skip: skipUpdateNote
          }).then((noteOutcome) => {
            if (noteOutcome.kind === 'one_tap') {
              offerUpdateNoteLink(noteOutcome.artifactVersionId);
            } else if (noteOutcome.kind === 'draft_ready') {
              offerDraftReview(noteOutcome);
            }
            onUpdateNote?.(noteOutcome);
          });
        }
        await onPublished(outcome.result);
        rewardStatus.refresh();
      } else if (
        outcome.kind === 'approval' &&
        ['changes_offered', 'changes_requested', 'paused'].includes(
          outcome.settings.state
        )
      ) {
        onReviewProposal();
      }
    } catch (error: any) {
      if (currentBuildId.current !== buildId) return;
      setFailure({
        buildId,
        message:
          error?.response?.data?.error ||
          error?.message ||
          'Unable to update this app. Please try again.'
      });
      onError?.(error);
    } finally {
      if (updateDialogAnswer.current) answerUpdateDialog(null);
      activeRequest.current = false;
      setPublishing(false);
    }
  }
}

export type BuildReleaseControl = ReturnType<typeof useRelease>;
