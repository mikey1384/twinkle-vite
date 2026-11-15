import { parseCommentSettings } from './aiEnergySponsorship';

// Lumine update notes on the website side. The Update dialog
// (components/Build/UpdateNoteDialog.tsx) collects the owner's choice; this
// module posts it once the publish has succeeded, from the server's result.

export interface BuildUpdateNoteDraftResult {
  content: string;
  draftId: number | null;
}

export interface BuildUpdateNoteChoice {
  // false: the owner's remembered choice is off, so Update was one tap and
  // no dialog showed. The confirmation then offers "Add an update note".
  dialogShown: boolean;
  // The server-owned switch as the dialog last confirmed it.
  post: boolean;
  content: string;
  draftId: number | null;
  // Update pressed while Lumine was still writing. The publish never waits
  // for it, and a note the owner has not seen never posts by itself: when
  // the draft arrives the owner gets "Your note is ready: review and post".
  pendingDraft?: Promise<BuildUpdateNoteDraftResult | null> | null;
}

export type BuildUpdateNoteOutcome =
  | { kind: 'no_new_version' }
  | { kind: 'one_tap'; artifactVersionId: number }
  | {
      kind: 'draft_ready';
      artifactVersionId: number;
      content: string;
      draftId: number | null;
    }
  | { kind: 'skipped' }
  // The owner wanted a note but no draft arrived in time on this page (or
  // drafting failed): nothing posted, nothing counted as skipped.
  | { kind: 'draft_not_ready' }
  | { kind: 'posted'; commentId: number; versionNumber: number; alreadyPosted: boolean }
  | { kind: 'failed'; message: string };

// How long the page keeps waiting for a draft after Update was pressed: the
// server's whole model budget (two 45 s attempts) plus a margin. If the page
// closes first, the ready draft is shown later in the workspace (the server
// keeps it for the live version); it is never counted as skipped.
export const UPDATE_NOTE_PENDING_DRAFT_WAIT_MS = 100_000;
// The one-tap decision when Update is pressed: past this, update in one tap.
export const UPDATE_NOTE_RELEASE_STATE_TIMEOUT_MS = 2_500;

export interface BuildUpdateNoteReleaseState {
  showDialog?: boolean;
  firstTime?: boolean;
  enabled?: boolean;
}

// Update stays one tap. The server says whether the dialog shows (the first
// time, or while the remembered choice is on). Without an answer the update
// goes ahead in one tap: a note never blocks a release.
export function resolveUpdateNoteReleaseStep(
  state: BuildUpdateNoteReleaseState | null | undefined
): 'dialog' | 'one_tap' {
  return state && state.showDialog === true ? 'dialog' : 'one_tap';
}

export const ONE_TAP_CHOICE: BuildUpdateNoteChoice = {
  dialogShown: false,
  post: false,
  content: '',
  draftId: null
};

// Only a publish that made a new live version has a note. The "already up to
// date" recovery result carries no published version id, so nothing posts.
export function getPublishedUpdateVersionId(result: any): number {
  const build = result?.build;
  if (!build || !build.isPublic) return 0;
  const versionId = Number(build.publishedArtifactVersionId || 0);
  return Number.isSafeInteger(versionId) && versionId > 0 ? versionId : 0;
}

function waitFor<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });
}

export async function finishUpdateNoteAfterPublish({
  buildId,
  choice,
  result,
  post,
  skip,
  pendingDraftWaitMs = UPDATE_NOTE_PENDING_DRAFT_WAIT_MS
}: {
  buildId: number;
  choice: BuildUpdateNoteChoice;
  result: any;
  post: (args: {
    buildId: number;
    artifactVersionId: number;
    content: string;
    draftId?: number | null;
    source: 'dialog';
  }) => Promise<any>;
  skip: (args: { buildId: number; draftId?: number | null }) => Promise<any>;
  pendingDraftWaitMs?: number;
}): Promise<BuildUpdateNoteOutcome> {
  const artifactVersionId = getPublishedUpdateVersionId(result);
  if (!artifactVersionId) return { kind: 'no_new_version' };
  // One tap: nothing to post; the confirmation offers the link instead (the
  // server already counted the one-tap update).
  if (!choice.dialogShown) return { kind: 'one_tap', artifactVersionId };
  const content = String(choice.content || '').trim();
  const draftId = choice.draftId;
  if (choice.post && !content && choice.pendingDraft) {
    const drafted = await waitFor(choice.pendingDraft, pendingDraftWaitMs);
    const draftedContent = String(drafted?.content || '').trim();
    if (draftedContent) {
      // Unseen model text: hand it back for review, never post it.
      return {
        kind: 'draft_ready',
        artifactVersionId,
        content: draftedContent,
        draftId: drafted?.draftId ?? null
      };
    }
    return { kind: 'draft_not_ready' };
  }
  if (!choice.post || !content) {
    try {
      await skip({ buildId, draftId });
    } catch {
      // A counter; the update already went live.
    }
    return { kind: 'skipped' };
  }
  try {
    const posted = await post({
      buildId,
      artifactVersionId,
      content,
      draftId,
      source: 'dialog'
    });
    return {
      kind: 'posted',
      commentId: Number(posted?.commentId || 0),
      versionNumber: Number(posted?.versionNumber || 0),
      alreadyPosted: Boolean(posted?.alreadyPosted)
    };
  } catch (error: any) {
    return {
      kind: 'failed',
      message:
        error?.response?.data?.error ||
        error?.message ||
        'The update note could not be posted.'
    };
  }
}

// Where a note toast's tap goes: the dialog on this surface while it still
// shows the app that was updated; otherwise that app's workspace (a ready
// draft waits there as a card).
export function resolveUpdateNoteToastTarget({
  mounted,
  currentBuildId,
  releasedBuildId
}: {
  mounted: boolean;
  currentBuildId: number;
  releasedBuildId: number;
}): 'dialog' | 'workspace' {
  return mounted && Number(currentBuildId) === Number(releasedBuildId)
    ? 'dialog'
    : 'workspace';
}

// What the update-note dialog body shows, as one pure rule (the view draws
// it; tests read it). "Already posted" keeps the owner's own text on screen,
// read-only so it can still be copied.
export function getUpdateNoteDialogBody({
  mode,
  enabled,
  draftStatus,
  draftMessage,
  text
}: {
  mode: 'before_publish' | 'after_publish';
  enabled: boolean | null;
  draftStatus: string;
  draftMessage: string;
  text: string;
}) {
  const alreadyPosted = draftStatus === 'already_posted';
  const writing = Boolean(enabled) && !alreadyPosted && draftStatus === 'drafting';
  const editable = Boolean(enabled) && !alreadyPosted && !writing;
  return {
    showSwitch: mode === 'before_publish',
    showAlreadyPosted: alreadyPosted,
    showWriting: writing,
    showHint:
      editable &&
      Boolean(draftMessage) &&
      (draftStatus === 'failed' || draftStatus === 'empty' || mode === 'after_publish'),
    showTextarea: editable || (alreadyPosted && Boolean(text.trim())),
    textareaReadOnly: alreadyPosted,
    showRetry: editable && draftStatus === 'failed'
  };
}

// The comment-list tag ("Update #N") reads only the marker the server wrote
// when it posted the note. N counts the app's published updates.
export function getBuildUpdateNoteNumber(comment?: { settings?: any } | null) {
  const marker = parseCommentSettings(comment?.settings)?.buildUpdateNote;
  if (!marker || typeof marker !== 'object') return null;
  const updateNumber = Number(marker.updateNumber || 0);
  return Number.isSafeInteger(updateNumber) && updateNumber > 0 ? updateNumber : 0;
}

export function formatUpdateNoteLabel(updateNumber?: number | null) {
  return updateNumber && updateNumber > 0 ? `Update #${updateNumber}` : 'Update';
}
