import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { useAppContext, useKeyContext } from '~/contexts';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { Color } from '~/constants/css';

interface Coverage {
  state: 'available' | 'unavailable';
  rows: number;
  truncated: boolean;
  earliestAt: number | null;
}
interface DeviceUse {
  deviceRef: string;
  firstSeenAt: number;
  lastSeenAt: number;
  daysSeen: number;
  records: number;
  firstLoginAt?: number | null;
  lastLoginAt?: number | null;
  loginRecords?: number;
}
interface Scan {
  id: number;
  scannerId: number;
  codeOwnerId: number;
  kind: string;
  witnessSessionId: number;
  scannedAt: number;
  result: string;
  sameNetwork: boolean;
  academyNetwork: boolean;
  scannerNetworkRef: string;
  codeNetworkRef: string;
  soundHeard: boolean;
  soundStatus: string;
  device: null | {
    deviceRef: string | null;
    currentDevice: DeviceUse | null;
    accountHistory: Coverage;
    deviceHistory: Coverage;
    otherDevices: DeviceUse[];
    otherDevicesOmitted: number;
    otherAccounts: {
      userId: number;
      firstSeenAt: number;
      lastSeenAt: number;
      daysSeen: number;
      records: number;
    }[];
    otherAccountsOmitted: number;
  };
}
export interface MeetupEvidence {
  qualification?: {
    counted: number;
    target: number;
    witnessed: boolean;
    readyForReview: boolean;
    people: {
      userId: number;
      username: string;
      way: string;
      state: string;
      at: number;
      waitingOn?: string;
    }[];
  } | null;
  completion?: { status: string; memberIds: number[]; tier: string } | null;
  fingerprint: string;
  gaps: string[];
  truncated: boolean;
  participants: {
    userId: number;
    username: string;
    realName: string;
    joinedAt: number;
    approvedDob: string | null;
    banned: boolean;
    deleted: boolean;
    knownAdult: boolean;
    staff: boolean;
    identityAvailable: boolean;
    sameIdentityWith: number[];
  }[];
  members?: {
    userId: number;
    joinedAt: number;
    branch: string;
    branchVerified: boolean;
    attended: boolean;
    infoCheck?: { status: string } | null;
  }[];
  scans: Scan[];
  sessions: {
    sessionId: number;
    kind: string;
    startedAt: number;
    endsAt: number;
    witnessUserId: number;
    childUserId: number;
    addressSource: string;
    trust: number;
    attendees: {
      userId: number;
      at: number;
      inPlace: boolean;
      soundHeard: boolean;
    }[];
  }[];
  pairs: {
    id: number;
    userA: number;
    userB: number;
    at: number;
    status: string;
    refusedReason: string;
    sameNetwork: boolean;
    academyNetwork: boolean;
    soundHeard: boolean;
  }[];
}

const panel = css`
  text-align: left;
  font-size: 1.3rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  min-width: 0;
  margin-top: 1.5rem;
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.6rem;
  }
  p {
    margin: 0.5rem 0;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
  }
  ul {
    padding-left: 1.8rem;
    margin: 0.5rem 0;
  }
`;
const card = css`
  border: 1px solid ${Color.borderGray()};
  border-radius: 0.8rem;
  padding: 1.2rem;
  margin: 1rem 0;
  min-width: 0;
`;
const warning = css`
  border-left: 3px solid ${Color.orange()};
  padding-left: 0.9rem;
`;
const when = (at: number | null) =>
  at
    ? new Date(at * 1000).toLocaleString('en-GB', {
        timeZone: 'Asia/Seoul',
        hour12: false
      })
    : 'unknown';
function coverageLabel(c: Coverage) {
  return c.state === 'unavailable'
    ? 'History unavailable'
    : `${c.rows} retained records${c.earliestAt ? ` since ${when(c.earliestAt)}` : ''}${c.truncated ? ' · capped: older history omitted' : ''}`;
}

export default function MeetupReview({
  userId,
  crewId,
  pending = false,
  onFingerprint,
  onDecided
}: {
  userId?: number;
  crewId?: number;
  pending?: boolean;
  onFingerprint?: (fingerprint: string) => void;
  onDecided?: () => Promise<void>;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const load = useAppContext((v) => v.requestHelpers.loadMeetupReviewEvidence);
  const decide = useAppContext(
    (v) => v.requestHelpers.decideMeetupCrewCompletion
  );
  const [evidence, setEvidence] = useState<MeetupEvidence | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setEvidence(null);
    setError('');
    setLoading(true);
    onFingerprint?.('');
    if (myId !== ADMIN_USER_ID) {
      setLoading(false);
      return;
    }
    load({ userId, crewId })
      .then((data: MeetupEvidence) => {
        if (!active) return;
        setEvidence(data);
        onFingerprint?.(data.fingerprint);
      })
      .catch(() => {
        if (active)
          setError('Could not load the evidence. Reload before deciding.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Request helpers are stable; the parent passes its state setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, crewId, myId, revision, onFingerprint]);
  if (myId !== ADMIN_USER_ID)
    return <p>Mikey reviews meetup evidence and completions.</p>;
  return (
    <div className={panel}>
      {loading && <p>Loading scan and device evidence…</p>}
      {error && (
        <p role="alert" className={warning}>
          {error}
        </p>
      )}
      {evidence && <MeetupEvidenceView evidence={evidence} />}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginTop: '1rem'
        }}
      >
        <Button
          size="sm"
          disabled={loading || saving}
          onClick={() => setRevision((r) => r + 1)}
        >
          Reload evidence
        </Button>
        {crewId && pending && (
          <>
            <Button
              size="sm"
              color="rose"
              disabled={!evidence?.fingerprint || loading || saving}
              onClick={() => handleDecision(false)}
            >
              Reject completion
            </Button>
            <Button
              size="sm"
              color="green"
              disabled={!evidence?.fingerprint || loading || saving}
              onClick={() => handleDecision(true)}
            >
              Approve completion
            </Button>
          </>
        )}
      </div>
    </div>
  );
  async function handleDecision(isApproved: boolean) {
    if (!crewId || !evidence) return;
    setSaving(true);
    setError('');
    try {
      await decide({ crewId, isApproved, fingerprint: evidence.fingerprint });
      await onDecided?.();
      setRevision((r) => r + 1);
    } catch {
      setEvidence(null);
      setError(
        'The decision was not confirmed. Reload the evidence and current status before trying again.'
      );
    } finally {
      setSaving(false);
    }
  }
}

export function MeetupEvidenceView({ evidence }: { evidence: MeetupEvidence }) {
  const name = (id: number) =>
    `${evidence.participants.find((p) => p.userId === id)?.username || 'Member'} #${id}`;
  const latest = evidence.participants.map((person) => ({
    person,
    scan: evidence.scans.find((scan) => scan.scannerId === person.userId)
  }));
  return (
    <div className={panel}>
      <h3>Meetup evidence · owner only</h3>
      {evidence.qualification && (
        <div className={card}>
          <b>Achievement qualification</b>
          <p>
            {evidence.qualification.counted} of {evidence.qualification.target}{' '}
            people counted ·{' '}
            {evidence.qualification.witnessed
              ? 'grown-up meetup qualifies'
              : 'no qualifying grown-up meetup'}
            .
          </p>
          {!evidence.qualification.readyForReview && (
            <p className={warning}>
              The current check-ins do not qualify for an unlock.
            </p>
          )}
          <ul>
            {evidence.qualification.people.map((person) => (
              <li key={person.userId}>
                {name(person.userId)} ·{' '}
                {person.way === 'invite' ? 'invited friend' : 'check-in'} ·{' '}
                {person.state.replaceAll('_', ' ')} · {when(person.at)}
                {person.waitingOn
                  ? ` · birthdate waiting on ${person.waitingOn}`
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {evidence.completion && (
        <p>
          <b>
            Completion {evidence.completion.status}:{' '}
            {evidence.completion.tier || 'no tier'}.
          </b>{' '}
          Includes {evidence.completion.memberIds.map(name).join(', ')}. Other
          people below are supporting context.
        </p>
      )}
      <p>
        Times are Korea time. Browser IDs can be reset or copied; scans
        establish account control, not who held each phone. Shared Wi-Fi or
        sound is supporting evidence.
      </p>
      <div className={card}>
        <b>Latest scanning browser for each participant</b>
        <ul>
          {latest.map(({ person, scan }) => {
            const first = scan?.device?.currentDevice;
            return (
              <li key={person.userId}>
                <b>{name(person.userId)}</b>:{' '}
                {first && scan
                  ? `earliest retained use ${Math.max(0, Math.floor((scan.scannedAt - first.firstSeenAt) / 60))} minutes before scanning; seen on ${first.daysSeen} days${scan.device?.accountHistory.truncated ? ' (history capped)' : ''}`
                  : 'prior browser use unknown'}
              </li>
            );
          })}
        </ul>
      </div>
      {evidence.gaps.length > 0 && (
        <div className={warning}>
          <b>Evidence gaps</b>
          <ul>
            {evidence.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </div>
      )}
      {evidence.participants.map((person) => {
        const scans = evidence.scans.filter(
          (scan) => scan.scannerId === person.userId
        );
        const member = evidence.members?.find(
          (m) => m.userId === person.userId
        );
        return (
          <section key={person.userId} className={card}>
            <h3>
              {name(person.userId)}
              {person.realName ? ` · ${person.realName}` : ''}
            </h3>
            <p>
              Account joined {when(person.joinedAt)} · approved birthdate:{' '}
              {person.approvedDob || 'none'}
              {person.knownAdult ? ' · adult achievement' : ''}
              {person.staff ? ' · staff' : ''}
              {person.banned ? ' · BANNED' : ''}
              {person.deleted ? ' · DELETED' : ''}
            </p>
            {member && (
              <p>
                Crew joined {when(member.joinedAt)} ·{' '}
                {member.branch || 'No branch'} ·{' '}
                {member.branchVerified
                  ? 'branch verified'
                  : 'branch not verified'}{' '}
                ·{' '}
                {member.attended
                  ? 'previously approved attendee'
                  : 'attendance not approved'}
                {member.infoCheck
                  ? ` · identity check ${member.infoCheck.status}`
                  : ''}
              </p>
            )}
            {!person.identityAvailable && (
              <p className={warning}>Current account identity unavailable.</p>
            )}
            {!!person.sameIdentityWith.length && (
              <p className={warning}>
                Currently the same account identity as{' '}
                {person.sameIdentityWith.map(name).join(', ')}.
              </p>
            )}
            {!scans.length ? (
              <p className={warning}>
                No retained scan-device evidence for this member.
              </p>
            ) : (
              <>
                <ScanDetails scan={scans[0]} name={name} />
                {scans.length > 1 && (
                  <details>
                    <summary>{scans.length - 1} earlier scans</summary>
                    {scans.slice(1).map((scan) => (
                      <ScanDetails key={scan.id} scan={scan} name={name} />
                    ))}
                  </details>
                )}
              </>
            )}
          </section>
        );
      })}
      {evidence.sessions.map((session) => (
        <section className={card} key={session.sessionId}>
          <h3>Grown-up session #{session.sessionId}</h3>
          <p>
            {session.kind === 'teacher'
              ? `Teacher #${session.witnessUserId}`
              : `Parent invited by ${name(session.childUserId)} · ${session.trust >= 1 ? 'guardian address from sign-up' : 'address entered by child'}`}{' '}
            · {session.addressSource}
          </p>
          <p>
            {when(session.startedAt)} – {when(session.endsAt)}. A shared session
            does not establish that the children were there at the same time.
          </p>
          <ul>
            {session.attendees.map((a) => (
              <li key={a.userId}>
                {name(a.userId)} · first attendance {when(a.at)} ·{' '}
                {a.inPlace
                  ? 'network proximity recorded'
                  : 'no network proximity'}
                {a.soundHeard ? ' · sound heard' : ''}
              </li>
            ))}
          </ul>
          <p>
            Attendance flags combine repeat scans; individual scan records above
            show the timing and evidence for each attempt.
          </p>
        </section>
      ))}
      {!!evidence.pairs.length && (
        <details className={card}>
          <summary>{evidence.pairs.length} saved peer check-ins</summary>
          <p>
            Pair flags can combine repeat scans. They do not prove simultaneous
            presence.
          </p>
          <ul>
            {evidence.pairs.map((pair) => (
              <li key={pair.id}>
                {name(pair.userA)} ↔ {name(pair.userB)} · {when(pair.at)} ·{' '}
                {pair.status}
                {pair.refusedReason ? ` (${pair.refusedReason})` : ''} · same
                network: {pair.sameNetwork ? 'yes' : 'no'}, academy:{' '}
                {pair.academyNetwork ? 'yes' : 'no'}, sound:{' '}
                {pair.soundHeard ? 'yes' : 'no'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ScanDetails({
  scan,
  name
}: {
  scan: Scan;
  name: (id: number) => string;
}) {
  const device = scan.device;
  const current = device?.currentDevice;
  const elapsed = current ? scan.scannedAt - current.firstSeenAt : null;
  return (
    <div className={card}>
      <b>
        Scan #{scan.id} · {when(scan.scannedAt)}
      </b>
      <p>
        {scan.kind === 'witness'
          ? `Grown-up session #${scan.witnessSessionId}`
          : `Code shown by ${name(scan.codeOwnerId)}`}{' '}
        · result: {scan.result}
      </p>
      <p>
        Same network: {scan.sameNetwork ? 'yes' : 'no'} · same academy network:{' '}
        {scan.academyNetwork ? 'yes' : 'no'} · sound:{' '}
        {scan.soundStatus || 'not attempted'}
      </p>
      <details>
        <summary>Network references</summary>
        <p>
          Scanner: {scan.scannerNetworkRef || 'unavailable'} · code:{' '}
          {scan.codeNetworkRef || 'unavailable'}. Matching references link
          observations, not people.
        </p>
      </details>
      {!device || !device.deviceRef ? (
        <p className={warning}>Scanning browser ID unavailable.</p>
      ) : (
        <>
          <p>
            <b>Browser {device.deviceRef}</b>
          </p>
          {current ? (
            <p className={elapsed! < 86400 ? warning : undefined}>
              <b>
                {elapsed! < 86400
                  ? 'Earliest retained use is within 24 hours of this scan.'
                  : 'Previously observed browser.'}
              </b>{' '}
              Earliest retained use by this account: {when(current.firstSeenAt)}{' '}
              ({Math.max(0, Math.floor(elapsed! / 60))} minutes before scan).
              Seen on {current.daysSeen} days, {current.records} records.
            </p>
          ) : (
            <p className={warning}>
              {device.accountHistory.state === 'available'
                ? 'No previous use of this browser in the retained account history.'
                : 'Account history could not be read; prior use is unknown.'}
            </p>
          )}
          <p>
            Login records on this browser before the scan:{' '}
            {current?.loginRecords || 0}
            {current?.firstLoginAt
              ? ` · first ${when(current.firstLoginAt)} · latest ${when(current.lastLoginAt || null)}`
              : ' · no login timestamp in the retained history'}
          </p>
          <p>
            {coverageLabel(device.accountHistory)}. Dates describe observations
            available at scan time, not guaranteed first-ever use.
          </p>
          <details>
            <summary>
              {device.otherDevices.length} other previously used browsers
              {device.otherDevicesOmitted
                ? ` (+${device.otherDevicesOmitted} omitted)`
                : ''}
            </summary>
            {!device.otherDevices.length && (
              <p>No other browser appears in this retained history.</p>
            )}
            <ul>
              {device.otherDevices.map((d) => (
                <li key={d.deviceRef}>
                  {d.deviceRef}: {when(d.firstSeenAt)} – {when(d.lastSeenAt)},{' '}
                  {d.daysSeen} days / {d.records} records
                </li>
              ))}
            </ul>
          </details>
          <details>
            <summary>
              {device.otherAccounts.length} other accounts previously seen on
              this browser
              {device.otherAccountsOmitted
                ? ` (+${device.otherAccountsOmitted} omitted)`
                : ''}
            </summary>
            <p>
              {coverageLabel(device.deviceHistory)}. A shared browser does not
              necessarily mean one person.
            </p>
            <ul>
              {device.otherAccounts.map((a) => (
                <li key={a.userId}>
                  {name(a.userId)}: {when(a.firstSeenAt)} – {when(a.lastSeenAt)}
                  , {a.daysSeen} days / {a.records} records
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
