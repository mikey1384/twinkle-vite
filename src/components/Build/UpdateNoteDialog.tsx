import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Textarea from '~/components/Texts/Textarea';
import { Link } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  formatUpdateNoteLabel,
  getUpdateNoteDialogBody,
  type BuildUpdateNoteChoice,
  type BuildUpdateNoteDraftResult
} from '~/helpers/buildUpdateNote';

// Update stays one tap (useRelease). This dialog shows:
// - before_publish: the first time an owner updates a live app (to introduce
//   the option), and after that only while their remembered "Post an update
//   note" choice is on. Lumine drafts in the dialog; the owner can edit or
//   just press Update, and the update never waits for the note.
// - after_publish: "Add an update note" on the confirmation after a one-tap
//   update. Lumine drafts a note for the version that just went live and
//   nothing posts until the owner presses Post.

export const UPDATE_NOTE_DIALOG_MAX_CHARS = 1500;

export type DraftStatus =
  | 'idle'
  | 'drafting'
  | 'ready'
  | 'empty'
  | 'failed'
  // "Add an update note" for a version that already has one
  | 'already_posted';

const bodyClass = css`
  display: grid;
  gap: 1.2rem;
  width: 100%;
  font-size: 1.5rem;
  line-height: 1.45;
  color: ${Color.darkerGray()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.4rem;
  }
`;

const switchRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--ui-border, ${Color.borderGray()});
  border-radius: 12px;
  background: ${Color.highlightGray(0.35)};
  strong {
    display: block;
    font-size: 1.55rem;
    color: ${Color.black()};
  }
  span {
    display: block;
    margin-top: 0.2rem;
    font-size: 1.25rem;
    color: ${Color.gray()};
  }
`;

const writingClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 9rem;
  padding: 0 0.4rem;
  color: ${Color.gray()};
  font-weight: 600;
`;

const hintClass = css`
  margin: 0;
  font-size: 1.3rem;
  color: ${Color.gray()};
`;

const retryClass = css`
  justify-self: start;
  padding: 0;
  border: 0;
  background: none;
  color: ${Color.logoBlue()};
  font: inherit;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

export type UpdateNoteDialogProps =
  | {
      mode: 'before_publish';
      buildId: number;
      // From the server's answer when Update was pressed.
      firstTime: boolean;
      enabled: boolean;
      onConfirm: (choice: BuildUpdateNoteChoice) => void;
      onCancel: () => void;
    }
  | {
      mode: 'after_publish';
      buildId: number;
      artifactVersionId: number;
      // A draft written before the update, waiting for review (Update was
      // pressed while Lumine was writing). Shown instead of a new draft.
      initialDraft?: { content: string; draftId: number | null };
      onClose: () => void;
    };

const DRAFT_FAILED_MESSAGE =
  "Lumine couldn't write a note this time. Write one yourself, or turn this off.";
const DRAFT_EMPTY_MESSAGE =
  "Lumine didn't find changes players would notice. Write your own note, or turn this off.";

export default function UpdateNoteDialog(props: UpdateNoteDialogProps) {
  return props.mode === 'after_publish' ? (
    <AfterPublishDialog {...props} />
  ) : (
    <BeforePublishDialog {...props} />
  );
}

function useDraft({
  buildId,
  target,
  failedMessage = DRAFT_FAILED_MESSAGE,
  emptyMessage = DRAFT_EMPTY_MESSAGE
}: {
  buildId: number;
  target?: 'live';
  failedMessage?: string;
  emptyMessage?: string;
}) {
  const requestDraft = useAppContext(
    (v) => v.requestHelpers.draftBuildUpdateNote
  );
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [draftMessage, setDraftMessage] = useState('');
  const [text, setText] = useState('');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [updateNumber, setUpdateNumber] = useState(0);
  const [existingNoteCommentId, setExistingNoteCommentId] = useState(0);
  const pendingDraftRef = useRef<Promise<BuildUpdateNoteDraftResult | null> | null>(
    null
  );
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function startDraft() {
    setDraftStatus('drafting');
    setDraftMessage('');
    const pending: Promise<BuildUpdateNoteDraftResult | null> = requestDraft(
      buildId,
      target ? { target } : undefined
    ).then(
      (result: any) => {
        const content = String(result?.draft?.content || '');
        const id = Number(result?.draft?.id || 0) || null;
        if (mountedRef.current) {
          setUpdateNumber(Number(result?.updateNumber || 0));
          if (result?.status === 'already_posted') {
            setExistingNoteCommentId(Number(result?.existingNote?.commentId || 0));
            setDraftStatus('already_posted');
          } else if (result?.status === 'ready' && content) {
            setText(content);
            setDraftId(id);
            setDraftStatus('ready');
          } else if (result?.status === 'empty') {
            setDraftId(id);
            setDraftStatus('empty');
            setDraftMessage(emptyMessage);
          } else {
            setDraftStatus('failed');
            setDraftMessage(failedMessage);
          }
        }
        return result?.status === 'ready' && content
          ? { content, draftId: id }
          : null;
      },
      (error: any) => {
        if (mountedRef.current) {
          setDraftStatus('failed');
          setDraftMessage(error?.response?.data?.error || failedMessage);
        }
        return null;
      }
    );
    pendingDraftRef.current = pending;
  }

  function seedDraft(content: string, id: number | null) {
    setText(content);
    setDraftId(id);
    setDraftStatus('ready');
  }

  function markAlreadyPosted(commentId: number) {
    setExistingNoteCommentId(commentId);
    setDraftStatus('already_posted');
  }

  return {
    draftStatus,
    draftMessage,
    text,
    setText,
    seedDraft,
    existingNoteCommentId,
    markAlreadyPosted,
    draftId,
    updateNumber,
    pendingDraftRef,
    mountedRef,
    startDraft
  };
}

function BeforePublishDialog({
  buildId,
  firstTime,
  enabled: initialEnabled,
  onConfirm,
  onCancel
}: Extract<UpdateNoteDialogProps, { mode: 'before_publish' }>) {
  const savePreference = useAppContext(
    (v) => v.requestHelpers.saveBuildUpdateNotePreference
  );
  const skipNote = useAppContext((v) => v.requestHelpers.skipBuildUpdateNote);
  // The server's answer; the switch never shows a guessed value.
  const [enabled, setEnabled] = useState(initialEnabled);
  const [toggling, setToggling] = useState(false);
  const [answered, setAnswered] = useState(!firstTime);
  const draft = useDraft({ buildId });

  useEffect(() => {
    if (enabled && draft.draftStatus === 'idle') draft.startDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <UpdateNoteDialogView
      enabled={enabled}
      stateFailed={false}
      switchDisabled={toggling}
      draftStatus={draft.draftStatus}
      draftMessage={draft.draftMessage}
      text={draft.text}
      onToggle={handleToggle}
      onTextChange={draft.setText}
      onRetry={draft.startDraft}
      onUpdate={handleUpdate}
      onCancel={handleCancel}
    />
  );

  // Closing without a note (Cancel, or Update with the switch off) closes
  // every draft this dialog started, including one still being written, so
  // none returns later as a "ready" card.
  function dismissDrafts() {
    if (draft.draftStatus === 'idle') return;
    void Promise.resolve(
      skipNote({ buildId, draftId: draft.draftId, dismissDialogDrafts: true })
    ).catch(() => {});
  }

  function handleCancel() {
    dismissDrafts();
    onCancel();
  }

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try {
      const result = await savePreference({ buildId, enabled: !enabled });
      if (draft.mountedRef.current) {
        setEnabled(Boolean(result?.enabled));
        setAnswered(true);
      }
    } catch {
      // The switch keeps the server's last answer.
    } finally {
      if (draft.mountedRef.current) setToggling(false);
    }
  }

  function handleUpdate() {
    // The first time, Update with the switch left off is the owner's answer:
    // from now on their updates are one tap. Cancel answers nothing.
    if (!answered && !enabled) {
      // Only if no choice exists yet: never overwrite one another tab saved.
      void Promise.resolve(
        savePreference({ buildId, enabled: false, onlyIfUnset: true })
      ).catch(() => {});
    }
    if (!enabled) dismissDrafts();
    onConfirm({
      dialogShown: true,
      post: enabled,
      content: enabled ? draft.text : '',
      draftId: draft.draftId,
      pendingDraft:
        enabled && draft.draftStatus === 'drafting'
          ? draft.pendingDraftRef.current
          : null
    });
  }
}

function AfterPublishDialog({
  buildId,
  artifactVersionId,
  initialDraft,
  onClose
}: Extract<UpdateNoteDialogProps, { mode: 'after_publish' }>) {
  const loadState = useAppContext(
    (v) => v.requestHelpers.loadBuildUpdateNoteState
  );
  const postNote = useAppContext((v) => v.requestHelpers.postBuildUpdateNote);
  const skipNote = useAppContext((v) => v.requestHelpers.skipBuildUpdateNote);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [updateNumber, setUpdateNumber] = useState(0);
  const draft = useDraft({
    buildId,
    target: 'live',
    failedMessage: "Lumine couldn't write a note this time. Write one yourself.",
    emptyMessage:
      "Lumine didn't find changes players would notice. Write your own note."
  });

  useEffect(() => {
    void Promise.resolve(loadState(buildId, initialDraft ? undefined : 'link'))
      .then((state: any) => {
        if (
          draft.mountedRef.current &&
          Number(state?.publishedVersion?.artifactVersionId) === artifactVersionId
        ) {
          setUpdateNumber(Number(state?.publishedVersion?.updateNumber || 0));
        }
      })
      .catch(() => {});
    if (initialDraft?.content) {
      draft.seedDraft(initialDraft.content, initialDraft.draftId);
    } else {
      draft.startDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, artifactVersionId]);

  return (
    <UpdateNoteDialogView
      mode="after_publish"
      title={`Add an update note · ${formatUpdateNoteLabel(updateNumber || draft.updateNumber)}`}
      enabled
      stateFailed={false}
      switchDisabled
      draftStatus={draft.draftStatus}
      draftMessage={postError || draft.draftMessage}
      text={draft.text}
      primaryLabel="Post"
      existingNoteCommentId={
        draft.draftStatus === 'already_posted' ? draft.existingNoteCommentId : 0
      }
      primaryDisabled={
        posting || !draft.text.trim() || draft.draftStatus === 'already_posted'
      }
      primaryLoading={posting}
      onToggle={() => {}}
      onTextChange={draft.setText}
      onRetry={draft.startDraft}
      onUpdate={handlePost}
      onCancel={handleCancel}
    />
  );

  // Declined: this draft (even one still being written) must not come back
  // as a "ready" card later.
  function handleCancel() {
    if (draft.draftStatus !== 'already_posted') {
      void Promise.resolve(
        skipNote({ buildId, draftId: draft.draftId, dismissDialogDrafts: true })
      ).catch(() => {});
    }
    onClose();
  }

  async function handlePost() {
    const content = draft.text.trim();
    if (!content || posting) return;
    setPosting(true);
    setPostError('');
    try {
      const result = await postNote({
        buildId,
        artifactVersionId,
        content,
        draftId: draft.draftId,
        source: initialDraft ? 'dialog' : 'link'
      });
      if (result?.alreadyPosted) {
        // Someone (another tab, the chat) posted first: say so and keep the
        // owner's text on screen instead of closing as if it were posted.
        if (draft.mountedRef.current) {
          draft.markAlreadyPosted(Number(result?.commentId || 0));
        }
        return;
      }
      onClose();
    } catch (error: any) {
      if (draft.mountedRef.current) {
        setPostError(
          error?.response?.data?.error ||
            'The note could not be posted. Try again.'
        );
      }
    } finally {
      if (draft.mountedRef.current) setPosting(false);
    }
  }
}

// The dialog as drawn, from explicit state (the containers above own the
// requests). Kept separate so the preview renders the real markup.
export function UpdateNoteDialogView({
  mode = 'before_publish',
  title = 'Update your published game',
  enabled,
  stateFailed,
  switchDisabled,
  draftStatus,
  draftMessage,
  text,
  primaryLabel = 'Update',
  primaryDisabled = false,
  primaryLoading = false,
  existingNoteCommentId = 0,
  onToggle,
  onTextChange,
  onRetry,
  onUpdate,
  onCancel
}: {
  mode?: 'before_publish' | 'after_publish';
  title?: string;
  enabled: boolean | null;
  stateFailed: boolean;
  switchDisabled: boolean;
  draftStatus: DraftStatus;
  draftMessage: string;
  text: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  existingNoteCommentId?: number;
  onToggle: () => void;
  onTextChange: (text: string) => void;
  onRetry: () => void;
  onUpdate: () => void;
  onCancel: () => void;
}) {
  const body = getUpdateNoteDialogBody({
    mode,
    enabled,
    draftStatus,
    draftMessage,
    text
  });
  return (
    <Modal
      modalKey="UpdateNoteDialog"
      isOpen
      onClose={onCancel}
      title={title}
      size="md"
      hasHeader
      closeOnBackdropClick
      footer={
        <>
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            color="logoBlue"
            disabled={primaryDisabled}
            loading={primaryLoading}
            onClick={onUpdate}
          >
            {primaryLabel}
          </Button>
        </>
      }
    >
      <div className={bodyClass}>
        {body.showSwitch ? (
          <div className={switchRowClass}>
            <div>
              <strong>Post an update note</strong>
              <span>
                {stateFailed
                  ? "Couldn't load this right now. You can still update."
                  : 'Lumine writes what changed. It posts as your comment.'}
              </span>
            </div>
            <SwitchButton
              ariaLabel="Post an update note"
              checked={Boolean(enabled)}
              disabled={switchDisabled || stateFailed}
              onChange={onToggle}
            />
          </div>
        ) : null}
        {body.showAlreadyPosted ? (
          <p className={hintClass}>
            This update already has a note.{' '}
            {existingNoteCommentId ? (
              <Link to={`/comments/${existingNoteCommentId}`} onClick={onCancel}>
                See it
              </Link>
            ) : null}
          </p>
        ) : null}
        {body.showWriting ? (
          <div className={writingClass} role="status">
            <Icon icon="spinner" pulse />
            <span>Lumine is writing a note…</span>
          </div>
        ) : null}
        {body.showHint ? <p className={hintClass}>{draftMessage}</p> : null}
        {body.showTextarea ? (
          <Textarea
            aria-label="Update note"
            value={text}
            readOnly={body.textareaReadOnly}
            minRows={3}
            maxRows={8}
            maxLength={UPDATE_NOTE_DIALOG_MAX_CHARS}
            placeholder="What's new in this update?"
            onChange={(event) => onTextChange(event.target.value)}
          />
        ) : null}
        {body.showRetry ? (
          <button type="button" className={retryClass} onClick={onRetry}>
            Ask Lumine again
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
