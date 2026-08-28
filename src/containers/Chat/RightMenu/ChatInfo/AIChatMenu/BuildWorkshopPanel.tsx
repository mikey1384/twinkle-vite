import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
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
    () => workshopStateColor(persona, status?.agentState),
    [persona, status?.agentState]
  );

  if (!status?.featureVisible) return null;
  if (status.persona !== persona) return null;

  const consentVersion = status.consent.version;
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
        margin: 1rem 0 0;
        padding: 1rem;
        border: 1px solid ${stateColor}55;
        border-radius: 0.8rem;
        background: ${isCielChat ? '#fbf9ff' : '#f7fcff'};
        max-height: min(60vh, 46rem);
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
        <strong
          className={css`
            font-size: 1.3rem;
            color: #252a38;
          `}
        >
          Build Workshop
        </strong>
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
          {status.statusLabel}
        </span>
      </header>

      <p className={compactParagraph}>
        {status.job
          ? jobStatusText(status.job, personaName)
          : status.admission === 'accepting'
            ? `Tell ${personaName} what you want to build in chat. ${personaName} will prepare a private relay before you join.`
            : `${personaName} can still chat, but sponsored Build work is not accepting another job right now.`}
      </p>

      {sponsor ? (
        <p className={disclosureClass}>
          Sponsored by <strong>{sponsorName}</strong>. Only relays covered by
          your Workshop consent, this Build branch, and its scoped Forum are
          shared—not your raw chat. Twinkle’s integrity reviewer may inspect
          that same scoped handoff evidence.
        </p>
      ) : null}

      {status.queue.people.length > 0 ? (
        <details className={detailsClass}>
          <summary>
            Queue: {status.queue.count} waiting ·{' '}
            {
              status.queue.people.filter((person) => person.state !== 'queued')
                .length
            }{' '}
            in progress
          </summary>
          <ol className={queueListClass}>
            {status.queue.people.map((person) => (
              <li key={person.jobId}>
                @{person.username || `user-${person.userId}`} —{' '}
                {person.state === 'queued' ? 'waiting' : person.state}
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
              : 'Ending Workshop job…'
            : status.job.status === 'queued'
              ? 'Leave queue'
              : 'End Workshop job'}
        </button>
      ) : null}

      {relay && !status.job ? (
        <div className={consentPanelClass}>
          <strong>{personaName}’s relay</strong>
          <div className={relayClass}>
            <p>{relay.summary}</p>
            {relay.projectTitleHint ? (
              <p>
                <strong>Project hint:</strong> {relay.projectTitleHint}
              </p>
            ) : null}
            {relay.details?.requestedOutcome ? (
              <p>
                <strong>Requested outcome:</strong>{' '}
                {relay.details.requestedOutcome}
              </p>
            ) : null}
            {relay.details?.constraints?.length ? (
              <div>
                <strong>Constraints:</strong>
                <ul>
                  {relay.details.constraints.map((constraint, index) => (
                    <li key={`${index}:${constraint}`}>{constraint}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {relay.details?.acceptanceCriteria?.length ? (
              <div>
                <strong>Acceptance criteria:</strong>
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
              Project
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
              New project name
              <input
                value={newProjectTitle}
                maxLength={200}
                onChange={(event) => setNewProjectTitle(event.target.value)}
                className={inputClass}
              />
            </label>
          ) : null}

          <label className={consentClass}>
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
            />
            <span>I approve this relay. {status.consent.disclosure}</span>
          </label>

          <button
            type="button"
            disabled={joiningDisabled}
            onClick={handleJoin}
            className={primaryButtonClass(stateColor)}
          >
            {action === 'join' ? 'Joining…' : 'Join Workshop queue'}
          </button>
        </div>
      ) : null}

      {actionError ? <p className={errorClass}>{actionError}</p> : null}

      <Link
        to={status.sponsorGuidePath || '/sponsor'}
        className={guideLinkClass}
      >
        How sponsorship and applications work
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
        error?.message || 'The Workshop queue changed. Try again.'
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
        error?.message || 'The queue changed. Refresh and try again.'
      );
    } finally {
      actionInFlightRef.current = false;
      setAction(null);
    }
  }
}

function workshopStateColor(
  persona: WorkshopPersona,
  state?: WorkshopStatus['agentState']
) {
  if (persona === 'ciel') {
    if (state === 'build_working') return '#9c2fb2';
    if (state === 'build_available') return '#6748c7';
    return '#6e607f';
  }
  if (state === 'build_working') return '#1f63c5';
  if (state === 'build_available') return '#087e98';
  return '#5d7085';
}

function jobStatusText(
  job: NonNullable<WorkshopStatus['job']>,
  personaName: string
) {
  if (!job.canProgress) {
    return `The sponsor connection is interrupted. Your project and contribution branch are safe; you can leave this job or wait for duty to resume.`;
  }
  if (job.status === 'queued') {
    return `You’re${job.queuePosition ? ` #${job.queuePosition}` : ''} in the queue for ${job.rootBuild.title || 'your project'}.`;
  }
  if (job.status === 'waiting_user') {
    return `${personaName} is waiting for your next message about ${job.rootBuild.title || 'this project'}.`;
  }
  return `${personaName} is working on contribution branch #${job.contributionBuild.branchNumber || job.contributionBuild.id} for ${job.rootBuild.title || 'your project'}.`;
}

const compactParagraph = css`
  margin: 0.8rem 0 0;
`;

const disclosureClass = css`
  margin: 0.8rem 0 0;
  padding: 0.7rem;
  border-left: 0.3rem solid #7c8799;
  background: #fff;
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
  border-radius: 0.45rem;
  background: #fff;
  color: #252a38;
  padding: 0.65rem;
  font: inherit;
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
  border: 1px solid #8b95a5;
  border-radius: 0.5rem;
  background: #fff;
  color: #4a5362;
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
