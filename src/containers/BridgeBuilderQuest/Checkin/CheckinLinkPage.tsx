import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Link, useParams } from 'react-router-dom';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { storeSignupInvite } from '~/helpers/signupPasses';
import { QuestNote } from '../StepCard';
import LiveCode from './LiveCode';
import type { CheckinScanResult } from '../types';

// A check-in code's own link (/bridge/c/<token>): a phone camera that scanned
// the code opens it. Signed in, it's the same scan the Check in button does;
// signed out, it offers to join Twinkle from the code (the code's owner
// invites, no sign-up question), and the check-in follows once the new
// account has played a few days.
export default function CheckinLinkPage() {
  const { token = '' } = useParams();
  const userId = useKeyContext((v) => v.myState.userId);
  const sessionLoaded = useAppContext((v) => v.user.state.loaded);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const loadMeetupCheckinCodeOwner = useAppContext(
    (v) => v.requestHelpers.loadMeetupCheckinCodeOwner
  );
  const scanMeetupCheckinCode = useAppContext(
    (v) => v.requestHelpers.scanMeetupCheckinCode
  );
  const issueMeetupCheckinCode = useAppContext(
    (v) => v.requestHelpers.issueMeetupCheckinCode
  );
  const issueMeetupCheckinSignupPass = useAppContext(
    (v) => v.requestHelpers.issueMeetupCheckinSignupPass
  );
  const [owner, setOwner] = useState<
    { username: string; kind: string; expired: boolean } | null | undefined
  >(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<
    | { state: 'scan_back'; partner: { username: string } }
    | {
        state: 'done';
        partner: {
          userId: number;
          username: string;
          profilePicUrl: string | null;
        };
      }
    | { state: 'witnessed' }
    | { state: 'refused'; line: string }
    | null
  >(null);

  useEffect(() => {
    if (!sessionLoaded) return;
    loadMeetupCheckinCodeOwner(token)
      .then((data: any) => setOwner(data?.owner || null))
      .catch(() => setOwner(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionLoaded]);

  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/Checkin/CheckinLinkPage">
      <main
        className={css`
          max-width: 46rem;
          margin: 3rem auto;
          padding: 0 1.6rem 12rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.4rem;
          text-align: center;
        `}
      >
        {owner === undefined ? (
          <Loading />
        ) : !owner ? (
          <QuestNote tone="warning">
            This check-in code isn’t valid. Ask your friend to show theirs
            again.
          </QuestNote>
        ) : outcome ? (
          <Outcome outcome={outcome} loadCode={issueMeetupCheckinCode} />
        ) : (
          <>
            <h1 className={titleClass}>
              {owner.kind === 'witness'
                ? 'The grown-up’s meetup code'
                : `${owner.username}’s check-in code`}
            </h1>
            {owner.expired && (
              <QuestNote tone="info">
                This code just changed. Scan the new one on their screen.
              </QuestNote>
            )}
            {userId ? (
              <GameCTAButton
                variant="success"
                size="lg"
                icon="qrcode"
                loading={busy}
                disabled={owner.expired}
                onClick={handleCheckin}
              >
                {owner.kind === 'witness'
                  ? 'Check in at this meetup'
                  : `Check in with ${owner.username}`}
              </GameCTAButton>
            ) : owner.kind === 'person' ? (
              <>
                <p className={leadClass}>
                  <b>{owner.username}</b> invited you to Twinkle. Join to check
                  in together. No sign-up question needed.
                </p>
                <GameCTAButton
                  variant="logoBlue"
                  size="lg"
                  loading={busy}
                  disabled={owner.expired}
                  onClick={handleJoin}
                >
                  Join Twinkle
                </GameCTAButton>
                <Button
                  variant="ghost"
                  color="darkGray"
                  onClick={() => onOpenSigninModal()}
                >
                  I already have an account
                </Button>
              </>
            ) : (
              <Button color="logoBlue" onClick={() => onOpenSigninModal()}>
                Sign in to check in
              </Button>
            )}
            {error && <QuestNote tone="warning">{error}</QuestNote>}
          </>
        )}
        <Link
          to="/achievements/bridge-builder"
          style={{ fontWeight: 700, marginTop: '1rem' }}
        >
          What is Bridge Builder?
        </Link>
      </main>
    </ErrorBoundary>
  );

  async function handleCheckin() {
    setBusy(true);
    setError('');
    try {
      const { result, partner }: { result: CheckinScanResult; partner: any } =
        await scanMeetupCheckinCode(token);
      if (result.state === 'scan_back')
        setOutcome({ state: 'scan_back', partner });
      else if (result.state === 'done') setOutcome({ state: 'done', partner });
      else if (result.state === 'witnessed') setOutcome({ state: 'witnessed' });
      else setOutcome({ state: 'refused', line: result.line });
    } catch (err: any) {
      setError(err?.message || 'That didn’t work. Scan the code again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    setBusy(true);
    setError('');
    try {
      const pass = await issueMeetupCheckinSignupPass(token);
      storeSignupInvite({
        token: pass.token,
        inviterName: pass.inviterName,
        expiresAt: pass.expiresAt,
        source: 'guest'
      });
      onOpenSigninModal();
    } catch (err: any) {
      setError(
        err?.message ||
          'That code just changed. Ask your friend to show it again.'
      );
    } finally {
      setBusy(false);
    }
  }
}

function Outcome({
  outcome,
  loadCode
}: {
  outcome: any;
  loadCode: () => Promise<any>;
}) {
  if (outcome.state === 'scan_back') {
    return (
      <>
        <h1 className={titleClass}>
          Now {outcome.partner?.username || 'your friend'} scans yours
        </h1>
        <LiveCode load={loadCode} />
        <p className={leadClass}>
          Open Check in on Bridge Builder to see who counts.
        </p>
      </>
    );
  }
  if (outcome.state === 'done') {
    return (
      <>
        <ProfilePic
          userId={outcome.partner.userId}
          profilePicUrl={outcome.partner.profilePicUrl || ''}
          size="9rem"
        />
        <h1 className={titleClass}>
          Checked in with {outcome.partner.username}!
        </h1>
      </>
    );
  }
  if (outcome.state === 'witnessed') {
    return (
      <h1 className={titleClass}>
        You’re checked in at the grown-up’s meetup!
      </h1>
    );
  }
  return <p className={leadClass}>{outcome.line}</p>;
}

const titleClass = css`
  margin: 0;
  font-size: 2.2rem;
  color: ${Color.black()};
`;

const leadClass = css`
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.5;
  color: ${Color.darkerGray()};
`;
