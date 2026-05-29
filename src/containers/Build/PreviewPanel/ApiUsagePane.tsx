import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';

interface ApiUsagePaneProps {
  buildId: number;
  isOwner: boolean;
}

interface ApiUsageBucketRow {
  bucket: string;
  rateLimitKind: string;
  requestCount: number;
  limitedCount: number;
  lastAt: number;
}

interface ApiUsageRouteRow extends ApiUsageBucketRow {
  method: string;
  routeKey: string;
  maxStatusCode: number;
}

interface ApiUsageResponse {
  minutes: number;
  generatedAt: number;
  totals: {
    requestCount: number;
    limitedCount: number;
  };
  buckets: ApiUsageBucketRow[];
  routes: ApiUsageRouteRow[];
}

export default function ApiUsagePane({ buildId, isOwner }: ApiUsagePaneProps) {
  const loadBuildApiUsage = useAppContext(
    (v) => v.requestHelpers.loadBuildApiUsage
  );
  const loadBuildApiUsageRef = useRef(loadBuildApiUsage);
  const [usage, setUsage] = useState<ApiUsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    loadBuildApiUsageRef.current = loadBuildApiUsage;
  });

  useEffect(() => {
    if (!isOwner || !buildId) return;
    let cancelled = false;

    async function loadUsage() {
      setLoading(true);
      setError('');
      try {
        const payload = await loadBuildApiUsageRef.current({
          buildId,
          minutes: 60
        });
        if (cancelled) return;
        setUsage(payload || null);
      } catch (err: any) {
        if (cancelled) return;
        setError(String(err?.message || err || 'Failed to load API usage'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUsage();

    return () => {
      cancelled = true;
    };
  }, [buildId, isOwner, refreshCount]);

  const buckets = usage?.buckets || [];
  const routes = usage?.routes || [];
  const totals = usage?.totals || { requestCount: 0, limitedCount: 0 };

  function handleRefresh() {
    setRefreshCount((count) => count + 1);
  }

  return (
    <div className={paneClass}>
      <header className={headerClass}>
        <div>
          <h2 className={titleClass}>API usage</h2>
          <div className={subheadClass}>
            {usage ? `${usage.minutes} min window` : '60 min window'}
            {usage?.generatedAt ? ` · ${formatTime(usage.generatedAt)}` : ''}
          </div>
        </div>
        <GameCTAButton
          variant="purple"
          size="md"
          icon="sync"
          disabled={loading}
          onClick={handleRefresh}
        >
          Refresh
        </GameCTAButton>
      </header>

      <section className={metricsClass} aria-label="API usage totals">
        <div className={metricClass}>
          <span>Requests</span>
          <strong>{formatNumber(totals.requestCount)}</strong>
        </div>
        <div className={metricClass}>
          <span>Rate limited</span>
          <strong>{formatNumber(totals.limitedCount)}</strong>
        </div>
        <div className={metricClass}>
          <span>Buckets</span>
          <strong>{formatNumber(buckets.length)}</strong>
        </div>
      </section>

      {error ? (
        <div className={stateClass} role="alert">
          {error}
        </div>
      ) : loading && !usage ? (
        <div className={stateClass}>Loading API usage...</div>
      ) : (
        <div className={contentClass}>
          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>Buckets</h3>
            {buckets.length ? (
              <div className={bucketGridClass}>
                {buckets.map((bucket) => (
                  <div
                    className={bucketClass}
                    key={`${bucket.bucket}:${bucket.rateLimitKind}`}
                  >
                    <div className={bucketTopClass}>
                      <Icon icon="chart-line" />
                      <span>{bucket.rateLimitKind}</span>
                    </div>
                    <strong>{bucket.bucket}</strong>
                    <div className={bucketStatsClass}>
                      <span>{formatNumber(bucket.requestCount)} calls</span>
                      <span>{formatNumber(bucket.limitedCount)} limited</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={stateClass}>No API traffic in this window.</div>
            )}
          </section>

          <section className={sectionClass}>
            <h3 className={sectionTitleClass}>Routes</h3>
            {routes.length ? (
              <div className={tableWrapClass}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Bucket</th>
                      <th>Calls</th>
                      <th>Limited</th>
                      <th>Max status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route) => (
                      <tr
                        key={`${route.method}:${route.routeKey}:${route.bucket}`}
                      >
                        <td>
                          <span className={methodClass}>{route.method}</span>
                          <span className={routeClass}>{route.routeKey}</span>
                        </td>
                        <td>{route.bucket}</td>
                        <td>{formatNumber(route.requestCount)}</td>
                        <td>{formatNumber(route.limitedCount)}</td>
                        <td>{route.maxStatusCode || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={stateClass}>No route traffic in this window.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(Math.max(0, Number(value || 0)));
}

function formatTime(value: number) {
  const timestamp = Math.max(0, Number(value || 0));
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

const paneClass = css`
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto 1fr;
  background: #fff;
  color: var(--chat-text);
  overflow: hidden;
`;

const headerClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.35rem 1rem;
  border-bottom: 1px solid var(--ui-border);

  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const titleClass = css`
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.15;
  font-weight: 900;
`;

const subheadClass = css`
  margin-top: 0.25rem;
  font-size: 1rem;
  color: var(--ui-text-muted);
`;

const metricsClass = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  padding: 1rem 1.35rem;
  border-bottom: 1px solid var(--ui-border);

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const metricClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.9rem 1rem;
  display: grid;
  gap: 0.35rem;
  min-width: 0;

  span {
    font-size: 1rem;
    color: var(--ui-text-muted);
    font-weight: 800;
  }

  strong {
    font-size: 1.45rem;
    line-height: 1;
  }
`;

const contentClass = css`
  min-height: 0;
  overflow: auto;
  padding: 1.2rem 1.35rem 1.5rem;
  display: grid;
  align-content: start;
  gap: 1.35rem;
`;

const sectionClass = css`
  display: grid;
  gap: 0.8rem;
`;

const sectionTitleClass = css`
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.2;
  font-weight: 900;
`;

const bucketGridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.75rem;
`;

const bucketClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.9rem;
  display: grid;
  gap: 0.55rem;
  min-width: 0;

  strong {
    font-size: 1.1rem;
    word-break: break-word;
  }
`;

const bucketTopClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--ui-text-muted);
  font-size: 1rem;
  font-weight: 800;
`;

const bucketStatsClass = css`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 1rem;
  color: var(--ui-text-muted);
  font-weight: 800;
`;

const tableWrapClass = css`
  overflow: auto;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
`;

const tableClass = css`
  width: 100%;
  border-collapse: collapse;
  min-width: 44rem;
  font-size: 1.1rem;

  th,
  td {
    padding: 0.85rem 0.9rem;
    border-bottom: 1px solid var(--ui-border);
    text-align: left;
    vertical-align: top;
  }

  th {
    font-size: 1rem;
    color: var(--ui-text-muted);
    font-weight: 900;
  }

  tr:last-child td {
    border-bottom: 0;
  }
`;

const methodClass = css`
  display: inline-block;
  min-width: 3.8rem;
  margin-right: 0.65rem;
  font-weight: 900;
`;

const routeClass = css`
  word-break: break-word;
`;

const stateClass = css`
  padding: 1.2rem 1.35rem;
  font-size: 1.1rem;
  color: var(--ui-text-muted);
`;
