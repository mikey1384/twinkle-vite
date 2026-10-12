import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import SectionPanel from '~/components/SectionPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import ReflectionStatShape, {
  type ReflectionStatAxisShape
} from '~/components/ReflectionStatShape';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';

// A member's reflection stats shape on their profile (Mikey 2026-10-12). Shown
// only when the member opted in, to everyone including the owner (who opts in
// from the Daily Reflection result screen). Never shows numbers or rankings.
export default function ReflectionStats({
  profileId,
  selectedTheme
}: {
  profileId: number;
  selectedTheme?: string;
}) {
  const loadUserReflectionStats = useAppContext(
    (v) => v.requestHelpers.loadUserReflectionStats
  );
  const [data, setData] = useState<{
    visible: boolean;
    showOnProfile: boolean;
    isOwner?: boolean;
    shape?: ReflectionStatAxisShape[];
  } | null>(null);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    (async () => {
      const result = await loadUserReflectionStats(profileId);
      if (!cancelled && result && !result.error) setData(result);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  if (!data?.visible || !Array.isArray(data.shape)) return null;
  // the owner sees the section only once they've opted in
  if (!data.showOnProfile) return null;

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/ReflectionStats">
      <SectionPanel
        elevated
        customColorTheme={selectedTheme}
        loaded
        title="Stats"
      >
        <div
          className={css`
            padding: 0.5rem 0 0.5rem;
          `}
        >
          <ReflectionStatShape shape={data.shape} maxWidth={360} />
          <p
            className={css`
              margin: 0.6rem 0 0;
              text-align: center;
              font-size: 1.1rem;
              color: ${Color.darkGray()};
            `}
          >
            Grown through Daily Reflections
          </p>
        </div>
      </SectionPanel>
    </ErrorBoundary>
  );
}
