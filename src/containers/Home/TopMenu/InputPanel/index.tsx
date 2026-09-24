import React, { useEffect, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';
import {
  useAppContext,
  useHomeContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { isValidUrl } from '~/helpers/stringHelpers';
import { findPostLink, splitPostText } from '~/helpers/postText';
import {
  getHomeAskAssistant,
  prefillHomeAsk
} from '~/containers/App/AssistantDock/dockState';
import { setPendingPostLink } from './postFormPrefill';
import InputModal from './InputModal';
import CielButton from './CielButton';
import ZeroButton from './ZeroButton';

// JEV's reads are only acted on when it is this sure.
const SURE = 0.65;
// The form opens this long after typing stops (Enter skips the wait).
const SETTLE_MS = 700;

interface PostIntentDecision {
  question: 'discussion' | 'wants_answer';
  questionConfidence: number;
  extras: 'none' | 'attachment' | 'secret_message' | 'own_work';
  extrasConfidence: number;
}

// Home's Post Something field, strictly for content. Type or paste, and a
// moment after you stop, the familiar post form opens with what you typed in
// the right place, to carry on there: a link or YouTube video goes in the
// link field (by its URL), anything else in the subject's title (and
// description, if there is more). For a subject, JEV (a fast classifier)
// switches on what the post needs (the attachment picker, a secret answer,
// "I wrote this myself"), and a question the user wants answered also waits,
// unsent, in Zero or Ciel's ask box below. Without JEV it is just a subject.
// A post left unfinished in the form reopens it as soon as the field is
// used, to carry on from where it was left.
export default function InputPanel({
  onInputModalButtonClick
}: {
  onInputModalButtonClick: (v?: string) => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const decidePostIntent = useAppContext(
    (v) => v.requestHelpers.decidePostIntent
  );
  const inputModalShown = useHomeContext((v) => v.state.inputModalShown);
  const onSetInputModalShown = useHomeContext(
    (v) => v.actions.onSetInputModalShown
  );
  const onSetSubjectTitle = useInputContext((v) => v.actions.onSetSubjectTitle);
  const onSetSubjectDescription = useInputContext(
    (v) => v.actions.onSetSubjectDescription
  );
  const onSetSubjectDescriptionFieldShown = useInputContext(
    (v) => v.actions.onSetSubjectDescriptionFieldShown
  );
  const onSetHasSecretAnswer = useInputContext(
    (v) => v.actions.onSetHasSecretAnswer
  );
  const onSetIsMadeByUser = useInputContext((v) => v.actions.onSetIsMadeByUser);
  const onResetSubjectInput = useInputContext(
    (v) => v.actions.onResetSubjectInput
  );
  const onResetContentInput = useInputContext(
    (v) => v.actions.onResetContentInput
  );

  // A post left unfinished in the form (kept across pages): the field then
  // opens the form straight away to carry on, as it always did.
  const hasUnfinishedPost = useInputContext((v) =>
    [
      v.state.subject?.details?.title,
      v.state.subject?.details?.description,
      v.state.content?.form?.url,
      v.state.content?.form?.title
    ].some((value) => !!String(value || '').trim())
  );

  const [text, setText] = useState('');
  const textRef = useRef('');
  textRef.current = text;
  const [deciding, setDeciding] = useState(false);
  // Only the latest read of the text counts.
  const readSeq = useRef(0);

  useEffect(() => {
    const value = text.trim();
    if (!userId || value.length < 3 || inputModalShown) return;
    const timer = window.setTimeout(() => openInForm(), SETTLE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, userId, inputModalShown]);

  return (
    <ErrorBoundary componentPath="Home/Stories/TopMenu/InputPanel">
      <div
        style={{
          width: '100%',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!userId) return onOpenSigninModal();
            if (text.trim()) openInForm();
          }}
          className={css`
            flex-grow: 1;
            display: flex;
            align-items: center;
            border: 1px solid var(--ui-border);
            border-radius: ${borderRadius};
            background: #fff;
            &:focus-within {
              border-color: ${Color.logoBlue(0.6)};
              box-shadow: 0 0 0 3px ${Color.logoBlue(0.12)};
            }
          `}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onFocus={(event) => {
              if (!userId) {
                event.currentTarget.blur();
                onOpenSigninModal();
              }
            }}
            // A click or key on the field (not focus coming back when the
            // form closes) carries on an unfinished post in the form.
            onClick={(event) => resumeUnfinishedPost(event.currentTarget)}
            onKeyDown={(event) => {
              if (resumeUnfinishedPost(event.currentTarget)) {
                event.preventDefault();
              }
            }}
            placeholder="Post Something"
            aria-label="Post a subject, a link or a YouTube video"
            className={css`
              flex: 1;
              min-width: 0;
              line-height: 2rem;
              padding: 1rem;
              border: none;
              outline: none;
              background: transparent;
              font-size: 1.7rem;
              ::placeholder {
                color: ${Color.gray()};
              }
            `}
          />
          {deciding ? (
            <Icon
              icon="spinner"
              pulse
              style={{ color: Color.gray(), marginRight: '0.8rem' }}
            />
          ) : null}
          <button
            type="button"
            aria-label="All posting options"
            title="All posting options"
            onClick={() => {
              if (!userId) return onOpenSigninModal();
              openInForm({ skipRead: true });
            }}
            className={css`
              border: none;
              background: none;
              padding: 0.5rem 1rem;
              font-size: 1.6rem;
              color: ${Color.gray()};
              cursor: pointer;
              &:hover {
                color: ${Color.logoBlue()};
              }
            `}
          >
            <Icon icon="plus" />
          </button>
        </form>
        <div style={{ marginLeft: '1rem', display: 'flex' }}>
          <CielButton />
          <ZeroButton />
        </div>
        <InputModal
          isOpen={inputModalShown}
          onHide={() => onSetInputModalShown({ shown: false })}
        />
      </div>
    </ErrorBoundary>
  );

  function resumeUnfinishedPost(field: HTMLInputElement) {
    if (!userId || !hasUnfinishedPost || text || inputModalShown) return false;
    field.blur();
    onInputModalButtonClick();
    return true;
  }

  // Open the post form with what was typed in the right field.
  async function openInForm({ skipRead = false } = {}) {
    const typed = textRef.current.trim();
    const seq = ++readSeq.current;
    const link = typed ? findPostLink(typed) : null;
    if (link && isValidUrl(link.url)) {
      // Only the link section holds what was typed; the subject one starts
      // empty (anything left there from before is cleared).
      onResetSubjectInput();
      onResetContentInput();
      setPendingPostLink({ url: link.url, title: link.rest });
      return showForm();
    }
    let decision: PostIntentDecision | null = null;
    if (typed && !skipRead) {
      setDeciding(true);
      decision = await decidePostIntent(typed).catch(() => null);
      if (seq !== readSeq.current) return;
      setDeciding(false);
    }
    // Whatever was typed meanwhile comes along too.
    const value = textRef.current.trim();
    if (value) {
      // Only the subject section holds what was typed; the link one starts
      // empty (anything left there from before is cleared).
      onResetSubjectInput();
      onResetContentInput();
      const { title, description } = splitPostText(value);
      onSetSubjectTitle(title);
      onSetSubjectDescription(description);
      // As when a title is typed in the form: the description opens too.
      onSetSubjectDescriptionFieldShown(!!title);
    }
    const sure = (confidence?: number) => (confidence || 0) >= SURE;
    if (decision && sure(decision.extrasConfidence)) {
      if (decision.extras === 'secret_message') onSetHasSecretAnswer(true);
      if (decision.extras === 'own_work') onSetIsMadeByUser(true);
    }
    // A question they want answered also waits, unsent, in the ask box.
    if (
      decision?.question === 'wants_answer' &&
      sure(decision.questionConfidence) &&
      getHomeAskAssistant()
    ) {
      prefillHomeAsk(value);
    }
    showForm(
      decision?.extras === 'attachment' && sure(decision.extrasConfidence)
        ? 'file'
        : undefined,
      value ? splitPostText(value).title : ''
    );
  }

  function showForm(modalType?: string, focusTitle?: string) {
    readSeq.current += 1;
    setDeciding(false);
    setText('');
    onInputModalButtonClick(modalType);
    if (!focusTitle || modalType === 'file') return;
    // Carry on typing where the text went: the subject's title.
    window.setTimeout(() => {
      const field = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          '[aria-modal="true"] input, [aria-modal="true"] textarea'
        )
      ).find((element) => element.value === focusTitle);
      field?.focus();
      field?.setSelectionRange(field.value.length, field.value.length);
    }, 150);
  }
}
