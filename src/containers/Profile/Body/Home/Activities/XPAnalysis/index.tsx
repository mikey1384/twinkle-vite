import React, { useEffect, useState } from 'react';
import SectionPanel from '~/components/SectionPanel';
import MonthlyGrowth from './MonthlyGrowth';
import Sources from './Sources';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { contentClass } from './styles';
import type { MonthlyXP, XPSource } from './helpers/data';
const xpAnalysisLabel = 'XP Analysis';

export default function XPAnalysis({
  selectedTheme,
  userId,
  style
}: {
  selectedTheme: string;
  userId: number;
  style?: React.CSSProperties;
}) {
  const loadMonthlyXp = useAppContext((v) => v.requestHelpers.loadMonthlyXp);
  const loadXpAcquisition = useAppContext(
    (v) => v.requestHelpers.loadXpAcquisition
  );
  const [result, setResult] = useState<{
    userId: number;
    monthly: MonthlyXP[];
    sources: XPSource[];
  } | null>(null);
  const [failedUserId, setFailedUserId] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const currentResult = result?.userId === userId ? result : null;
  const failed = failedUserId === userId;

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setFailedUserId(null);
    init();

    return () => {
      cancelled = true;
    };

    async function init() {
      if (!userId) return;
      try {
        const [monthly, sources] = await Promise.all([
          loadMonthlyXp(userId),
          loadXpAcquisition(userId)
        ]);
        if (!cancelled) setResult({ userId, monthly, sources });
      } catch (error) {
        console.error(error);
        if (!cancelled) setFailedUserId(userId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, retry]);

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Activities/XPAnalysis">
      <SectionPanel
        customColorTheme={selectedTheme}
        title={xpAnalysisLabel}
        loaded={!!currentResult || failed}
        style={style}
      >
        {failed ? (
          <div
            role="status"
            className={css`
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 1rem;
              font-size: 1.4rem;
            `}
          >
            <span>XP activity couldn’t be loaded.</span>
            <Button
              variant="soft"
              color={selectedTheme}
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </Button>
          </div>
        ) : currentResult ? (
          <div key={userId} className={contentClass}>
            <MonthlyGrowth data={currentResult.monthly} />
            <Sources data={currentResult.sources} />
          </div>
        ) : null}
      </SectionPanel>
    </ErrorBoundary>
  );
}
