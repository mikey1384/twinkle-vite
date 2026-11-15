import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import ModalFooter from '~/components/Modal/Footer';
import ProfilePic from '~/components/ProfilePic';
import Input from '~/components/Texts/Input';
import { useAppContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import {
  clearClassAsk,
  getClassAsk,
  storeClassAsk,
  type StoredClassAsk
} from './shared';

interface Teacher {
  userId: number;
  username: string;
  profilePicUrl: string | null;
}

const NOTE_MAX = 140;
const NAME_MAX = 30;
const POLL_MS = 6000;

// "Ask my teacher for an account" in sign-up (Mikey 11-15). Someone with no
// account finds their Twinkle teacher by username or name and asks. The
// teacher hears from Ciel and answers on My classes. Their yes gives THIS
// browser a pass for one account in their class: the waiting screen turns
// into a Join button. A class code is never sent here (it works for a whole
// class and could be passed on); if the teacher doesn't answer, the student
// gets the code from them in class.
export default function AskTeacher({
  onBack,
  onUseClassCode
}: {
  onBack: () => void;
  onUseClassCode: () => void;
}) {
  const navigate = useNavigate();
  const onCloseSigninModal = useAppContext(
    (v) => v.user.actions.onCloseSigninModal
  );
  const searchTeachersForAsk = useAppContext(
    (v) => v.requestHelpers.searchTeachersForAsk
  );
  const sendClassAsk = useAppContext((v) => v.requestHelpers.sendClassAsk);
  const loadClassAskStatus = useAppContext(
    (v) => v.requestHelpers.loadClassAskStatus
  );
  const recordClassroomEvent = useAppContext(
    (v) => v.requestHelpers.recordClassroomEvent
  );
  const [stored, setStored] = useState<StoredClassAsk | null>(() =>
    getClassAsk()
  );
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [firstName, setFirstName] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState<{
    state: 'waiting' | 'ready' | 'in_class' | 'gone';
    joinKey?: string;
  }>({ state: 'waiting' });
  const searchRef = useRef(0);

  useEffect(() => {
    recordClassroomEvent({ kind: 'ask_open' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the teacher list follows the typing, a moment behind
  useEffect(() => {
    const text = searchText.trim();
    if (teacher || text.length < 2) {
      setTeachers(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const run = ++searchRef.current;
    const timer = window.setTimeout(async () => {
      try {
        const found = await searchTeachersForAsk(text);
        if (run !== searchRef.current) return;
        setTeachers(found);
        setError('');
      } catch (err) {
        if (run !== searchRef.current) return;
        setTeachers(null);
        setError(getErrorMessage(err, 'The search didn’t work. Try again.'));
      } finally {
        if (run === searchRef.current) setSearching(false);
      }
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, teacher]);

  // while waiting, ask now and then whether the teacher has answered
  useEffect(() => {
    if (!stored) return;
    let stopped = false;
    let timer = 0;
    check();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
    async function check() {
      if (!document.hidden) {
        const status = await loadClassAskStatus({
          askId: stored!.askId,
          secret: stored!.secret
        });
        if (stopped) return;
        setAnswer(status);
        if (status.state === 'gone') clearClassAsk();
        if (status.state !== 'waiting') return;
      }
      timer = window.setTimeout(check, POLL_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored?.askId]);

  if (stored) {
    const teacherName = stored.teacherName;
    return (
      <div className={columnClass}>
        {answer.state === 'ready' ? (
          <>
            <h2 className={headingClass}>{teacherName} said yes!</h2>
            <p className={leadClass}>
              Choose a username and a password, and you’re in.
            </p>
          </>
        ) : answer.state === 'waiting' ? (
          <>
            <Loading style={{ height: '6rem' }} />
            <h2 className={headingClass}>{teacherName} has been asked</h2>
            <p className={leadClass}>
              When your teacher says yes, a Join button shows up here. You can
              close this and come back later.
            </p>
            <p className={quietClass}>
              In class right now? Your teacher can show you the class code
              instead.
            </p>
          </>
        ) : (
          <>
            <h2 className={headingClass}>
              Get the class code from your teacher
            </h2>
            <p className={leadClass}>
              Ask {teacherName || 'your teacher'} to show the class code in
              class, then type it in.
            </p>
          </>
        )}
        <Footer onBack={onBack}>
          {answer.state === 'waiting' && (
            <Button
              variant="ghost"
              color="darkerGray"
              onClick={handleAskSomeoneElse}
            >
              Ask someone else
            </Button>
          )}
          {answer.state === 'ready' ? (
            <Button color="green" onClick={handleJoin}>
              Join {teacherName}’s class
            </Button>
          ) : (
            <Button color="logoBlue" variant="soft" onClick={onUseClassCode}>
              I have a class code
            </Button>
          )}
        </Footer>
      </div>
    );
  }

  if (teacher) {
    const ready = !!firstName.trim();
    return (
      <div className={columnClass}>
        <div className={pickedClass}>
          <ProfilePic
            userId={teacher.userId}
            profilePicUrl={teacher.profilePicUrl || ''}
            size="4.6rem"
          />
          <b>{teacher.username}</b>
          <Button
            variant="ghost"
            color="darkerGray"
            size="sm"
            onClick={() => {
              setTeacher(null);
              setError('');
            }}
          >
            Change
          </Button>
        </div>
        <label className={labelClass} htmlFor="ask-first-name">
          Your first name
        </label>
        <Input
          id="ask-first-name"
          autoFocus
          value={firstName}
          maxLength={NAME_MAX}
          placeholder="First name"
          onChange={(text: string) => {
            setError('');
            setFirstName(text);
          }}
        />
        <label className={labelClass} htmlFor="ask-note">
          A short note for your teacher (you can skip this)
        </label>
        <Input
          id="ask-note"
          value={note}
          maxLength={NOTE_MAX}
          placeholder="For example: I’m in Lions 3"
          onChange={(text: string) => setNote(text)}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key === 'Enter' && ready) handleSend();
          }}
        />
        <p className={quietClass}>
          {teacher.username} will see your first name and your note.
        </p>
        {error && <p className={errorClass}>{error}</p>}
        <Footer onBack={onBack}>
          <Button
            color="logoBlue"
            loading={sending}
            disabled={!ready}
            onClick={handleSend}
          >
            Ask {teacher.username}
          </Button>
        </Footer>
      </div>
    );
  }

  return (
    <div className={columnClass}>
      <h2 className={headingClass}>Who is your Twinkle teacher?</h2>
      <Input
        autoFocus
        value={searchText}
        maxLength={40}
        placeholder="Your teacher’s username or name"
        onChange={(text: string) => setSearchText(text)}
      />
      <div className={resultsClass}>
        {searching && !teachers ? (
          <Loading style={{ height: '6rem' }} />
        ) : teachers?.length ? (
          teachers.map((found) => (
            <Button
              key={found.userId}
              variant="soft"
              color="logoBlue"
              stretch
              uppercase={false}
              onClick={() => setTeacher(found)}
            >
              <span className={rowClass}>
                <ProfilePic
                  userId={found.userId}
                  profilePicUrl={found.profilePicUrl || ''}
                  size="3.6rem"
                />
                <b>{found.username}</b>
                <Icon icon="chevron-right" style={{ marginLeft: 'auto' }} />
              </span>
            </Button>
          ))
        ) : teachers ? (
          <p className={quietClass}>
            No teacher found. Check the spelling, or get a class code from your
            teacher.
          </p>
        ) : (
          <p className={quietClass}>
            Type at least 2 letters. Only Twinkle teachers show up here.
          </p>
        )}
      </div>
      {error && <p className={errorClass}>{error}</p>}
      <Footer onBack={onBack} />
    </div>
  );

  async function handleSend() {
    if (!teacher || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await sendClassAsk({
        teacherId: teacher.userId,
        firstName: firstName.trim(),
        note: note.trim()
      });
      const ask = {
        askId: sent.askId,
        secret: sent.secret,
        teacherName: sent.teacherName || teacher.username,
        expiresAt: sent.expiresAt
      };
      storeClassAsk(ask);
      setAnswer({ state: 'waiting' });
      setStored(ask);
    } catch (err) {
      setError(getErrorMessage(err, 'That didn’t work. Please try again.'));
    } finally {
      setSending(false);
    }
  }

  function handleJoin() {
    if (!answer.joinKey) return;
    onCloseSigninModal();
    navigate(`/join/${answer.joinKey}`);
  }

  function handleAskSomeoneElse() {
    clearClassAsk();
    setStored(null);
    setTeacher(null);
    setSearchText('');
  }
}

function Footer({
  onBack,
  children
}: {
  onBack: () => void;
  children?: React.ReactNode;
}) {
  return (
    <ModalFooter>
      <Button
        variant="ghost"
        color="darkerGray"
        style={{ marginRight: 'auto' }}
        onClick={onBack}
      >
        Back
      </Button>
      {children}
    </ModalFooter>
  );
}

const columnClass = css`
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  padding: 1rem 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const headingClass = css`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  text-align: center;
  color: ${Color.black()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.9rem;
  }
`;
const leadClass = css`
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.5;
  text-align: center;
  color: ${Color.darkerGray()};
`;
const quietClass = css`
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.5;
  text-align: center;
  color: ${Color.darkGray()};
`;
const labelClass = css`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
`;
const errorClass = css`
  margin: 0;
  font-size: 1.4rem;
  text-align: center;
  color: red;
`;
const resultsClass = css`
  min-height: 9rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;
const rowClass = css`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.6rem;
  text-align: left;
`;
const pickedClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  font-size: 1.7rem;
  color: ${Color.black()};
  button {
    margin-left: auto;
  }
`;
