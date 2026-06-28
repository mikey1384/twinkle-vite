import React, { useEffect, useMemo, useState } from 'react';
import Loading from '~/components/Loading';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import MetricCard from '../../MetricCard';
import {
  actionsClass,
  emptyStateClass,
  panelClass,
  rangeClass,
  summaryGridClass
} from '../../AiCosts/styles';
import {
  computeRange,
  DEFAULT_PRESET_INDEX,
  Granularity,
  RANGE_PRESETS
} from '../range';
import ActiveUsersChart from './ActiveUsersChart';
import CohortLeaderboard from './CohortLeaderboard';
import GrowthPanel from './GrowthPanel';

export interface CohortAnalytics {
  range: { start: number; end: number; granularity: Granularity };
  cohortSize: number;
  activeOverTime: Array<{
    bucket: string;
    activeUsers: number;
    buildActiveUsers: number;
    dailyTaskActiveUsers: number;
  }>;
  summary: {
    activeThisPeriod: number;
    activePrevPeriod: number;
    deltaPct: number;
    buildEngaged: number;
    dailyTaskEngaged: number;
  };
  leaderboard: Array<{
    userId: number;
    username: string;
    realName: string | null;
    twinkleXP: number;
    twinkleCoins: number;
    buildSaves: number;
    dailyTasksCompleted: number;
    activeDays: number;
    engagementScore: number;
  }>;
  growing: Array<{ userId: number; username: string; deltaActiveDays: number }>;
  dormant: Array<{ userId: number; username: string; lastActive: number }>;
}

export default function Overview() {
  const [presetIndex, setPresetIndex] = useState(DEFAULT_PRESET_INDEX);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<CohortAnalytics | null>(null);
  const loadNotableUsersAnalytics = useAppContext(
    (v) => v.requestHelpers.loadNotableUsersAnalytics
  );

  const preset = RANGE_PRESETS[presetIndex];

  useEffect(() => {
    let canceled = false;
    void load();

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await loadNotableUsersAnalytics(computeRange(preset));
        if (canceled) return;
        setAnalytics(data);
      } catch (loadError: any) {
        if (canceled) return;
        setError(loadError?.message || 'Failed to load analytics');
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetIndex, reloadKey]);

  const deltaLabel = useMemo(() => {
    if (!analytics) return '';
    const pct = analytics.summary.deltaPct;
    const sign = pct > 0 ? '+' : '';
    return `${sign}${Math.round(pct)}% vs prev (${analytics.summary.activePrevPeriod})`;
  }, [analytics]);

  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>Cohort Engagement</h2>
          {analytics ? (
            <span>{analytics.cohortSize} notable users tracked</span>
          ) : null}
        </div>
        <div className={actionsClass}>
          <div className={rangeClass}>
            {RANGE_PRESETS.map((option, index) => (
              <button
                key={option.label}
                className={presetIndex === index ? 'active' : ''}
                onClick={() => setPresetIndex(index)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div>
        {loading ? <Loading /> : null}

        {!loading && error ? (
          <div className={emptyStateClass}>
            <div>{error}</div>
            <Button
              color="logoBlue"
              variant="soft"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Try Again
            </Button>
          </div>
        ) : null}

        {!loading && !error && analytics ? (
          <>
            <section className={summaryGridClass}>
              <MetricCard
                label="Active notable users"
                value={`${analytics.summary.activeThisPeriod} / ${analytics.cohortSize}`}
                detail={deltaLabel}
                color={analytics.summary.deltaPct < 0 ? 'rose' : 'green'}
              />
              <MetricCard
                label="Engaged Build"
                value={String(analytics.summary.buildEngaged)}
                detail="created a Build save"
                color="logoBlue"
              />
              <MetricCard
                label="Engaged daily tasks"
                value={String(analytics.summary.dailyTaskEngaged)}
                detail="completed a daily task"
                color="orange"
              />
              <MetricCard
                label="Cohort size"
                value={String(analytics.cohortSize)}
                detail="notable users"
                color="darkBlue"
              />
            </section>

            <div style={{ padding: '0 1.6rem 1.6rem' }}>
              <ActiveUsersChart data={analytics.activeOverTime} />
            </div>

            <CohortLeaderboard rows={analytics.leaderboard} />

            <GrowthPanel growing={analytics.growing} dormant={analytics.dormant} />
          </>
        ) : null}
      </div>
    </section>
  );
}
