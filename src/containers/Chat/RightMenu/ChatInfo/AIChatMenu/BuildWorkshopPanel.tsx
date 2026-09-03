import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import cielBuilder from '~/assets/ciel-builder.png';
import zeroBuilder from '~/assets/zero-builder.png';
import { useAppContext, useKeyContext } from '~/contexts';

type WorkshopPersona = 'zero' | 'ciel';

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
  } | null;
  sponsorGuidePath?: string;
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
  const [status, setStatus] = useState<WorkshopStatus | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!userId || !channelId) {
      setStatus(null);
      return;
    }
    let disposed = false;
    let inFlight = false;
    requestIdRef.current += 1;

    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      const requestId = ++requestIdRef.current;
      try {
        const canonicalStatus = await loadBuildWorkshopStatus({ persona });
        if (!disposed && requestId === requestIdRef.current) {
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
      requestIdRef.current += 1;
      window.clearInterval(interval);
    };
    // Context request helpers are stable and intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, persona, userId]);

  if (!status?.featureVisible) return null;
  if (status.persona !== persona) return null;

  const stateColor = workshopStateColor(status.agentState);
  const stateLabel = workshopStateLabel(status.agentState);
  const statusActive = status.agentState !== 'chat_only';
  const hasJob = Boolean(status.job);
  const accepting = status.admission === 'accepting';
  const sponsor = status.sponsor || null;
  const sponsorName = sponsor?.username
    ? `@${sponsor.username}`
    : sponsor?.userId
      ? `sponsor #${sponsor.userId}`
      : 'the named sponsor';
  const queuePeople = status.queue?.people || [];

  // Live job progress is narrated in the chat itself (the "Using Lumine..."
  // indicator and the persona's own messages), so the bubble stays an
  // invitation and never mirrors job state.
  const bubbleText = hasJob
    ? `I'm with Lumine on this one — I'll keep you posted right here in our chat!`
    : accepting
      ? `Ask me to help build something or understand a Lumine project. I'll make a plan and get your okay before Lumine looks.`
      : status.admission === 'paused'
        ? `The workshop is closed right now — but I'm still here to chat! Check back soon.`
        : `The workshop is full right now — but I'm still here to chat! Check back soon.`;

  return (
    <section
      aria-label={`${personaName} Build Workshop`}
      className={css`
        padding: 1rem 0;
        border-top: 1px solid var(--ui-border);
        border-bottom: 1px solid var(--ui-border);
        background: #fff;
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
          min-width: 0;
        `}
      >
        <Link
          to={status.sponsorGuidePath || '/sponsor'}
          aria-label="Learn how the Build Workshop works"
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            min-width: 0;
            color: #333;
            font-size: 1.4rem;
            font-weight: 600;
            white-space: nowrap;
            text-decoration: none;
            &:hover {
              text-decoration: underline;
            }
          `}
        >
          <Icon icon="hammer" />
          <span>Build Workshop</span>
        </Link>
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            flex: none;
            color: ${stateColor};
            font-size: 1rem;
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

      {!hasJob && accepting && sponsor ? (
        <p className={sponsorCreditClass}>
          <Icon icon="bolt" />
          <span>
            {`Free for you — ${sponsorName} is sharing their AI to power the workshop`}
          </span>
        </p>
      ) : null}

      {hasJob && queuePeople.length > 0 ? (
        <details className={detailsClass}>
          <summary>Who's in the workshop ({status.queue.count})</summary>
          <ol className={queueListClass}>
            {queuePeople.map((person) => (
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
    </section>
  );
}

function workshopStateColor(state?: WorkshopStatus['agentState']) {
  if (state === 'build_working') return '#8d369f';
  // Open is green (5db43526a); the staging refactor had reverted it to navy.
  if (state === 'build_available') return '#28962c';
  return '#626b7b';
}

function workshopStateLabel(state: WorkshopStatus['agentState']) {
  if (state === 'build_available') return 'Open';
  if (state === 'build_working') return 'Busy';
  return 'Closed';
}

const statusDotClass = (color: string, active: boolean) => css`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: ${color};
  box-shadow: 0 0 0 0.25rem ${color}22;
  flex: none;
  ${active
    ? `animation: buildWorkshopDotPulse 2.4s ease-in-out infinite;
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
