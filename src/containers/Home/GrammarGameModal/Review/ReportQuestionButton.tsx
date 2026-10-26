import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { useAppContext } from '~/contexts';
import { useGamePortalTarget } from '../gamePortal';
import { PARCHMENT, button } from '../Quest/pixelUi';

export interface QuestionReportTarget {
  questionId: number;
  questionVersion?: number;
  runId: number;
  position: number;
  questionText?: string;
}

export default function ReportQuestionButton({
  target,
  portalTarget,
  quest = false
}: {
  target: QuestionReportTarget;
  portalTarget?: HTMLElement;
  quest?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {quest ? (
        <button className={reportButtonCls} onClick={() => setOpen(true)}>
          Report to Mikey
        </button>
      ) : (
        <GameCTAButton
          arcade
          variant="neutral"
          size="sm"
          onClick={() => setOpen(true)}
        >
          Report to Mikey
        </GameCTAButton>
      )}
      {open && (
        <QuestionReportModal
          target={target}
          portalTarget={portalTarget}
          onHide={() => setOpen(false)}
        />
      )}
    </>
  );
}

function QuestionReportModal({
  target,
  portalTarget,
  onHide
}: {
  target: QuestionReportTarget;
  portalTarget?: HTMLElement;
  onHide: () => void;
}) {
  const reportQuestion = useAppContext(
    (v) => v.requestHelpers.reportGrammarQuestion
  );
  const pageTarget = useGamePortalTarget();
  const noteId = useId();
  const busy = useRef(false);
  const doneButton = useRef<HTMLButtonElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const close = () => {
    if (!busy.current) onHide();
  };
  useEffect(() => {
    if (sent) doneButton.current?.focus({ preventScroll: true });
  }, [sent]);
  useEffect(() => {
    if (error) errorMessage.current?.scrollIntoView({ block: 'nearest' });
  }, [error]);

  return (
    <Modal
      modalKey="GrammarQuestionReport"
      isOpen
      portalTarget={portalTarget || pageTarget}
      onClose={close}
      hasHeader
      title={sent ? 'Report sent' : 'Report to Mikey'}
      aria-label={sent ? 'Report sent' : 'Report to Mikey'}
      size="sm"
      closeOnBackdropClick={!submitting}
      footer={
        sent ? (
          <Button buttonRef={doneButton} color="blue" onClick={close}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" disabled={submitting} onClick={close}>
              Cancel
            </Button>
            <Button
              color="blue"
              loading={submitting}
              disabled={!note.trim() || submitting}
              onClick={handleSubmit}
            >
              Send report
            </Button>
          </>
        )
      }
    >
      <div className={bodyCls}>
        {sent ? (
          <p role="status">
            Thanks. Your question report has been saved for Mikey to review.
          </p>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <p>
              The question and your answer details will be attached
              automatically.
            </p>
            <p>
              <b>Question ID: {target.questionId}</b>
            </p>
            {target.questionText && (
              <blockquote>{target.questionText}</blockquote>
            )}
            <label htmlFor={noteId}>What seems wrong?</label>
            <textarea
              id={noteId}
              value={note}
              rows={4}
              maxLength={500}
              disabled={submitting}
              placeholder="Tell Mikey what needs another look."
              onChange={(event) => setNote(event.target.value)}
            />
            <p className="hint">
              This sends a report to Mikey. It does not use AI Energy or change
              your score.
            </p>
            {error && (
              <p ref={errorMessage} role="alert" className="error">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </Modal>
  );

  async function handleSubmit() {
    if (!note.trim() || busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setError('');
    try {
      const result = await reportQuestion({
        questionId: target.questionId,
        questionVersion: target.questionVersion,
        runId: target.runId,
        position: target.position,
        note: note.trim()
      });
      if (!(result?.reportId > 0))
        throw new Error('The report was not confirmed. Please try again.');
      setSent(true);
    } catch (err: any) {
      setError(
        err?.message && err.status !== 500
          ? err.message
          : 'The report couldn’t be sent. Please try again.'
      );
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }
}

const reportButtonCls = css`
  ${button(PARCHMENT, PARCHMENT.s)}
  min-height: 44px;
  padding: 0.5rem 1rem;
  font-size: 1.2rem;
`;
const bodyCls = css`
  font-size: 1.5rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
  p {
    margin: 0 0 1rem;
  }
  blockquote {
    margin: 0 0 1rem;
    padding: 0.8rem;
    background: #f1f5f9;
  }
  label {
    display: block;
    font-weight: 700;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    font: inherit;
    padding: 0.8rem;
    resize: vertical;
  }
  .hint {
    margin-top: 1rem;
    color: #526171;
    font-size: 1.2rem;
  }
  .error {
    color: #b42318;
    font-weight: 700;
  }
`;
