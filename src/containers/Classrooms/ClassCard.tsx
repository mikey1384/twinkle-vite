import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { QRCodeSVG } from 'qrcode.react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import { QuestNote } from '~/containers/BridgeBuilderQuest/StepCard';
import {
  classLine,
  panelClass,
  quietLinkClass,
  type Classroom,
  type RosterStudent
} from './shared';

const ROSTER_REFRESH_MS = 10_000;

// One class on My classes: its code three ways (QR, board code, link), the
// code's controls, and the roster with "Not my student" and "Reset password".
// Everything shown comes from the server's answer to each action.
export default function ClassCard({
  classroom: initial,
  open,
  onToggle,
  onRemoved
}: {
  classroom: Classroom;
  open: boolean;
  onToggle: () => void;
  onRemoved: () => void;
}) {
  const myUsername = useKeyContext((v) => v.myState.username);
  const loadClassroom = useAppContext((v) => v.requestHelpers.loadClassroom);
  const changeClassroomCode = useAppContext(
    (v) => v.requestHelpers.changeClassroomCode
  );
  const removeClassroom = useAppContext(
    (v) => v.requestHelpers.removeClassroom
  );
  const markNotMyStudent = useAppContext(
    (v) => v.requestHelpers.markNotMyStudent
  );
  const issueClassroomReset = useAppContext(
    (v) => v.requestHelpers.issueClassroomReset
  );
  const recordClassroomEvent = useAppContext(
    (v) => v.requestHelpers.recordClassroomEvent
  );
  const [classroom, setClassroom] = useState<Classroom>(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState<
    | { kind: 'remove'; student: RosterStudent }
    | { kind: 'new' }
    | { kind: 'class' }
    | null
  >(null);
  const [reset, setReset] = useState<{
    userId: number;
    username: string;
    code: string;
    expiresAt: number;
  } | null>(null);
  const [printing, setPrinting] = useState(false);
  const shownRef = useRef(false);
  const { code } = classroom;
  const codeUp = code.state === 'live' || code.state === 'full';

  useEffect(() => setClassroom(initial), [initial]);

  // the roster fills in while students join: re-read while the card is open
  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let timer = 0;
    read();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
    async function read() {
      try {
        if (!document.hidden) {
          const data = await loadClassroom(initial.id);
          if (!stopped && data?.classroom) setClassroom(data.classroom);
        }
      } catch {
        // the next read tries again
      }
      if (!stopped) timer = window.setTimeout(read, ROSTER_REFRESH_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial.id]);

  useEffect(() => {
    if (!open || !codeUp || shownRef.current) return;
    shownRef.current = true;
    recordClassroomEvent({
      kind: 'code_shown',
      detail: 'screen',
      classroomId: classroom.id
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, codeUp]);

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    window.print();
    return () => window.removeEventListener('afterprint', done);
  }, [printing]);

  const roster = classroom.roster || [];
  const subtitle = classLine(classroom.branchName, classroom.className);

  return (
    <section className={panelClass}>
      <button type="button" className={headerClass} onClick={onToggle}>
        <span className={nameClass}>{classroom.className}</span>
        <span className={metaClass}>
          {classroom.members} joined · {codeStateLabel(code.state)}
        </span>
        <Icon icon={open ? 'chevron-up' : 'chevron-down'} />
      </button>
      {open && (
        <div className={bodyClass}>
          {codeUp ? (
            <div className={codeRowClass}>
              <div className={qrBoxClass}>
                <QRCodeSVG value={code.qrUrl || code.url || ''} size={184} />
              </div>
              <div className={codeFactsClass}>
                <div>
                  <div className={labelClass}>Board code</div>
                  <div className={boardCodeClass}>{code.shortCode}</div>
                </div>
                <div>
                  <div className={labelClass}>Link</div>
                  <div className={linkTextClass}>{code.url}</div>
                </div>
                <div className={factLineClass}>
                  {code.seatsUsed} of {code.seatCap} seats used · works until{' '}
                  {formatDay(code.expiresAt)}
                </div>
                <div className={buttonRowClass}>
                  <Button variant="soft" color="logoBlue" onClick={handleCopy}>
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                  <Button variant="soft" color="logoBlue" onClick={handlePrint}>
                    Print
                  </Button>
                  <Button
                    variant="ghost"
                    color="darkerGray"
                    loading={busy === 'extend'}
                    disabled={!!busy}
                    onClick={() => handleCode('extend')}
                  >
                    Keep 7 more days
                  </Button>
                  <Button
                    variant="ghost"
                    color="darkerGray"
                    loading={busy === 'off'}
                    disabled={!!busy}
                    onClick={() => handleCode('off')}
                  >
                    Turn off
                  </Button>
                  <Button
                    variant="ghost"
                    color="darkerGray"
                    disabled={!!busy}
                    onClick={() => setConfirming({ kind: 'new' })}
                  >
                    New code
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={codeOffClass}>
              <p className={factLineClass}>
                {code.state === 'expired'
                  ? 'This class code ran out. Students can’t join until you turn it back on.'
                  : 'This class code is off. Students can’t join until you make a new one.'}
              </p>
              <div className={buttonRowClass}>
                {code.state === 'expired' && (
                  <Button
                    variant="soft"
                    color="logoBlue"
                    loading={busy === 'extend'}
                    disabled={!!busy}
                    onClick={() => handleCode('extend')}
                  >
                    Keep 7 more days
                  </Button>
                )}
                <Button
                  variant="soft"
                  color="logoBlue"
                  loading={busy === 'new'}
                  disabled={!!busy}
                  onClick={() => handleCode('new')}
                >
                  New code
                </Button>
              </div>
            </div>
          )}
          {code.state === 'full' && (
            <QuestNote tone="info">
              All {code.seatCap} seats are taken, so nobody else can join with
              this code.
            </QuestNote>
          )}
          {confirming?.kind === 'new' && (
            <Confirm
              text="Make a new code? The QR code, board code and link you have now stop working."
              action="New code"
              busy={busy === 'new'}
              onConfirm={() => handleCode('new')}
              onCancel={() => setConfirming(null)}
            />
          )}
          {error && <QuestNote tone="warning">{error}</QuestNote>}

          <div className={rosterTitleClass}>
            {roster.length
              ? `${roster.length} joined`
              : 'Nobody has joined yet. Students who scan the code show up here.'}
          </div>
          {reset && (
            <div className={resetBoxClass}>
              <div>
                Reset code for <b>{reset.username}</b>
              </div>
              <div className={boardCodeClass}>{reset.code}</div>
              <div className={factLineClass}>
                Works once, for 15 minutes. {reset.username} opens Log in, taps
                “I forgot my password”, types their username, taps “I have a
                reset code from my teacher”, then chooses a new password.
              </div>
              <button
                type="button"
                className={quietLinkClass}
                onClick={() => setReset(null)}
              >
                Done
              </button>
            </div>
          )}
          {confirming?.kind === 'remove' && (
            <Confirm
              text={`Take ${confirming.student.username} off this class? Their account keeps working; they just aren’t in your class.`}
              action="Not my student"
              busy={busy === `remove:${confirming.student.userId}`}
              onConfirm={() => handleRemoveStudent(confirming.student)}
              onCancel={() => setConfirming(null)}
            />
          )}
          {roster.map((student) => (
            <div key={student.userId} className={rosterRowClass}>
              <ProfilePic
                userId={student.userId}
                profilePicUrl={student.profilePicUrl || ''}
                size="3.6rem"
              />
              <div className={rosterNameClass}>
                <b>{student.username}</b>
                {student.firstName ? ` (${student.firstName})` : ''}
                <span className={rosterWhenClass}>
                  joined {timeSince(student.joinedAt)}
                </span>
              </div>
              <div className={rosterActionsClass}>
                {student.canReset && (
                  <Button
                    variant="ghost"
                    color="logoBlue"
                    loading={busy === `reset:${student.userId}`}
                    disabled={!!busy}
                    onClick={() => handleReset(student)}
                  >
                    Reset password
                  </Button>
                )}
                <Button
                  variant="ghost"
                  color="darkerGray"
                  disabled={!!busy}
                  onClick={() => setConfirming({ kind: 'remove', student })}
                >
                  Not my student
                </Button>
              </div>
            </div>
          ))}
          <div className={footerClass}>
            {confirming?.kind === 'class' ? (
              <Confirm
                text={`Remove ${classroom.className}? Its code stops working. Students keep their accounts.`}
                action="Remove class"
                busy={busy === 'class'}
                onConfirm={handleRemoveClass}
                onCancel={() => setConfirming(null)}
              />
            ) : (
              <button
                type="button"
                className={removeLinkClass}
                onClick={() => setConfirming({ kind: 'class' })}
              >
                Remove this class
              </button>
            )}
          </div>
        </div>
      )}
      {printing &&
        codeUp &&
        createPortal(
          <div className={`class-code-print ${printClass}`}>
            {/* on paper, only the wall page */}
            <style>{PRINT_ONLY_THIS}</style>
            <h1>Join {myUsername}’s class on Twinkle</h1>
            {subtitle && <h2>{subtitle}</h2>}
            <QRCodeSVG value={code.qrUrl || code.url || ''} size={420} />
            <p>
              Point your camera at the code, or type this on the sign-up screen:
            </p>
            <div className="code">{code.shortCode}</div>
            <p className="link">{code.url}</p>
          </div>,
          document.body
        )}
    </section>
  );

  async function run(key: string, action: () => Promise<any>) {
    setBusy(key);
    setError('');
    try {
      const data = await action();
      if (data?.classroom) setClassroom(data.classroom);
      setConfirming(null);
      return data;
    } catch (err) {
      setError(getErrorMessage(err, 'That didn’t work. Please try again.'));
      return null;
    } finally {
      setBusy('');
    }
  }

  function handleCode(action: 'extend' | 'off' | 'new') {
    return run(action, () =>
      changeClassroomCode({ classroomId: classroom.id, action })
    );
  }

  function handleRemoveStudent(student: RosterStudent) {
    if (reset?.userId === student.userId) setReset(null);
    return run(`remove:${student.userId}`, () =>
      markNotMyStudent({ classroomId: classroom.id, userId: student.userId })
    );
  }

  async function handleReset(student: RosterStudent) {
    const data = await run(`reset:${student.userId}`, () =>
      issueClassroomReset({ classroomId: classroom.id, userId: student.userId })
    );
    if (data?.reset) {
      setReset({
        userId: student.userId,
        username: data.reset.username || student.username,
        code: data.reset.code,
        expiresAt: data.reset.expiresAt
      });
    }
  }

  async function handleRemoveClass() {
    const data = await run('class', () => removeClassroom(classroom.id));
    if (data?.success) onRemoved();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code.url || '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      recordClassroomEvent({
        kind: 'code_shown',
        detail: 'copy',
        classroomId: classroom.id
      });
    } catch {
      setError('Copying isn’t allowed here. Select the link and copy it.');
    }
  }

  function handlePrint() {
    recordClassroomEvent({
      kind: 'code_shown',
      detail: 'print',
      classroomId: classroom.id
    });
    setPrinting(true);
  }
}

function Confirm({
  text,
  action,
  busy,
  onConfirm,
  onCancel
}: {
  text: string;
  action: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={confirmClass}>
      <span>{text}</span>
      <div className={buttonRowClass}>
        <Button
          variant="soft"
          color="redOrange"
          loading={busy}
          onClick={onConfirm}
        >
          {action}
        </Button>
        <Button variant="ghost" color="darkerGray" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function codeStateLabel(state: Classroom['code']['state']) {
  if (state === 'live') return 'code on';
  if (state === 'full') return 'class full';
  if (state === 'expired') return 'code ran out';
  return 'code off';
}

function formatDay(seconds?: number) {
  if (!seconds) return '';
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

const headerClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
`;
const nameClass = css`
  font-size: 1.9rem;
  font-weight: 700;
  color: ${Color.black()};
  overflow-wrap: anywhere;
`;
const metaClass = css`
  margin-left: auto;
  font-size: 1.3rem;
  color: ${Color.darkGray()};
  white-space: nowrap;
`;
const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-top: 1.4rem;
`;
const codeRowClass = css`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
  }
`;
const qrBoxClass = css`
  flex-shrink: 0;
  padding: 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 1rem;
  background: #fff;
  line-height: 0;
`;
const codeFactsClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: 100%;
`;
const labelClass = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.darkGray()};
`;
const boardCodeClass = css`
  font-family: 'Roboto Mono', ui-monospace, Menlo, monospace;
  font-size: 3.2rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${Color.black()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.6rem;
  }
`;
const linkTextClass = css`
  font-size: 1.4rem;
  color: ${Color.darkerGray()};
  overflow-wrap: anywhere;
  user-select: all;
`;
const factLineClass = css`
  margin: 0;
  font-size: 1.3rem;
  line-height: 1.5;
  color: ${Color.darkGray()};
`;
const buttonRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;
const codeOffClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const rosterTitleClass = css`
  margin-top: 0.6rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--ui-border);
  font-size: 1.4rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
`;
const rosterRowClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-wrap: wrap;
  }
`;
const rosterNameClass = css`
  min-width: 0;
  flex: 1;
  font-size: 1.5rem;
  color: ${Color.black()};
  overflow-wrap: anywhere;
`;
const rosterWhenClass = css`
  display: block;
  font-size: 1.2rem;
  color: ${Color.darkGray()};
`;
const rosterActionsClass = css`
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
`;
const resetBoxClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 1.2rem 1.4rem;
  border-radius: 1rem;
  border: 1px solid ${Color.logoBlue(0.35)};
  background: ${Color.logoBlue(0.08)};
  font-size: 1.5rem;
  color: ${Color.black()};
`;
const confirmClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.2rem 1.4rem;
  border-radius: 1rem;
  border: 1px solid ${Color.orange(0.35)};
  background: ${Color.orange(0.08)};
  font-size: 1.4rem;
  color: ${Color.black()};
`;
const footerClass = css`
  margin-top: 0.4rem;
`;
const removeLinkClass = css`
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  font-size: 1.3rem;
  color: ${Color.darkGray()};
  text-decoration: underline;
  cursor: pointer;
`;
// the wall page: only this shows on paper
const PRINT_ONLY_THIS =
  '@media print { body > *:not(.class-code-print) { display: none !important; } }';
const printClass = css`
  display: none;
  @media print {
    display: flex;
    min-height: 90vh;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.4rem;
    background: #fff;
    color: #000;
    text-align: center;
    h1 {
      margin: 0;
      font-size: 3.4rem;
    }
    h2 {
      margin: 0;
      font-size: 2.4rem;
      font-weight: 500;
    }
    p {
      margin: 0;
      font-size: 1.8rem;
    }
    .code {
      font-family: 'Roboto Mono', ui-monospace, Menlo, monospace;
      font-size: 6rem;
      font-weight: 700;
      letter-spacing: 0.12em;
    }
    .link {
      font-size: 1.6rem;
    }
  }
`;
