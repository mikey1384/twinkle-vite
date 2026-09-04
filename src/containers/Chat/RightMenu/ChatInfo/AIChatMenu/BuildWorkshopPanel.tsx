import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import cielBuilder from '~/assets/ciel-builder.png';
import zeroBuilder from '~/assets/zero-builder.png';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';

type WorkshopPersona = 'zero' | 'ciel';

interface WorkshopStatus {
  featureVisible: boolean;
  persona: WorkshopPersona;
  agentState: 'build_available' | 'build_working' | 'chat_only';
  admission: 'accepting' | 'full' | 'paused' | 'limited' | 'busy';
  // Set when this user's one Workshop seat is taken by a job that runs
  // through the other assistant.
  requesterBusyWith?: 'zero' | 'ciel' | null;
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
    // Lumine's latest unanswered question for this user, if any.
    openQuestion?: { message: string } | null;
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
          console.error('Failed to load Lumine Workshop status:', error);
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
  const stateLabelColor = workshopStateLabelColor(status.agentState);
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
  const otherAssistant = status.requesterBusyWith === 'ciel' ? 'Ciel' : 'Zero';
  const othersWorking = !hasJob && status.agentState === 'build_working';
  const bubbleText = hasJob
    ? status.job?.openQuestion
      ? `Lumine has a question for you about this job — I've put it in our chat. Answer there and I'll pass it along.`
      : `I'm with Lumine on this one — I'll keep you posted right here in our chat!`
    : status.requesterBusyWith
      ? `You're already building with ${otherAssistant} right now. Lumine can take one project of yours at a time, so I'll be able to start yours as soon as that one wraps up — still here to chat in the meantime!`
      : accepting
        ? othersWorking
          ? `Lumine is busy with someone else's project right now, but tell me what you need — I'll make a plan, get your okay, and put it next in line.`
          : `Ask me to help build something or understand a Lumine project. I'll make a plan and get your okay before Lumine looks.`
        : status.admission === 'paused'
          ? `The workshop is closed right now — but I'm still here to chat! Check back soon.`
          : status.admission === 'limited'
            ? `Lumine has used up today's builds — but I'm still here to chat! Check back tomorrow.`
            : `The workshop's queue is full right now — but I'm still here to chat! Check back soon.`;

  return (
    <section
      aria-label={`${personaName} Lumine Workshop`}
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
          aria-label="Learn how the Lumine Workshop works"
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
          <span>Lumine Workshop</span>
        </Link>
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            flex: none;
            color: ${stateLabelColor};
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
            {Number(sponsor.userId) === Number(userId)
              ? `You're powering the workshop with your own AI`
              : `Free for you — ${sponsorName} is sharing their AI to power the workshop`}
          </span>
        </p>
      ) : null}

      {(hasJob || status.requesterBusyWith) && queuePeople.length > 0 ? (
        <details className={detailsClass}>
          <summary>Who's in the workshop ({queuePeople.length})</summary>
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

// The dot matches the chat status circle (busy = the same red the presence
// tag uses); the label uses a darker red so 1rem text keeps 4.5:1 on white.
function workshopStateColor(state?: WorkshopStatus['agentState']) {
  if (state === 'build_working') return Color.red();
  // Open uses the confirmed 5db43526a hue, darkened just enough for the
  // 1rem label to keep 4.5:1 contrast on white.
  if (state === 'build_available') return '#1e7f24';
  return '#626b7b';
}

function workshopStateLabelColor(state?: WorkshopStatus['agentState']) {
  if (state === 'build_working') return '#c62d1f';
  return workshopStateColor(state);
}

function workshopStateLabel(state: WorkshopStatus['agentState']) {
  if (state === 'build_available') return 'Open';
  if (state === 'build_working') return 'Busy';
  return 'Closed';
}

// Same beacon as the chat presence dot (StatusTag): a solid colour inside a
// white ring with a faint halo of the same colour outside it.
const statusDotClass = (color: string, active: boolean) => css`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: ${color};
  border: 2px solid #fff;
  box-sizing: border-box;
  box-shadow: 0 0 0 1.5px color-mix(in srgb, ${color} 45%, transparent);
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
