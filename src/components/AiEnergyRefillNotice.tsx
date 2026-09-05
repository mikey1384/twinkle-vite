import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import {
  formatAiEnergyRefillTime,
  getAiEnergyRefillTime,
  type AiEnergyDisplayPolicy
} from '~/helpers/aiEnergyDisplay';

export default function AiEnergyRefillNotice({
  energyPolicy,
  onRefresh,
  refreshing = false,
  refreshError,
  refreshLabel = 'Check balance'
}: {
  energyPolicy?: AiEnergyDisplayPolicy | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshError?: string;
  refreshLabel?: string;
}) {
  const refillTime = getAiEnergyRefillTime(energyPolicy);
  const [now, setNow] = useState(Date.now);
  const refillReached = refillTime !== null && now >= refillTime;

  useEffect(() => {
    // One wake-up at the boundary, plus foreground checks. No polling or
    // inferred balance updates when a tab crosses midnight UTC.
    let timer: ReturnType<typeof setTimeout> | undefined;
    updateTime();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    function updateTime() {
      clearTimeout(timer);
      const currentTime = Date.now();
      setNow(currentTime);
      if (refillTime !== null && refillTime > currentTime) {
        timer = setTimeout(
          updateTime,
          Math.min(refillTime - currentTime, 2_147_483_647)
        );
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') updateTime();
    }
  }, [refillTime]);

  return (
    <div className={noticeCls}>
      {refillTime !== null && (
        <div>
          {refillReached ? 'Scheduled refill: ' : 'Next daily refill: '}
          <time dateTime={new Date(refillTime).toISOString()}>
            {formatAiEnergyRefillTime(refillTime)}
          </time>{' '}
          (your time).
        </div>
      )}
      <div>Refills daily at 00:00 UTC.</div>
      {refillReached && (
        <div>
          Refill time has passed; this balance is from before the refill.{' '}
          {onRefresh && (
            <button
              type="button"
              className={refreshCls}
              disabled={refreshing}
              onClick={onRefresh}
            >
              {refreshing ? 'Checking…' : refreshLabel}
            </button>
          )}
        </div>
      )}
      {refreshError && <div role="alert">{refreshError}</div>}
    </div>
  );
}

const noticeCls = css`
  margin-top: 0.35rem;
  font-size: 1.1rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

const refreshCls = css`
  appearance: none;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;

  &:disabled {
    cursor: wait;
  }
`;
