import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Input from '~/components/Texts/Input';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import { QuestNote } from '~/containers/BridgeBuilderQuest/StepCard';
import ClassCard from './ClassCard';
import {
  CLASS_HELP_PATH,
  leadClass,
  pageClass,
  pageTitleClass,
  panelClass,
  type ClassAsk,
  type Classroom
} from './shared';

// My classes (/my-classes), for approved teachers: make a class, show its
// code (QR, board code, link), watch the roster, hand out a reset code.
// Optional: the usual sign-up is untouched.
export default function Classrooms() {
  const userId = useKeyContext((v) => v.myState.userId);
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const loadMyClassrooms = useAppContext(
    (v) => v.requestHelpers.loadMyClassrooms
  );
  const createClassroom = useAppContext(
    (v) => v.requestHelpers.createClassroom
  );
  const [state, setState] = useState<{
    classes: Classroom[];
    branchName: string;
    seatCap: number;
    codeDays: number;
    classNameSuggestions: string[];
    asks?: ClassAsk[];
  } | null>(null);
  // opened from Ciel's message or the notification (?ask=<id>)
  const [searchParams] = useSearchParams();
  const askParam = Number(searchParams.get('ask')) || 0;
  const answerClassAsk = useAppContext((v) => v.requestHelpers.answerClassAsk);
  const [answering, setAnswering] = useState('');
  const [askError, setAskError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [className, setClassName] = useState('');
  const [creating, setCreating] = useState(false);
  // Enter and the button can both submit: one request only
  const creatingRef = useRef(false);
  const [createError, setCreateError] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionLoaded || !userId) return;
    refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoaded, userId]);

  // a pass can only be sent for a class whose code is on
  const liveClasses = (state?.classes || []).filter(
    (classroom) => classroom.code.state === 'live'
  );

  return (
    <ErrorBoundary componentPath="Classrooms/index">
      <main className={pageClass} data-welcome-tour="my_classes">
        <header className={headerClass}>
          <h1 className={pageTitleClass}>My classes</h1>
          <Link
            to={`${CLASS_HELP_PATH}?from=classes`}
            className={helpLinkClass}
          >
            How it works ›
          </Link>
        </header>
        {!sessionLoaded ? (
          <Loading />
        ) : !userId ? (
          <section className={panelClass}>
            <p className={leadClass}>Log in to see your classes.</p>
            <Button
              color="logoBlue"
              style={{ marginTop: '1rem' }}
              onClick={() => onOpenSigninModal()}
            >
              Log in
            </Button>
          </section>
        ) : loadError ? (
          <QuestNote tone="info">{loadError}</QuestNote>
        ) : !state ? (
          <Loading />
        ) : (
          <>
            {!!state.asks?.length && (
              <section className={panelClass}>
                <b className={askTitleClass}>Asking you for an account</b>
                <p className={askNoteClass}>
                  Anyone can type a name, so only say yes if you know who this
                  is. A yes gives them a pass for one account in your class.
                </p>
                {state.asks.map((ask) => (
                  <div key={ask.id} className={askRowClass}>
                    <div className={askWhoClass}>
                      <b>{ask.firstName}</b>
                      {ask.note ? <span>“{ask.note}”</span> : null}
                    </div>
                    <div className={askButtonsClass}>
                      {liveClasses.map((classroom) => (
                        <Button
                          key={classroom.id}
                          color="logoBlue"
                          size="sm"
                          uppercase={false}
                          loading={answering === `${ask.id}:${classroom.id}`}
                          disabled={!!answering}
                          onClick={() => handleAnswer(ask.id, classroom.id)}
                        >
                          {liveClasses.length === 1
                            ? 'Send them my class code'
                            : `Send: ${classroom.className}`}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        color="darkerGray"
                        size="sm"
                        uppercase={false}
                        loading={answering === `${ask.id}:0`}
                        disabled={!!answering}
                        onClick={() => handleAnswer(ask.id, 0)}
                      >
                        Not someone I know
                      </Button>
                    </div>
                  </div>
                ))}
                {!liveClasses.length && (
                  <p className={askNoteClass}>
                    Make a class below (or turn a class’s code on) first, then
                    send it.
                  </p>
                )}
                {askError && <QuestNote tone="warning">{askError}</QuestNote>}
              </section>
            )}
            <section className={panelClass}>
              <p className={leadClass}>
                Make a class and show its code. Students scan it or type it and
                join with a username, a password and their first name. No email
                needed.
              </p>
              <form className={formClass} onSubmit={handleCreate}>
                <Input
                  value={className}
                  maxLength={40}
                  placeholder="Class name (for example Lions 3)"
                  list="class-name-suggestions"
                  onChange={(text: string) => {
                    setCreateError('');
                    setClassName(text);
                  }}
                />
                <datalist id="class-name-suggestions">
                  {state.classNameSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <Button
                  color="logoBlue"
                  loading={creating}
                  disabled={!className.trim()}
                  onClick={handleCreate}
                >
                  Make class
                </Button>
              </form>
              {state.branchName && (
                <p className={branchClass}>Branch: {state.branchName}</p>
              )}
              {createError && (
                <QuestNote tone="warning">{createError}</QuestNote>
              )}
            </section>
            {state.classes.map((classroom) => (
              <ClassCard
                key={classroom.id}
                classroom={classroom}
                open={openId === classroom.id}
                onToggle={() =>
                  setOpenId((id) => (id === classroom.id ? null : classroom.id))
                }
                onRemoved={() => refresh(false)}
              />
            ))}
          </>
        )}
      </main>
    </ErrorBoundary>
  );

  // the teacher's answer; the list shown is the server's answer to it
  async function handleAnswer(askId: number, classroomId: number) {
    setAnswering(`${askId}:${classroomId}`);
    setAskError('');
    try {
      const { asks } = await answerClassAsk({ askId, classroomId });
      setState((current) => (current ? { ...current, asks } : current));
    } catch (err) {
      setAskError(getErrorMessage(err, 'That didn’t work. Please try again.'));
    } finally {
      setAnswering('');
    }
  }

  async function refresh(openFirst: boolean) {
    try {
      const data = await loadMyClassrooms(askParam || undefined);
      setState(data);
      setLoadError('');
      if (openFirst && data.classes?.length === 1) {
        setOpenId(data.classes[0].id);
      }
    } catch (err) {
      setLoadError(
        getErrorMessage(err, 'Your classes could not be loaded. Try again.')
      );
    }
  }

  async function handleCreate(event?: React.SyntheticEvent) {
    event?.preventDefault();
    const name = className.trim();
    if (!name || creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    setCreateError('');
    try {
      const { classroom } = await createClassroom(name);
      setClassName('');
      await refresh(false);
      setOpenId(classroom.id);
    } catch (err) {
      setCreateError(
        getErrorMessage(err, 'The class could not be made. Try again.')
      );
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }
}

const askTitleClass = css`
  display: block;
  font-size: 1.7rem;
  color: ${Color.black()};
`;
const askNoteClass = css`
  margin: 0.4rem 0 0;
  font-size: 1.3rem;
  line-height: 1.5;
  color: ${Color.darkGray()};
`;
const askRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.2rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--ui-border);
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;
const askWhoClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 1.6rem;
  color: ${Color.black()};
  overflow-wrap: anywhere;
  span {
    font-size: 1.4rem;
    color: ${Color.darkerGray()};
  }
`;
const askButtonsClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  flex-shrink: 0;
`;
const headerClass = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem 1.2rem 0;
  }
`;
const helpLinkClass = css`
  font-size: 1.4rem;
  font-weight: 700;
  white-space: nowrap;
`;
const formClass = css`
  display: flex;
  gap: 0.8rem;
  margin-top: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
  }
`;
const branchClass = css`
  margin: 0.8rem 0 0;
  font-size: 1.3rem;
  opacity: 0.75;
`;
