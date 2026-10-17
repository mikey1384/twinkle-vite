import React, { useEffect, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import LiveCode from './LiveCode';
import QrScanner from './QrScanner';
import TogetherGuide from './TogetherGuide';
import {
  setSoundPreference,
  soundPreference,
  soundSupported,
  startListening,
  unlockSound
} from './soundCode';
import type {
  CheckinPerson,
  CheckinProgress,
  CheckinScanResult
} from '../types';

const stamp = keyframes`
  0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
  60% { transform: scale(1.12) rotate(3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

interface Partner {
  userId: number;
  username: string;
  profilePicUrl: string | null;
}

type Result =
  | {
      kind: 'done';
      partner: Partner;
      person: CheckinPerson | null;
      together: boolean;
      upgraded: boolean;
    }
  | { kind: 'witnessed'; inPlace: boolean }
  | { kind: 'refused'; line: string };

type ListenState = 'off' | 'starting' | 'listening' | 'denied' | 'unsupported';

// after the camera reads a code, how long to keep listening for the friend's
// chirp if it wasn't heard yet (a burst every ~2.4 s)
const LISTEN_WAIT_MS = 2600;
// heard codes older than this are dropped (a code lives 30 s)
const HEARD_FOR_MS = 20000;

// Check in with a friend: my code on top, a Scan button under it. Both people
// scan each other: the first scan asks for the scan back, the second one lands
// the check-in. While my code is up, the screen also notices when my friend's
// scan of it completed the pair (it asks every few seconds).
//
// The proximity ladder (Mikey 10-17): my code chirps its sound code; while I
// scan, my phone listens (after a one-time explainer). A check-in that still
// couldn't tell we were together leads to the "show you're together" guide.
export default function CheckinModal({
  progress,
  onProgress,
  onAddBirthdate,
  onHide,
  startWithGuide = false
}: {
  progress: CheckinProgress;
  onProgress: (progress: CheckinProgress) => void;
  onAddBirthdate: () => void;
  onHide: () => void;
  // opened from the card's "show you were together" note
  startWithGuide?: boolean;
}) {
  const issueMeetupCheckinCode = useAppContext(
    (v) => v.requestHelpers.issueMeetupCheckinCode
  );
  const scanMeetupCheckinCode = useAppContext(
    (v) => v.requestHelpers.scanMeetupCheckinCode
  );
  const loadMeetupCheckins = useAppContext(
    (v) => v.requestHelpers.loadMeetupCheckins
  );
  const loadLatestMeetupCheckin = useAppContext(
    (v) => v.requestHelpers.loadLatestMeetupCheckin
  );
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [mode, setMode] = useState<
    'code' | 'scanIntro' | 'scan' | 'result' | 'guide'
  >(startWithGuide ? 'guide' : 'code');
  const [listen, setListen] = useState<ListenState>('off');
  // bumped when the sound check is switched on or off: restarts listening
  // only (the camera and my code stay as they are)
  const [listenEpoch, setListenEpoch] = useState(0);
  const [waitingForSound, setWaitingForSound] = useState(false);
  const heardRef = useRef<{ code: string; at: number }[]>([]);
  const listenRef = useRef<ListenState>('off');
  listenRef.current = listen;
  const [scanBackFor, setScanBackFor] = useState<Partner | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [scanError, setScanError] = useState('');
  const [busy, setBusy] = useState(false);
  const knownRef = useRef(new Set(progress.people.map((p) => p.userId)));
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    trackMeetupQuestView('checkin_code_show');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // my friend scanned my code back: a new check-in row lands (a cheap check
  // every few seconds, against the newest one when the code went up), then my
  // people show who it was
  const latestIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (mode !== 'code') return;
    let stopped = false;
    if (latestIdRef.current === null) {
      loadLatestMeetupCheckin()
        .then((latest: { latestId: number }) => {
          if (latestIdRef.current === null)
            latestIdRef.current = latest.latestId;
        })
        .catch(() => undefined);
    }
    const timer = window.setInterval(async () => {
      try {
        const latest: { latestId: number; status: string } =
          await loadLatestMeetupCheckin();
        if (stopped || latestIdRef.current === null) {
          if (latestIdRef.current === null)
            latestIdRef.current = latest.latestId;
          return;
        }
        if (latest.latestId === latestIdRef.current) return;
        latestIdRef.current = latest.latestId;
        if (latest.status === 'refused') {
          setScanBackFor(null);
          setResult({
            kind: 'refused',
            line: "This check-in doesn't count toward Bridge Builder."
          });
          setMode('result');
          return;
        }
        const next: CheckinProgress = await loadMeetupCheckins();
        if (stopped) return;
        onProgressRef.current(next);
        const fresh = next.people.find(
          (person) =>
            person.way === 'checkin' && !knownRef.current.has(person.userId)
        );
        if (fresh) {
          knownRef.current.add(fresh.userId);
          setScanBackFor(null);
          setResult({
            kind: 'done',
            partner: fresh,
            person: fresh,
            together: !!fresh.together,
            upgraded: false
          });
          setMode('result');
        }
      } catch {
        // the next tick tries again
      }
    }, 3000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [mode, loadMeetupCheckins, loadLatestMeetupCheckin]);

  // while scanning (sound check on), listen for my friend's chirp
  useEffect(() => {
    if (mode !== 'scan' || soundPreference() !== 'on' || !soundSupported()) {
      setListen(soundSupported() ? 'off' : 'unsupported');
      return;
    }
    let stopped = false;
    let stop: (() => void) | null = null;
    setListen('starting');
    startListening((code) => {
      const now = Date.now();
      heardRef.current = [
        { code, at: now },
        ...heardRef.current.filter(
          (h) => h.code !== code && now - h.at < HEARD_FOR_MS
        )
      ].slice(0, 5);
    }).then((started) => {
      if (stopped) return started.stop();
      stop = started.stop;
      setListen(started.status);
      if (started.status === 'denied')
        trackMeetupQuestView('checkin_mic_denied');
    });
    return () => {
      stopped = true;
      stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, listenEpoch]);

  return (
    <Modal
      modalKey="BridgeBuilderCheckinModal"
      isOpen
      onClose={onHide}
      hasHeader
      title="Check in"
      size="sm"
    >
      <div
        className={css`
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.4rem;
          padding-bottom: 0.6rem;
          text-align: center;
        `}
      >
        {mode === 'code' && (
          <>
            {scanBackFor ? (
              <Banner tone="green">
                Nice! Now <b>{scanBackFor.username}</b> scans your code.
              </Banner>
            ) : (
              <p className={leadClass}>
                Your friend scans your code, then you scan theirs.
              </p>
            )}
            <LiveCode load={issueMeetupCheckinCode} />
            <Button
              color="logoBlue"
              size="lg"
              onClick={() => {
                setScanError('');
                trackMeetupQuestView('checkin_scan_open');
                if (soundSupported() && !soundPreference()) {
                  trackMeetupQuestView('checkin_mic_ask');
                  setMode('scanIntro');
                } else {
                  unlockSound();
                  setMode('scan');
                }
              }}
            >
              <Icon icon="camera" style={{ marginRight: '0.7rem' }} />
              Scan my friend’s code
            </Button>
          </>
        )}

        {mode === 'scanIntro' && (
          <>
            <div
              className={css`
                font-size: 3.6rem;
                color: ${Color.logoBlue()};
              `}
            >
              <Icon icon="ear-listen" />
            </div>
            <div className={titleClass}>Your phone listens too</div>
            <p className={leadClass}>
              Your friend’s phone plays a short, quiet sound (some people hear
              it as a faint tick). When your phone hears it, your check-in
              counts right away, even with no Wi-Fi.
            </p>
            <p className={leadClass}>
              Your browser will ask for the camera and the microphone.{' '}
              <b>Nothing is recorded.</b>
            </p>
            <Button
              color="logoBlue"
              size="lg"
              style={{ width: '100%', minHeight: '5rem' }}
              onClick={() => {
                setSoundPreference('on');
                unlockSound();
                setMode('scan');
              }}
            >
              <Icon icon="camera" style={{ marginRight: '0.7rem' }} />
              Start scanning
            </Button>
            <Button
              variant="ghost"
              color="darkGray"
              onClick={() => {
                setSoundPreference('off');
                setMode('scan');
              }}
            >
              Camera only
            </Button>
          </>
        )}

        {mode === 'scan' && (
          <>
            <p className={leadClass}>
              Point your camera at your friend’s code.
            </p>
            {busy ? (
              <div
                className={css`
                  height: 32rem;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  gap: 1.4rem;
                `}
              >
                {waitingForSound ? (
                  <>
                    <ListeningRings />
                    <div
                      className={css`
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: ${Color.black()};
                      `}
                    >
                      Listening for your friend’s phone…
                    </div>
                  </>
                ) : (
                  <Icon
                    icon="spinner"
                    pulse
                    style={{ fontSize: '3rem', color: Color.logoBlue() }}
                  />
                )}
              </div>
            ) : (
              <QrScanner key={scanError} onScan={handleScan} />
            )}
            {!waitingForSound && (
              <ListenNote
                state={listen}
                onTurnOn={() => {
                  setSoundPreference('on');
                  unlockSound();
                  setListenEpoch((n) => n + 1);
                }}
                onTurnOff={() => {
                  // camera only from now on (the explainer's other choice)
                  setSoundPreference('off');
                  heardRef.current = [];
                  setListenEpoch((n) => n + 1);
                }}
              />
            )}
            {scanError && <Banner tone="orange">{scanError}</Banner>}
            <Button
              variant="ghost"
              color="darkGray"
              onClick={() => setMode('code')}
            >
              Show my code instead
            </Button>
          </>
        )}

        {mode === 'guide' && (
          <TogetherGuide
            partnerName={
              result?.kind === 'done' ? result.partner.username : undefined
            }
            track={trackMeetupQuestView}
            onScanAgain={() => {
              setResult(null);
              setMode('code');
            }}
            onDone={() => (result ? setMode('result') : onHide())}
          />
        )}

        {mode === 'result' && result && (
          <>
            <ResultView
              result={result}
              progress={progress}
              onAddBirthdate={onAddBirthdate}
              onShowTogether={() => setMode('guide')}
              onScanAgain={() => {
                setResult(null);
                setMode('scan');
              }}
            />
            <div
              className={css`
                display: flex;
                gap: 0.8rem;
                flex-wrap: wrap;
                justify-content: center;
              `}
            >
              <Button
                color="logoBlue"
                variant={
                  result.kind === 'done' &&
                  !result.together &&
                  progress.needsTogether
                    ? 'soft'
                    : undefined
                }
                onClick={() => {
                  setResult(null);
                  setMode('code');
                }}
              >
                Check in with someone else
              </Button>
              <Button variant="ghost" color="darkGray" onClick={onHide}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );

  async function handleScan(text: string) {
    setBusy(true);
    setScanError('');
    try {
      // give the friend's chirp a moment if nothing was heard yet
      if (listenRef.current === 'listening' && !freshHeard().length) {
        setWaitingForSound(true);
        const until = Date.now() + LISTEN_WAIT_MS;
        while (Date.now() < until && !freshHeard().length) {
          await new Promise((resolve) => window.setTimeout(resolve, 120));
        }
        setWaitingForSound(false);
      }
      const heard = freshHeard();
      const sound = heard.length
        ? 'heard'
        : listenRef.current === 'listening'
          ? 'not_heard'
          : listenRef.current === 'denied' ||
              listenRef.current === 'unsupported'
            ? listenRef.current
            : undefined;
      const {
        result: scan,
        partner,
        progress: next
      }: {
        result: CheckinScanResult;
        partner: Partner | null;
        progress: CheckinProgress;
      } = await scanMeetupCheckinCode(text, {
        heard: heard.length ? heard : undefined,
        sound
      });
      onProgress(next);
      if (scan.state === 'done' || scan.state === 'refused') {
        latestIdRef.current = Number(
          (await loadLatestMeetupCheckin())?.latestId || 0
        );
      }
      if (scan.state === 'scan_back') {
        setScanBackFor(partner);
        setMode('code');
      } else if (scan.state === 'done' && partner) {
        knownRef.current.add(partner.userId);
        setScanBackFor(null);
        setResult({
          kind: 'done',
          partner,
          person:
            next.people.find((person) => person.userId === partner.userId) ||
            null,
          together: !!scan.together,
          upgraded: !!scan.upgraded
        });
        setMode('result');
      } else if (scan.state === 'witnessed') {
        setResult({ kind: 'witnessed', inPlace: scan.inPlace !== false });
        setMode('result');
      } else if (scan.state === 'refused') {
        setResult({ kind: 'refused', line: scan.line });
        setMode('result');
      }
    } catch (error: any) {
      // a stale code or a hiccup: the camera opens again
      setScanError(error?.message || 'That didn’t work. Try scanning again.');
    } finally {
      setWaitingForSound(false);
      setBusy(false);
    }
  }

  function freshHeard() {
    const now = Date.now();
    return heardRef.current
      .filter((h) => now - h.at < HEARD_FOR_MS)
      .map((h) => h.code);
  }
}

function ResultView({
  result,
  progress,
  onAddBirthdate,
  onShowTogether,
  onScanAgain
}: {
  result: Result;
  progress: CheckinProgress;
  onAddBirthdate: () => void;
  onShowTogether: () => void;
  onScanAgain: () => void;
}) {
  if (result.kind === 'refused') {
    return <p className={leadClass}>{result.line}</p>;
  }
  if (result.kind === 'witnessed') {
    return (
      <>
        <StampIcon icon="user-shield" />
        <div className={titleClass}>
          You’re checked in at the grown-up’s meetup!
        </div>
        <p className={leadClass}>
          When two or more kids have scanned it, everyone who did unlocks Bridge
          Builder.
        </p>
        {!result.inPlace && (
          <div className={nudgeClass}>
            <b>So it counts right away:</b> join the grown-up’s Wi-Fi (or their
            phone’s hotspot), then scan their code again.
            <Button
              color="logoBlue"
              variant="soft"
              onClick={onScanAgain}
              style={{ marginTop: '0.8rem' }}
            >
              <Icon icon="qrcode" style={{ marginRight: '0.6rem' }} />
              Scan again
            </Button>
          </div>
        )}
      </>
    );
  }
  const { partner, person, together, upgraded } = result;
  return (
    <>
      <div
        className={css`
          position: relative;
          padding: 0.4rem;
          border-radius: 50%;
          background: ${Color.green()};
          animation: ${stamp} 0.5s ease-out both;
        `}
      >
        <ProfilePic
          userId={partner.userId}
          profilePicUrl={partner.profilePicUrl || ''}
          size="9rem"
        />
        <span
          className={css`
            position: absolute;
            right: -0.2rem;
            bottom: -0.2rem;
            width: 3.2rem;
            height: 3.2rem;
            border-radius: 50%;
            background: ${Color.green()};
            border: 0.3rem solid #fff;
            color: #fff;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          <Icon icon="check" />
        </span>
      </div>
      <div className={titleClass}>
        {upgraded ? (
          <>You showed you’re together!</>
        ) : (
          <>Checked in with {partner.username}!</>
        )}
      </div>
      {together && (
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 1.1rem;
            border-radius: 2rem;
            font-size: 1.35rem;
            font-weight: bold;
            color: ${Color.green()};
            background: ${Color.green(0.12)};
          `}
        >
          <Icon icon="handshake" />
          Together
        </span>
      )}
      {person?.state === 'counted' && !upgraded && (
        <p className={leadClass}>
          +1 person. <b>{progress.counted}</b> of {progress.target}.
        </p>
      )}
      {person?.state === 'getting_started' && (
        <p className={leadClass}>
          {partner.username} counts once they’ve played on Twinkle a few days.
        </p>
      )}
      {person?.state === 'waiting_birthdate' &&
        (person.waitingOn === 'them' ? (
          <p className={leadClass}>
            This counts once {partner.username}’s birthdate is checked.
          </p>
        ) : (
          <>
            <p className={leadClass}>Add your birthdate so this counts.</p>
            <Button color="orange" variant="soft" onClick={onAddBirthdate}>
              Add my birthdate
            </Button>
          </>
        ))}
      {!together && progress.needsTogether && (
        <div className={nudgeClass}>
          <b>One more step</b>
          <span>
            Show that you two are together, and Bridge Builder unlocks on its
            own.
          </span>
          <Button
            color="logoBlue"
            onClick={onShowTogether}
            style={{ marginTop: '0.8rem', width: '100%', minHeight: '4.8rem' }}
          >
            <Icon icon="handshake" style={{ marginRight: '0.6rem' }} />
            Show we’re together
          </Button>
        </div>
      )}
    </>
  );
}

function StampIcon({ icon }: { icon: string }) {
  return (
    <div
      className={css`
        width: 9rem;
        height: 9rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${Color.gold(0.18)};
        color: ${Color.orange()};
        font-size: 4rem;
        animation: ${stamp} 0.5s ease-out both;
      `}
    >
      <Icon icon={icon as any} />
    </div>
  );
}

function Banner({
  tone,
  children
}: {
  tone: 'green' | 'orange';
  children: React.ReactNode;
}) {
  const color = tone === 'green' ? Color.green : Color.orange;
  return (
    <div
      className={css`
        width: 100%;
        padding: 1rem 1.2rem;
        border-radius: 1rem;
        font-size: 1.4rem;
        line-height: 1.5;
        color: ${Color.black()};
        background: ${color(0.12)};
        border: 1px solid ${color(0.35)};
      `}
    >
      {children}
    </div>
  );
}

function ListenNote({
  state,
  onTurnOn,
  onTurnOff
}: {
  state: ListenState;
  onTurnOn: () => void;
  onTurnOff: () => void;
}) {
  if (state === 'unsupported') return null;
  const line =
    state === 'listening' || state === 'starting'
      ? 'Your phone is listening for your friend’s phone.'
      : state === 'denied'
        ? 'The microphone is off, so the sound check can’t help. You can allow it in your browser’s settings.'
        : '';
  if (line) {
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 1.3rem;
          line-height: 1.45;
          color: ${Color.darkGray()};
          text-align: left;
        `}
      >
        <Icon
          icon={state === 'denied' ? 'microphone-slash' : 'ear-listen'}
          style={{
            color: state === 'denied' ? Color.darkGray() : Color.logoBlue()
          }}
        />
        <span
          className={css`
            flex: 1;
          `}
        >
          {line}
        </span>
        {state !== 'denied' && (
          <button
            type="button"
            onClick={onTurnOff}
            className={css`
              flex-shrink: 0;
              min-height: 4.4rem;
              padding: 0 1rem;
              border: 0;
              background: none;
              font-size: 1.3rem;
              font-weight: bold;
              color: ${Color.logoBlue()};
              cursor: pointer;
            `}
          >
            Turn off
          </button>
        )}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onTurnOn}
      className={css`
        min-height: 4.4rem;
        padding: 0 1.4rem;
        border-radius: 2.2rem;
        border: 1px solid ${Color.logoBlue(0.4)};
        background: ${Color.logoBlue(0.08)};
        color: ${Color.logoBlue()};
        font-size: 1.35rem;
        font-weight: bold;
        cursor: pointer;
      `}
    >
      <Icon icon="ear-listen" style={{ marginRight: '0.6rem' }} />
      Turn on the sound check (no Wi-Fi needed)
    </button>
  );
}

const ripple = keyframes`
  from { transform: scale(0.6); opacity: 0.7; }
  to { transform: scale(1.6); opacity: 0; }
`;

function ListeningRings() {
  return (
    <div
      className={css`
        position: relative;
        width: 10rem;
        height: 10rem;
      `}
    >
      {[0, 0.6, 1.2].map((delay) => (
        <span
          key={delay}
          className={css`
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 0.3rem solid ${Color.logoBlue(0.6)};
            animation: ${ripple} 1.8s ease-out ${delay}s infinite;
          `}
        />
      ))}
      <span
        className={css`
          position: absolute;
          inset: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.4rem;
          color: #fff;
          background: ${Color.logoBlue()};
        `}
      >
        <Icon icon="ear-listen" />
      </span>
    </div>
  );
}

const nudgeClass = css`
  width: 100%;
  padding: 1.2rem 1.4rem;
  border-radius: 1.2rem;
  font-size: 1.4rem;
  line-height: 1.5;
  text-align: left;
  color: ${Color.black()};
  background: ${Color.gold(0.14)};
  border: 1px solid ${Color.gold(0.4)};
  display: flex;
  flex-direction: column;
`;

const leadClass = css`
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;

const titleClass = css`
  font-size: 2rem;
  font-weight: bold;
  color: ${Color.black()};
`;
