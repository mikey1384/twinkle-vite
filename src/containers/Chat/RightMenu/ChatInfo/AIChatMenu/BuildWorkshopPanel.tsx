import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import cielBuilder from '~/assets/ciel-builder.png';
import zeroBuilder from '~/assets/zero-builder.png';
import { useAppContext, useKeyContext } from '~/contexts';

type WorkshopPersona = 'zero' | 'ciel';

interface WorkshopRelay {
  id: number;
  dutySessionId: number;
  summary: string;
  projectTitleHint?: string | null;
  details?: {
    jobKind?: 'build' | 'consultation';
    projectIntent?: 'existing' | 'new' | 'unspecified';
    projectRootBuildId?: number | null;
    projectTargetBuildId?: number | null;
    targetKind?: 'main' | 'branch' | null;
    targetTitle?: string | null;
    targetOwnerUserId?: number | null;
    rootIsPublic?: boolean | null;
    forumSharedThroughJob?: false;
    ownerAccessRequestId?: number | null;
    sponsorAccessChoice?: 'job_only' | 'team_invite' | 'unspecified';
    sponsorProjectAccess?: 'workshop' | 'team' | 'owner';
    requestedOutcome?: string | null;
    constraints?: string[];
    acceptanceCriteria?: string[];
  };
  sponsor: {
    userId: number;
    username?: string | null;
  };
}

interface WorkshopStatus {
  featureVisible: boolean;
  persona: WorkshopPersona;
  agentState: 'build_available' | 'build_working' | 'chat_only';
  admission: 'accepting' | 'full' | 'paused' | 'limited';
  sponsor?: {
    userId: number;
    username?: string | null;
  } | null;
  queue: {
    count: number;
    position?: number | null;
    people: Array<{
      jobId: number;
      userId: number;
      username: string;
      persona: WorkshopPersona | null;
      jobKind?: 'build' | 'consultation';
      state: 'queued' | 'working' | 'waiting';
    }>;
  };
  job?: {
    id: number;
    jobKind?: 'build' | 'consultation';
    status: 'queued' | 'leased' | 'working' | 'waiting_user';
    queuePosition?: number | null;
    rootBuild: { id: number; title?: string | null };
    targetBuild: {
      id: number;
      title?: string | null;
      kind: 'main' | 'branch';
      branchNumber?: number | null;
    };
    restorePoint?: {
      artifactVersionId: number;
      versionNumber?: number | null;
    } | null;
    canProgress: boolean;
  } | null;
  pendingRelays: WorkshopRelay[];
  consent: {
    version: string;
    disclosure: string;
  };
  sponsorGuidePath: string;
}

const STATUS_REFRESH_MS = 5_000;

const PERSONA_THEME = {
  ciel: {
    avatar: cielBuilder,
    accent: '#d6539e',
    bubbleBg: '#fdf1f8',
    bubbleBorder: '#f5d3e7'
  },
  zero: {
    avatar: zeroBuilder,
    accent: '#4c78c9',
    bubbleBg: '#eff6ff',
    bubbleBorder: '#d4e4f7'
  }
} as const;

export default function BuildWorkshopPanel({
  channelId,
  isCielChat
}: {
  channelId: number;
  isCielChat: boolean;
}) {
  const persona: WorkshopPersona = isCielChat ? 'ciel' : 'zero';
  const personaName = isCielChat ? 'Ciel' : 'Zero';
  const theme = PERSONA_THEME[persona];
  const userId = useKeyContext((v) => v.myState.userId);
  const loadBuildWorkshopStatus = useAppContext(
    (v) => v.requestHelpers.loadBuildWorkshopStatus
  );
  const createBuildWorkshopJob = useAppContext(
    (v) => v.requestHelpers.createBuildWorkshopJob
  );
  const cancelBuildWorkshopJob = useAppContext(
    (v) => v.requestHelpers.cancelBuildWorkshopJob
  );
  const [status, setStatus] = useState<WorkshopStatus | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [action, setAction] = useState<'join' | 'cancel' | null>(null);
  const [actionError, setActionError] = useState('');
  const relayIdRef = useRef(0);
  const statusRequestIdRef = useRef(0);
  const actionInFlightRef = useRef(false);

  useEffect(() => {
    if (!userId || !channelId) {
      setStatus(null);
      return;
    }
    let disposed = false;
    let inFlight = false;
    statusRequestIdRef.current += 1;

    async function refresh() {
      if (inFlight || actionInFlightRef.current) return;
      inFlight = true;
      const requestId = ++statusRequestIdRef.current;
      try {
        const canonicalStatus = await loadBuildWorkshopStatus({ persona });
        if (!disposed && requestId === statusRequestIdRef.current) {
          setStatus(canonicalStatus);
        }
      } catch (error) {
        if (!disposed) {
          console.error('Failed to load Build Workshop status:', error);
        }
      } finally {
        inFlight = false;
      }
    }

    void refresh();
    const interval = window.setInterval(refresh, STATUS_REFRESH_MS);
    return () => {
      disposed = true;
      statusRequestIdRef.current += 1;
      window.clearInterval(interval);
    };
    // Context request helpers are stable and intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, persona, userId]);

  const relay = status?.pendingRelays?.[0] || null;
  useEffect(() => {
    const nextRelayId = Number(relay?.id || 0);
    if (!nextRelayId || relayIdRef.current === nextRelayId) return;
    relayIdRef.current = nextRelayId;
    setConsentAccepted(false);
    setActionError('');
  }, [relay?.id]);

  const sponsor = relay?.sponsor || status?.sponsor || null;
  const sponsorName = sponsor?.username
    ? `@${sponsor.username}`
    : sponsor?.userId
      ? `sponsor #${sponsor.userId}`
      : 'the named sponsor';
  const stateColor = useMemo(
    () => workshopStateColor(status?.agentState),
    [status?.agentState]
  );

  if (!status?.featureVisible) return null;
  if (status.persona !== persona) return null;

  const consentVersion = status.consent.version;
  const stateLabel = workshopStateLabel(status.agentState);
  const statusActive = status.agentState !== 'chat_only';
  const isIdle = !status.job && !relay;
  const joiningDisabled =
    action !== null ||
    !relay ||
    status.admission !== 'accepting' ||
    !consentAccepted;
  const relayIsConsultation = relay?.details?.jobKind === 'consultation';

  const bubbleText = status.job
    ? jobStatusText(status.job)
    : relay
      ? relayIsConsultation
        ? `I know which project you mean. I can have Lumine look through it and bring us a real answer — review what I'll share first.`
        : `I put together a plan for you — take a look! If you like it, hit the button and I'll get started.`
      : status.admission === 'accepting'
        ? `Ask me to help build something or understand a Lumine project. I'll make a plan and get your okay before Lumine looks.`
        : `The workshop is full right now — but I'm still here to chat! Check back soon.`;

  return (
    <section
      aria-label={`${personaName} Build Workshop`}
      className={css`
        padding: 1rem 0;
        border-top: 1px solid var(--ui-border);
        border-bottom: 1px solid var(--ui-border);
        background: #fff;
        max-height: min(50vh, 40rem);
        overflow-y: auto;
        color: #333a4a;
        text-align: left;
        font-size: 1.15rem;
        line-height: 1.4;
      `}
    >
      <header
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.8rem;
        `}
      >
        <h3
          className={css`
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0;
            color: #333;
            font-size: 1.4rem;
            font-weight: 600;
          `}
        >
          <Icon icon="hammer" />
          Build Workshop
        </h3>
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            color: ${stateColor};
            font-weight: 700;
            white-space: nowrap;
          `}
        >
          <span
            aria-hidden="true"
            className={statusDotClass(stateColor, statusActive)}
          />
          {stateLabel}
        </span>
      </header>

      <div className={personaRowClass}>
        <img
          src={theme.avatar}
          alt={`${personaName} wearing a builder cap`}
          className={avatarClass(theme.accent)}
        />
        <div className={bubbleClass(theme.bubbleBg, theme.bubbleBorder)}>
          {bubbleText}
        </div>
      </div>

      {isIdle && status.admission === 'accepting' && sponsor ? (
        <p className={sponsorCreditClass}>
          <Icon icon="bolt" />
          <span>
            {`Free for you — ${sponsorName} is sharing their AI to power the workshop`}
          </span>
        </p>
      ) : null}

      {!isIdle && status.queue.people.length > 0 ? (
        <details className={detailsClass}>
          <summary>Who's in the workshop ({status.queue.count})</summary>
          <ol className={queueListClass}>
            {status.queue.people.map((person) => (
              <li key={person.jobId}>
                @{person.username || `user-${person.userId}`} —{' '}
                {person.state === 'queued'
                  ? 'waiting'
                  : `${person.jobKind === 'consultation' ? 'getting answers with' : 'building with'} ${
                      person.persona === 'ciel'
                        ? 'Ciel'
                        : person.persona === 'zero'
                          ? 'Zero'
                          : personaName
                    }`}
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      {status.job ? (
        <button
          type="button"
          disabled={action !== null}
          onClick={handleCancel}
          className={secondaryButtonClass}
        >
          {action === 'cancel'
            ? status.job.status === 'queued'
              ? 'Leaving queue…'
              : 'Stopping…'
            : status.job.status === 'queued'
              ? 'Leave queue'
              : 'Stop this job'}
        </button>
      ) : null}

      {relay && !status.job ? (
        <div className={consentPanelClass}>
          <strong>
            {relayIsConsultation
              ? `${personaName}'s question for Lumine`
              : `${personaName}'s plan for you`}
          </strong>
          <div className={relayClass}>
            <p>{relay.summary}</p>
            {relay.projectTitleHint ? (
              <p>
                <strong>Project:</strong> {relay.projectTitleHint}
              </p>
            ) : null}
            <p>
              <strong>Workspace:</strong>{' '}
              {relay.details?.projectIntent === 'new'
                ? 'New project · Main'
                : relay.details?.targetKind === 'main'
                  ? 'Main'
                  : relay.details?.targetTitle || 'Your branch'}
            </p>
            {relay.details?.requestedOutcome ? (
              <p>
                <strong>
                  {relayIsConsultation ? 'What I’ll find out:' : "What you'll get:"}
                </strong>{' '}
                {relay.details.requestedOutcome}
              </p>
            ) : null}
            {relay.details?.constraints?.length ? (
              <div>
                <strong>Keeping in mind:</strong>
                <ul>
                  {relay.details.constraints.map((constraint, index) => (
                    <li key={`${index}:${constraint}`}>{constraint}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {relay.details?.acceptanceCriteria?.length ? (
              <div>
                <strong>
                  {relayIsConsultation ? 'A helpful answer covers:' : 'Done means:'}
                </strong>
                <ul>
                  {relay.details.acceptanceCriteria.map((criterion, index) => (
                    <li key={`${index}:${criterion}`}>{criterion}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className={beforeConsentClass}>
            <strong>Before you say go</strong>
            <ul>
              <li>
                {relay.details?.sponsorProjectAccess === 'owner'
                  ? relay.details?.projectIntent === 'new'
                    ? `${sponsorName} will own this new project, so their normal project and Forum access will apply — never your private chats with ${personaName}.`
                    : `${sponsorName} owns this project, so their normal project and Forum access already continues — never your private chats with ${personaName}.`
                  : relay.details?.sponsorProjectAccess === 'team'
                    ? `${sponsorName} is already on this project's team, so their normal project and Forum access applies independently of this job — never your private chats with ${personaName}.`
                    : relay.details?.rootIsPublic === false
                      ? `This project isn't published. ${sponsorName} can inspect only the workspace named above for this job — never its Forum or your private chats with ${personaName}.`
                      : `${sponsorName} can inspect only the workspace named above for this job — never its Forum or your private chats with ${personaName}.`}
              </li>
              {!relayIsConsultation ? (
                <li>
                  A restore point is made before Lumine edits anything, and
                  publishing stays under the workspace owner's control.
                </li>
              ) : null}
              <li>
                Twinkle's safety reviewers can see the approved Workshop
                records.
              </li>
              <li>Your username shows in the workshop queue.</li>
            </ul>
            <details className={fullDetailsClass}>
              <summary>Full details</summary>
              <p>{status.consent.disclosure}</p>
            </details>
          </div>

          <label className={consentClass}>
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
            />
            <span>
              {relayIsConsultation
                ? `I understand what's shared, and I approve this question.`
                : `I understand what's shared, and I approve this plan.`}
            </span>
          </label>

          <button
            type="button"
            disabled={joiningDisabled}
            onClick={handleJoin}
            className={primaryButtonClass(theme.accent)}
          >
            {action === 'join'
              ? 'Starting…'
              : relayIsConsultation
                ? `Let ${personaName} ask Lumine`
                : `Start building with ${personaName}`}
          </button>
        </div>
      ) : null}

      {actionError ? <p className={errorClass}>{actionError}</p> : null}

      <Link
        to={status.sponsorGuidePath || '/sponsor'}
        className={guideLinkClass}
      >
        How the workshop works · what gets shared
      </Link>
    </section>
  );

  async function handleJoin() {
    if (!relay || joiningDisabled) return;
    actionInFlightRef.current = true;
    const requestId = ++statusRequestIdRef.current;
    setAction('join');
    setActionError('');
    try {
      const canonicalStatus = await createBuildWorkshopJob({
        persona,
        relayId: relay.id,
        dutySessionId: relay.dutySessionId,
        sponsorUserId: relay.sponsor.userId,
        buildId: Number(relay.details?.projectTargetBuildId || 0) || null,
        newProjectTitle:
          relay.details?.projectIntent === 'new'
            ? String(relay.projectTitleHint || '').trim()
            : null,
        consentVersion
      });
      if (requestId === statusRequestIdRef.current) {
        setStatus(canonicalStatus);
        setConsentAccepted(false);
      }
    } catch (error: any) {
      setActionError(
        error?.message || 'Something changed in the queue — try again.'
      );
    } finally {
      actionInFlightRef.current = false;
      setAction(null);
    }
  }

  async function handleCancel() {
    if (!status?.job) return;
    actionInFlightRef.current = true;
    const requestId = ++statusRequestIdRef.current;
    setAction('cancel');
    setActionError('');
    try {
      await cancelBuildWorkshopJob({ jobId: status.job.id });
      const canonicalStatus = await loadBuildWorkshopStatus({ persona });
      if (requestId === statusRequestIdRef.current) {
        setStatus(canonicalStatus);
      }
    } catch (error: any) {
      setActionError(
        error?.message || 'Something changed in the queue — try again.'
      );
    } finally {
      actionInFlightRef.current = false;
      setAction(null);
    }
  }
}

function workshopStateColor(state?: WorkshopStatus['agentState']) {
  if (state === 'build_working') return '#8d369f';
  if (state === 'build_available') return '#28962c';
  return '#626b7b';
}

function workshopStateLabel(state: WorkshopStatus['agentState']) {
  if (state === 'build_available') return 'Open';
  if (state === 'build_working') return 'Busy';
  return 'Closed';
}

function jobStatusText(job: NonNullable<WorkshopStatus['job']>) {
  const title = job.rootBuild.title || 'your project';
  const consultation = job.jobKind === 'consultation';
  if (!job.canProgress) {
    return `Lumine's connection dropped — your project is safe. We can wait for it to come back, or you can stop here.`;
  }
  if (job.status === 'queued') {
    return consultation
      ? `You're in line${job.queuePosition ? ` (#${job.queuePosition})` : ''}! I'll ask Lumine about ${title} as soon as it's our turn.`
      : `You're in line${job.queuePosition ? ` (#${job.queuePosition})` : ''}! Lumine will start on ${title} the moment it's your turn.`;
  }
  if (job.status === 'waiting_user') {
    return consultation
      ? `Lumine needs a little more from you about ${title} — message me when you're ready!`
      : `Lumine needs to hear back from you about ${title} — message me when you're ready!`;
  }
  return consultation
    ? `I'm talking with Lumine about ${title} right now!`
    : `I'm working with Lumine on ${title} right now!`;
}

const statusDotClass = (color: string, active: boolean) => css`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: ${color};
  box-shadow: 0 0 0 0.25rem ${color}22;
  flex: none;
  ${active
    ? // Color-neutral keyframes: the same name is safe to define from both
      // state colors because the body is identical.
      `animation: buildWorkshopDotPulse 2.4s ease-in-out infinite;
       @keyframes buildWorkshopDotPulse {
         0%, 100% { transform: scale(1); }
         50% { transform: scale(1.25); }
       }`
    : ''}
`;

const personaRowClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  margin-top: 1rem;
`;

const avatarClass = (accent: string) => css`
  width: 5.6rem;
  height: 5.6rem;
  flex: none;
  border-radius: 50%;
  border: 2px solid ${accent};
  object-fit: cover;
  user-select: none;
`;

const bubbleClass = (bg: string, border: string) => css`
  position: relative;
  flex: 1;
  min-width: 0;
  padding: 0.8rem 0.9rem;
  border: 1px solid ${border};
  border-radius: 0.9rem;
  border-top-left-radius: 0.25rem;
  background: ${bg};
  color: #3a4152;
  font-size: 1.15rem;
  &::before {
    content: '';
    position: absolute;
    top: 1.1rem;
    left: -0.55rem;
    border-top: 0.5rem solid transparent;
    border-bottom: 0.5rem solid transparent;
    border-right: 0.55rem solid ${border};
  }
  &::after {
    content: '';
    position: absolute;
    top: 1.15rem;
    left: -0.45rem;
    border-top: 0.45rem solid transparent;
    border-bottom: 0.45rem solid transparent;
    border-right: 0.5rem solid ${bg};
  }
`;

const sponsorCreditClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin: 0.8rem 0 0;
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  background: #fff8ec;
  color: #7a5c1f;
  font-size: 1.1rem;
  svg {
    margin-top: 0.25rem;
    color: #e5a83c;
    flex: none;
  }
`;

const detailsClass = css`
  margin-top: 0.8rem;
  summary {
    cursor: pointer;
    font-weight: 650;
  }
`;

const queueListClass = css`
  margin: 0.6rem 0 0;
  padding-left: 1.8rem;
  max-height: 10rem;
  overflow-y: auto;
`;

const consentPanelClass = css`
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--ui-border);
`;

const relayClass = css`
  margin: 0.5rem 0 0.8rem;
  padding: 0.7rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  max-height: 8rem;
  overflow-y: auto;
  overflow-wrap: anywhere;
  p {
    margin: 0;
  }
  p + p,
  p + div,
  div + div {
    margin-top: 0.6rem;
  }
  ul {
    margin: 0.35rem 0 0;
    padding-left: 1.6rem;
  }
`;

const beforeConsentClass = css`
  margin-top: 0.9rem;
  padding: 0.8rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  background: #fff;
  ul {
    margin: 0.55rem 0 0;
    padding-left: 1.6rem;
    font-size: 1.1rem;
  }
  li + li {
    margin-top: 0.45rem;
  }
`;

const fullDetailsClass = css`
  margin-top: 0.7rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--ui-border);
  summary {
    cursor: pointer;
    font-weight: 650;
  }
  p {
    margin: 0.6rem 0 0;
    color: #4b5363;
  }
`;

const consentClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-top: 0.9rem;
  color: #414958;
  input {
    margin-top: 0.2rem;
    flex: none;
  }
`;

const secondaryButtonClass = css`
  width: 100%;
  margin-top: 0.8rem;
  padding: 0.65rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  background: #fff;
  color: #4a5362;
  font: inherit;
  cursor: pointer;
  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }
`;

const primaryButtonClass = (color: string) => css`
  width: 100%;
  margin-top: 0.9rem;
  padding: 0.75rem;
  border: 1px solid ${color};
  border-radius: 0.5rem;
  background: ${color};
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const errorClass = css`
  margin: 0.7rem 0 0;
  color: #b32655;
`;

const guideLinkClass = css`
  display: inline-block;
  margin-top: 0.8rem;
  color: #556178;
  text-decoration: underline;
`;
