import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import { ADMIN_MANAGEMENT_LEVEL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import MetricCard from '../../MetricCard';
import { formatNumber, formatTime } from '../../AiCosts/helpers/formatters';
import {
  actionsClass,
  emptyStateClass,
  panelClass,
  rangeClass,
  subsectionHeaderClass,
  summaryGridClass
} from '../../AiCosts/styles';
import TimeSeriesChart from '../charts/TimeSeriesChart';
import { computeRange, DEFAULT_PRESET_INDEX, RANGE_PRESETS } from '../range';
import CategoryBreakdown from './CategoryBreakdown';

interface TimePoint {
  bucket: string;
  value: number;
}

interface UserDrilldown {
  range: { start: number; end: number; granularity: string };
  user: {
    userId: number;
    username: string;
    realName: string | null;
    twinkleXP: number;
    twinkleCoins: number;
    createdAt: number;
    currentStreak: number;
    longestStreak: number;
  } | null;
  xpOverTime: TimePoint[];
  coinsOverTime: TimePoint[];
  categoryBreakdown: Array<{ category: string; total: number }>;
  buildOverTime: TimePoint[];
  dailyTask: {
    completionOverTime: TimePoint[];
    currentStreak: number;
    longestStreak: number;
    activeDaysTotal: number;
  };
  activeDaysOverTime: TimePoint[];
}

export default function UserDetail() {
  const { userId: userIdParam } = useParams();
  const userId = Number(userIdParam);
  const [presetIndex, setPresetIndex] = useState(DEFAULT_PRESET_INDEX);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<UserDrilldown | null>(null);
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const loadNotableUserAnalytics = useAppContext(
    (v) => v.requestHelpers.loadNotableUserAnalytics
  );
  const canView = managementLevel >= ADMIN_MANAGEMENT_LEVEL;
  const preset = RANGE_PRESETS[presetIndex];

  useEffect(() => {
    if (!canView || !Number.isInteger(userId) || userId <= 0) return;
    let canceled = false;
    void load();

    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = await loadNotableUserAnalytics({
          userId,
          ...computeRange(preset)
        });
        if (canceled) return;
        setData(result);
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
  }, [canView, userId, presetIndex, reloadKey]);

  if (!canView) {
    return (
      <InvalidPage
        title="Admin only"
        text="Notable Users is only available to admins."
      />
    );
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    return (
      <InvalidPage
        title="Invalid user"
        text="That is not a valid notable user."
      />
    );
  }

  const user = data?.user;

  return (
    <ErrorBoundary componentPath="Management/NotableUsers/UserDetail">
      <div
        className={css`
          margin-bottom: 1rem;
        `}
      >
        <Link
          to="/management/notable-users"
          className={css`
            font-size: 1.4rem;
            font-weight: 700;
          `}
        >
          <Icon icon="arrow-left" />
          <span style={{ marginLeft: '0.7rem' }}>Back to Notable Users</span>
        </Link>
      </div>
      <section className={panelClass}>
        <header>
          <div>
            <h2>
              {user ? (
                <Link to={`/users/${user.username}`}>{user.username}</Link>
              ) : (
                `User ${userId}`
              )}
            </h2>
            {user ? (
              <span>
                {user.realName ? `${user.realName} · ` : ''}joined{' '}
                {formatTime(user.createdAt)}
              </span>
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

          {!loading && !error && data ? (
            <>
              <section className={summaryGridClass}>
                <MetricCard
                  label="Total XP"
                  value={formatNumber(user?.twinkleXP || 0)}
                  color="logoBlue"
                />
                <MetricCard
                  label="Total coins"
                  value={formatNumber(user?.twinkleCoins || 0)}
                  color="gold"
                />
                <MetricCard
                  label="Daily streak"
                  value={String(data.dailyTask.currentStreak)}
                  detail={`longest ${data.dailyTask.longestStreak}`}
                  color="orange"
                />
                <MetricCard
                  label="Daily tasks done"
                  value={formatNumber(data.dailyTask.activeDaysTotal)}
                  detail="in range"
                  color="green"
                />
              </section>

              <div className={chartGridClass}>
                <TimeSeriesChart
                  title="XP earned"
                  data={data.xpOverTime}
                  series={[
                    { key: 'value', name: 'XP', color: Color.logoBlue() }
                  ]}
                />
                <TimeSeriesChart
                  title="Coins earned"
                  data={data.coinsOverTime}
                  series={[{ key: 'value', name: 'Coins', color: Color.gold() }]}
                />
                <TimeSeriesChart
                  title="Build saves"
                  data={data.buildOverTime}
                  series={[
                    { key: 'value', name: 'Saves', color: Color.magenta() }
                  ]}
                />
                <TimeSeriesChart
                  title="Daily tasks completed"
                  data={data.dailyTask.completionOverTime}
                  series={[
                    { key: 'value', name: 'Completed', color: Color.green() }
                  ]}
                />
                <TimeSeriesChart
                  title="Active days"
                  data={data.activeDaysOverTime}
                  series={[
                    { key: 'value', name: 'Active days', color: Color.darkBlue() }
                  ]}
                />
                <div>
                  <h3 className={subsectionHeaderClass}>XP by category</h3>
                  <CategoryBreakdown rows={data.categoryBreakdown} />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </ErrorBoundary>
  );
}

const chartGridClass = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem 2.4rem;
  padding: 0 1.6rem 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
