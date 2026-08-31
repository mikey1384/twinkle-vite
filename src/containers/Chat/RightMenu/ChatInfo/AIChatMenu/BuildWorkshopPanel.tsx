import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';

type WorkshopPersona = 'zero' | 'ciel';

interface WorkshopStatus {
  featureVisible: boolean;
  persona: WorkshopPersona;
  agentState: 'build_available' | 'build_working' | 'chat_only';
  sponsorGuidePath?: string;
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

  return (
    <section
      aria-label="Build Workshop status"
      className={css`
        padding: 0.9rem 0;
        border-top: 1px solid var(--ui-border);
        border-bottom: 1px solid var(--ui-border);
        background: #fff;
        color: #333;
        font-size: 1.1rem;
      `}
    >
      <div
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
      </div>
    </section>
  );
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
