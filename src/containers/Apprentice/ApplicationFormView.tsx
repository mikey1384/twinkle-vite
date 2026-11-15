import React from 'react';
import { Link } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Textarea from '~/components/Texts/Textarea';
import DraftSaveIndicator from '~/components/DraftSaveIndicator';
import {
  APPRENTICE_MAX_PICKS,
  APPRENTICE_QUESTIONS,
  APPRENTICE_TEXT_MAX,
  type ApprenticeAnswers,
  type ApprenticeApplication,
  type ApprenticeResolvedPick,
  type ApprenticeTextField
} from '~/constants/apprentice';
import { timeSince } from '~/helpers/timeStampHelpers';
import {
  counterClass,
  errorClass,
  footerClass,
  formHeaderClass,
  hintClass,
  optionalClass,
  panelClass,
  pickRowClass,
  pickTypeClass,
  picksClass,
  questionClass,
  sectionTitleClass,
  statusClass
} from './styles';

// The application form, drawn from props only (ApplicationForm owns the
// loading, saving and sending). `application` is the server's canonical
// state; `answers` is what the member is typing, theirs until saved.
export default function ApplicationFormView({
  application,
  answers,
  picks,
  savingState,
  submitting,
  canSubmit,
  error,
  onChangeText,
  onRemovePick,
  onOpenPicker,
  onSubmit
}: {
  application: ApprenticeApplication;
  answers: ApprenticeAnswers;
  picks: ApprenticeResolvedPick[];
  savingState: 'idle' | 'saved';
  submitting: boolean;
  // something to send: never sent, or changed since the last version
  canSubmit: boolean;
  error: string;
  onChangeText: (field: ApprenticeTextField, text: string) => void;
  onRemovePick: (pick: ApprenticeResolvedPick) => void;
  onOpenPicker: () => void;
  onSubmit: () => void;
}) {
  const sent = application.status === 'submitted';
  return (
    <section className={panelClass}>
      <div className={formHeaderClass}>
        <div>
          <h2 className={sectionTitleClass} style={{ marginBottom: 0 }}>
            {sent ? 'Your application' : 'Apply'}
          </h2>
          <div className={statusClass}>{statusLine(application)}</div>
        </div>
        <DraftSaveIndicator savingState={savingState} />
      </div>

      <div className={questionClass} style={{ marginTop: 0 }}>
        <label>Builds and posts to show</label>
        <p className={hintClass}>
          Up to {APPRENTICE_MAX_PICKS} of your own public builds and posts.
        </p>
        {picks.length > 0 && (
          <div className={picksClass}>
            {picks.map((pick) => (
              <div key={`${pick.type}:${pick.id}`} className={pickRowClass}>
                <Icon icon={pick.type === 'build' ? 'cubes' : 'comment-alt'} />
                <Link to={pick.path}>{pick.title || 'Untitled'}</Link>
                <span className={pickTypeClass}>
                  {pick.type === 'build' ? 'Build' : 'Post'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemovePick(pick)}
                  aria-label="Remove"
                >
                  <Icon icon="times" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="soft" color="logoBlue" onClick={onOpenPicker}>
          <Icon icon="plus" />
          <span style={{ marginLeft: '0.7rem' }}>Choose builds and posts</span>
        </Button>
      </div>

      {APPRENTICE_QUESTIONS.map((question) => (
        <div key={question.field} className={questionClass}>
          <label htmlFor={`apprentice-${question.field}`}>
            {question.label}
            {question.optional && (
              <span className={optionalClass}>(optional)</span>
            )}
          </label>
          <p className={hintClass}>{question.hint}</p>
          <Textarea
            id={`apprentice-${question.field}`}
            minRows={question.rows}
            maxRows={16}
            maxLength={APPRENTICE_TEXT_MAX}
            value={answers[question.field]}
            onChange={(event) =>
              onChangeText(question.field, event.target.value)
            }
          />
          {answers[question.field].length > APPRENTICE_TEXT_MAX * 0.8 && (
            <div className={counterClass}>
              {answers[question.field].length}/{APPRENTICE_TEXT_MAX}
            </div>
          )}
        </div>
      ))}

      {error && <div className={errorClass}>{error}</div>}

      <div className={footerClass}>
        <Button
          color="logoBlue"
          loading={submitting}
          disabled={submitting || !canSubmit}
          onClick={onSubmit}
        >
          {sent ? 'Send update' : 'Send application'}
        </Button>
      </div>
    </section>
  );
}

function statusLine(application: ApprenticeApplication) {
  if (application.status === 'submitted') {
    const versions =
      application.revision > 1 ? ` · ${application.revision} versions` : '';
    const sentAt = application.lastSubmittedAt
      ? `Sent ${timeSince(application.lastSubmittedAt)}`
      : 'Sent';
    return `${sentAt}${versions}${
      application.hasUnsentChanges
        ? ' · you have changes Mikey hasn’t seen yet'
        : ''
    }`;
  }
  if (application.status === 'draft') return 'Draft, not sent yet';
  return 'Only you and Mikey will see this. Your draft saves as you write.';
}
