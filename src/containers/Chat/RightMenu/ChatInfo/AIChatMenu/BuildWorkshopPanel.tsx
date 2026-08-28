import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';

type WorkshopPersona = 'zero' | 'ciel';

interface WorkshopRelay {
  id: number;
  dutySessionId: number;
  summary: string;
  projectTitleHint?: string | null;
  details?: {
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
  statusLabel: string;
  admission: 'accepting' | 'full' | 'paused' | 'limited';
  sponsor?: {
    userId: number;
    username?: string | null;
  } | null;
  duty?: {
    id: number;
    queuedCount: number;
    inProgressCount: number;
  } | null;
  queue: {
    count: number;
    position?: number | null;
    people: Array<{
      jobId: number;
      userId: number;
      username: string;
      persona: WorkshopPersona | null;
      state: 'queued' | 'working' | 'waiting';
    }>;
  };
  job?: {
    id: number;
    status: 'queued' | 'leased' | 'working' | 'waiting_user';
    queuePosition?: number | null;
    rootBuild: { id: number; title?: string | null };
    contributionBuild: {
      id: number;
      title?: string | null;
      branchNumber?: number | null;
    };
    canProgress: boolean;
  } | null;
  pendingRelays: WorkshopRelay[];
  builds: Array<{ id: number; title: string }>;
  consent: {
    version: string;
    disclosure: string;
  };
  sponsorGuidePath: string;
}

const STATUS_REFRESH_MS = 5_000;

export default function BuildWorkshopPanel({
  channelId,
  isCielChat
}: {
  channelId: number;
  isCielChat: boolean;
}) {
  const persona: WorkshopPersona = isCielChat ? 'ciel' : 'zero';
  const personaName = isCielChat ? 'Ciel' : 'Zero';
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
  const [projectMode, setProjectMode] = useState<'existing' | 'new'>('new');
  const [selectedBuildId, setSelectedBuildId] = useState(0);
  const [newProjectTitle, setNewProjectTitle] = useState('');
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
    const firstBuildId = Number(status?.builds?.[0]?.id || 0);
    setProjectMode(firstBuildId ? 'existing' : 'new');
    setSelectedBuildId(firstBuildId);
    setNewProjectTitle(String(relay?.projectTitleHint || ''));
    setConsentAccepted(false);
    setActionError('');
  }, [relay?.id, relay?.projectTitleHint, status?.builds]);

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
  const isIdle = !status.job && !relay;
  const joiningDisabled =
    action !== null ||
    !relay ||
    status.admission !== 'accepting' ||
    !consentAccepted ||
    (projectMode === 'existing'
      ? selectedBuildId <= 0
      : !newProjectTitle.trim());

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
            className={css`
              width: 0.8rem;
              height: 0.8rem;
              border-radius: 50%;
              background: ${stateColor};
              box-shadow: 0 0 0 0.25rem ${stateColor}22;
              flex: none;
            `}
          />
          {stateLabel}
        </span>
      </header>

      {status.job ? (
        <p className={compactParagraph}>
          {jobStatusText(status.job, personaName)}
        </p>
      ) : isIdle ? (
        <p className={compactParagraph}>
          {status.admission === 'accepting'
            ? `Want ${personaName} to build something with you? Describe your idea right here in chat — a game, an app, anything. ${personaName} will draw up a plan and ask for your go-ahead before starting.`
            : `The workshop is full right now — you can still chat with ${personaName} as usual. Check back soon!`}
        </p>
      ) : null}

      {isIdle && status.admission === 'accepting' && sponsor ? (
        <p className={sponsorCreditClass(isCielChat)}>
          {`Free for you — ${sponsorName} is sharing their AI to power the workshop.`}
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
                  : `building with ${
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
          <strong>{`${personaName}'s plan for you`}</strong>
          <div className={relayClass}>
            <p>{relay.summary}</p>
            {relay.projectTitleHint ? (
              <p>
                <strong>Project:</strong> {relay.projectTitleHint}
              </p>
            ) : null}
            {relay.details?.requestedOutcome ? (
              <p>
                <strong>What you'll get:</strong>{' '}
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
                <strong>Done means:</strong>
                <ul>
                  {relay.details.acceptanceCriteria.map((criterion, index) => (
                    <li key={`${index}:${criterion}`}>{criterion}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {status.builds.length > 0 ? (
            <label className={fieldClass}>
              Which project?
              <select
                value={projectMode === 'new' ? 'new' : String(selectedBuildId)}
                onChange={(event) => {
                  const value = event.target.value;
                  setProjectMode(value === 'new' ? 'new' : 'existing');
                  if (value !== 'new') setSelectedBuildId(Number(value));
                }}
                className={inputClass}
              >
                {status.builds.map((build) => (
                  <option key={build.id} value={build.id}>
                    {build.title}
                  </option>
                ))}
                <option value="new">Create a new project</option>
              </select>
            </label>
          ) : null}

          {projectMode === 'new' ? (
            <label className={fieldClass}>
              Name your new project
              <input
                value={newProjectTitle}
                maxLength={200}
                onChange={(event) => setNewProjectTitle(event.target.value)}
                className={inputClass}
              />
            </label>
          ) : null}

          <div className={beforeConsentClass}>
            <strong>Before you say go</strong>
            <ul>
              <li>
                {`${sponsorName} can see this project, the plan you approve, and its forum — never your private chats with ${personaName}.`}
              </li>
              <li>Twinkle's safety reviewers can see the same things.</li>
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
            <span>I understand what's shared, and I approve this plan.</span>
          </label>

          <button
            type="button"
            disabled={joiningDisabled}
            onClick={handleJoin}
            className={primaryButtonClass(stateColor)}
          >
            {action === 'join'
              ? 'Starting…'
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
        buildId: projectMode === 'existing' ? selectedBuildId : null,
        newProjectTitle: projectMode === 'new' ? newProjectTitle.trim() : null,
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
  if (state === 'build_available') return '#4c55b5';
  return '#626b7b';
}

function workshopStateLabel(state: WorkshopStatus['agentState']) {
  if (state === 'build_available') return 'Open';
  if (state === 'build_working') return 'Busy';
  return 'Closed';
}

function jobStatusText(
  job: NonNullable<WorkshopStatus['job']>,
  personaName: string
) {
  const title = job.rootBuild.title || 'your project';
  if (!job.canProgress) {
    return `The sponsor's connection dropped. Your project is safe — you can wait for it to come back, or leave the job.`;
  }
  if (job.status === 'queued') {
    return `You're in line${job.queuePosition ? ` (#${job.queuePosition})` : ''} for ${title}. ${personaName} will start as soon as it's your turn.`;
  }
  if (job.status === 'waiting_user') {
    return `${personaName} is waiting to hear back from you about ${title}.`;
  }
  return `${personaName} is building ${title} right now.`;
}

const compactParagraph = css`
  margin: 0.8rem 0 0;
`;

const sponsorCreditClass = (isCielChat: boolean) => css`
  margin: 0.8rem 0 0;
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  background: ${isCielChat ? '#f5f3ff' : '#f0f7ff'};
  color: #4b5363;
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

const fieldClass = css`
  display: grid;
  gap: 0.35rem;
  margin-top: 0.7rem;
  font-weight: 650;
`;

const inputClass = css`
  width: 100%;
  min-width: 0;
  border: 1px solid #bbc2cf;
  border-radius: 0.5rem;
  background: #fff;
  color: #252a38;
  padding: 0.65rem;
  font: inherit;
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
