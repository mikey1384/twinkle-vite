import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import {
  apprenticeMissing,
  APPRENTICE_QUESTIONS,
  emptyApprenticeAnswers,
  type ApprenticeAnswers,
  type ApprenticeApplication,
  type ApprenticeResolvedPick,
  type ApprenticeTextField
} from '~/constants/apprentice';
import ApplicationFormView from './ApplicationFormView';
import Confirmation from './Confirmation';
import PicksModal from './PicksModal';
import { panelClass, sectionTitleClass, statusClass } from './styles';

const AUTOSAVE_MS = 1200;

// The member's application: loads their canonical copy, saves the draft as
// they write (the indicator shows only what the server confirmed), sends it
// or an update, then shows the confirmation. What they type stays theirs
// until a save answers; server state (status, versions, unsent changes)
// always comes from the server's response.
export default function ApplicationForm() {
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const loadApprenticeApplication = useAppContext(
    (v) => v.requestHelpers.loadApprenticeApplication
  );
  const saveApprenticeDraft = useAppContext(
    (v) => v.requestHelpers.saveApprenticeDraft
  );
  const submitApprenticeApplication = useAppContext(
    (v) => v.requestHelpers.submitApprenticeApplication
  );
  const recordApprenticeEvent = useAppContext(
    (v) => v.requestHelpers.recordApprenticeEvent
  );
  const [application, setApplication] =
    useState<ApprenticeApplication | null>(null);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<ApprenticeAnswers>(
    emptyApprenticeAnswers
  );
  const [picks, setPicks] = useState<ApprenticeResolvedPick[]>([]);
  const [savingState, setSavingState] = useState<'idle' | 'saved'>('idle');
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  const [pickerShown, setPickerShown] = useState(false);
  const [confirmedRevision, setConfirmedRevision] = useState(0);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // a save that started before newer typing must not mark the newer text saved
  const editGenerationRef = useRef(0);
  // the save in flight, so a send waits for it instead of racing it
  const savePromiseRef = useRef<Promise<void> | null>(null);
  // the version the form was last loaded or saved against
  const revisionRef = useRef(0);

  useEffect(() => {
    // another member signed in on this device: drop everything the last one
    // typed at once, and any save still waiting, so it can never show or be
    // saved into this member's draft
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    editGenerationRef.current += 1;
    savePromiseRef.current = null;
    revisionRef.current = 0;
    setApplication(null);
    setAnswers(emptyApprenticeAnswers());
    setPicks([]);
    setOpen(false);
    setDirty(false);
    setSavingState('idle');
    setError('');
    setConfirmedRevision(0);
    setPickerShown(false);
    if (!userId) return;
    let canceled = false;
    setLoadError('');
    loadApprenticeApplication()
      .then((data: ApprenticeApplication) => {
        if (canceled) return;
        applyCanonical(data, true);
        if (data.status !== 'none') setOpen(true);
      })
      .catch((err: unknown) => {
        if (!canceled) setLoadError(getErrorMessage(err));
      });
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  const applyCanonical = useCallback(
    (data: ApprenticeApplication, replaceAnswers: boolean) => {
      setApplication(data);
      revisionRef.current = Number(data?.revision || 0);
      if (replaceAnswers) {
        setAnswers({ ...emptyApprenticeAnswers(), ...data.answers });
        setPicks(data.picks || []);
      }
    },
    []
  );

  if (!userId) {
    return (
      <section className={panelClass}>
        <h2 className={sectionTitleClass}>Apply</h2>
        <p className={statusClass} style={{ fontSize: '1.5rem' }}>
          Sign in to start your application. Only you and Mikey will see it.
        </p>
        <Button
          color="logoBlue"
          style={{ marginTop: '1.2rem' }}
          onClick={() => onOpenSigninModal()}
        >
          Sign in to apply
        </Button>
      </section>
    );
  }
  if (loadError) {
    return (
      <section className={panelClass}>
        <h2 className={sectionTitleClass}>Apply</h2>
        <p className={statusClass}>{loadError}</p>
      </section>
    );
  }
  if (!application) {
    return (
      <section className={panelClass}>
        <Loading />
      </section>
    );
  }
  if (confirmedRevision) {
    return (
      <div ref={confirmationRef} style={{ scrollMarginTop: '7rem' }}>
        <Confirmation
          revision={confirmedRevision}
          onKeepEditing={() => setConfirmedRevision(0)}
        />
      </div>
    );
  }
  if (!open) {
    return (
      <section className={panelClass}>
        <h2 className={sectionTitleClass}>Apply</h2>
        <p style={{ margin: '0 0 1.4rem' }}>
          Tell Mikey about what you have built, a time you just did
          something, how you use AI and what you would improve about Twinkle.
          Take your time: your draft saves as you write, and you can update
          it whenever you like.
        </p>
        <Button
          color="logoBlue"
          onClick={() => {
            setOpen(true);
            recordApprenticeEvent('form_opened');
          }}
        >
          Start my application
        </Button>
      </section>
    );
  }

  return (
    <>
      <ApplicationFormView
        application={application}
        answers={answers}
        picks={picks}
        savingState={savingState}
        submitting={submitting}
        canSubmit={
          application.status !== 'submitted' ||
          application.hasUnsentChanges ||
          dirty
        }
        error={error}
        onChangeText={handleChangeText}
        onRemovePick={(pick) =>
          handlePicks(
            picks.filter(
              (item) => !(item.type === pick.type && item.id === pick.id)
            )
          )
        }
        onOpenPicker={() => setPickerShown(true)}
        onSubmit={handleSubmit}
      />
      {pickerShown && (
        <PicksModal
          initialPicks={picks}
          onHide={() => setPickerShown(false)}
          onDone={(next) => {
            setPickerShown(false);
            handlePicks(next);
          }}
        />
      )}
    </>
  );

  function handleChangeText(field: ApprenticeTextField, text: string) {
    setError('');
    setAnswers((current) => ({ ...current, [field]: text }));
    scheduleSave();
  }

  function handlePicks(next: ApprenticeResolvedPick[]) {
    setError('');
    setPicks(next);
    setAnswers((current) => ({
      ...current,
      picks: next.map(({ type, id }) => ({ type, id }))
    }));
    scheduleSave();
  }

  function scheduleSave() {
    editGenerationRef.current += 1;
    setDirty(true);
    setSavingState('idle');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveNow, AUTOSAVE_MS);
  }

  function saveNow() {
    const saving = runSave().finally(() => {
      if (savePromiseRef.current === saving) savePromiseRef.current = null;
    });
    savePromiseRef.current = saving;
    return saving;
  }

  async function runSave(retried = false): Promise<void> {
    saveTimerRef.current = null;
    const generation = editGenerationRef.current;
    const ownerId = userId;
    try {
      const data: ApprenticeApplication & { ignored?: boolean } =
        await saveApprenticeDraft(answersRef.current, revisionRef.current);
      if (ownerId !== userIdRef.current) return;
      // newer typing since: keep it, it saves on its own timer
      if (generation !== editGenerationRef.current) return;
      if (data.ignored) {
        // a newer version was sent (another tab or device) since this text
        // was written against: nothing was stored, so never show "saved";
        // save again against the current version
        revisionRef.current = Number(data.revision || 0);
        setApplication(data);
        if (!retried) return runSave(true);
        setError('Your draft could not be saved. Please try again.');
        return;
      }
      applyCanonical(data, false);
      setPicks(data.picks || []);
      setDirty(false);
      setSavingState('saved');
      setTimeout(() => setSavingState('idle'), 1500);
    } catch (err) {
      if (generation === editGenerationRef.current) {
        setError(`Your draft could not be saved: ${getErrorMessage(err)}`);
      }
    }
  }

  async function handleSubmit() {
    if (submittingRef.current) return;
    const missing = apprenticeMissing(answersRef.current);
    if (missing.length) {
      const labels = APPRENTICE_QUESTIONS.filter((question) =>
        missing.includes(question.field)
      ).map((question) => `“${question.label}”`);
      setError(`Please answer ${labels.join(', ')} before sending.`);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    editGenerationRef.current += 1;
    // a save already on its way finishes first (the server also ignores a
    // draft written against an older version than the one sent)
    if (savePromiseRef.current) await savePromiseRef.current.catch(() => {});
    try {
      const data: ApprenticeApplication = await submitApprenticeApplication(
        answersRef.current
      );
      applyCanonical(data, true);
      setDirty(false);
      if (data.unchanged) {
        setError('Nothing has changed since the version Mikey has.');
      } else {
        setConfirmedRevision(data.revision);
        // the confirmation takes the long form's place: bring it into view
        requestAnimationFrame(() =>
          confirmationRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
}
