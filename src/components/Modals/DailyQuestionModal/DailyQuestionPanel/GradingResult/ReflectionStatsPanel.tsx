import React, { useEffect, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import { PAPER } from '../../paperTheme';
import { useAppContext } from '~/contexts';
import ReflectionStatShape, {
  REFLECTION_STAT_LABELS,
  type ReflectionStatAxis,
  type ReflectionStatAxisShape
} from '~/components/ReflectionStatShape';

// Reflection stats on the result screen (Mikey 2026-10-12): the member's
// shape, a one-time morph showing what this reflection grew, and the profile
// opt-in. No numbers. Training shows it larger.

const SEEN_KEY_PREFIX = 'reflection-stats-growth-seen:';

const pop = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

function hasSeenGrowth(responseId: number) {
  try {
    return localStorage.getItem(`${SEEN_KEY_PREFIX}${responseId}`) === '1';
  } catch {
    return false;
  }
}

function markGrowthSeen(responseId: number) {
  try {
    localStorage.setItem(`${SEEN_KEY_PREFIX}${responseId}`, '1');
  } catch {
    // private window or blocked storage: the morph may replay, which is fine
  }
}

export default function ReflectionStatsPanel({
  responseId,
  prominent = false
}: {
  responseId: number;
  prominent?: boolean;
}) {
  const loadReflectionStats = useAppContext(
    (v) => v.requestHelpers.loadReflectionStats
  );
  const setReflectionStatsVisibility = useAppContext(
    (v) => v.requestHelpers.setReflectionStatsVisibility
  );
  const [loaded, setLoaded] = useState(false);
  const [shape, setShape] = useState<ReflectionStatAxisShape[]>([]);
  const [growth, setGrowth] = useState<{
    axis: ReflectionStatAxis;
    previous: ReflectionStatAxisShape[];
    layerUp: boolean;
  } | null>(null);
  const [animateGrowth, setAnimateGrowth] = useState(false);
  const [showLayerUp, setShowLayerUp] = useState(false);
  const [showOnProfile, setShowOnProfile] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    load(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };

    // The award can land just after the grade when the stat check is slow
    // (the server stops waiting after 15 s), so look again a couple of times.
    async function load(attempt: number) {
      const data = await loadReflectionStats({ responseId });
      if (cancelled || !data || data.error || !Array.isArray(data.shape)) {
        return;
      }
      setShape(data.shape);
      setShowOnProfile(!!data.showOnProfile);
      setLoaded(true);
      if (data.growth) {
        setGrowth(data.growth);
        const seen = hasSeenGrowth(responseId);
        setAnimateGrowth(!seen);
        if (seen && data.growth.layerUp) setShowLayerUp(true);
      } else if (attempt < 2) {
        timer = setTimeout(() => load(attempt + 1), 8000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseId]);

  if (!loaded) return null;

  const grownLabel = growth ? REFLECTION_STAT_LABELS[growth.axis] : '';

  return (
    <div
      className={css`
        margin: 1.4rem 0 0.4rem;
        border: 1px solid ${PAPER.line};
        border-radius: 12px;
        background: ${PAPER.paper};
        padding: 1.2rem 1.2rem 1.3rem;
      `}
    >
      <div
        className={css`
          font-size: 1.3rem;
          font-weight: 700;
          color: ${PAPER.ink};
          text-align: center;
          margin-bottom: 0.3rem;
        `}
      >
        Your Stats
      </div>
      {growth && (
        <div
          className={css`
            text-align: center;
            font-size: 1.15rem;
            color: ${PAPER.inkSoft};
            min-height: 1.6rem;
          `}
        >
          {showLayerUp ? (
            <span
              className={css`
                display: inline-block;
                font-weight: 800;
                color: ${PAPER.accent};
                animation: ${pop} 0.6s ease-out;
              `}
            >
              {grownLabel} reached a new level!
            </span>
          ) : (
            <span>
              Today's reflection grew your <b>{grownLabel}</b>.
            </span>
          )}
        </div>
      )}
      <ReflectionStatShape
        shape={shape}
        previous={growth?.previous || null}
        grownAxis={growth?.axis || null}
        animate={animateGrowth}
        maxWidth={prominent ? 460 : 340}
        onAnimationEnd={() => {
          markGrowthSeen(responseId);
          if (growth?.layerUp) setShowLayerUp(true);
        }}
      />

      <button
        type="button"
        role="switch"
        aria-checked={showOnProfile}
        disabled={savingVisibility}
        onClick={handleToggleVisibility}
        className={css`
          margin: 1.2rem auto 0;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1.3rem;
          font-weight: 600;
          color: ${PAPER.inkSoft};
        `}
      >
        <span
          className={css`
            width: 3.6rem;
            height: 2rem;
            border-radius: 999px;
            padding: 0.25rem;
            background: ${showOnProfile ? PAPER.done : PAPER.lineStrong};
            transition: background 0.2s;
            display: flex;
          `}
        >
          <span
            className={css`
              width: 1.5rem;
              height: 1.5rem;
              border-radius: 50%;
              background: ${PAPER.paper};
              transition: transform 0.2s;
              transform: translateX(${showOnProfile ? '1.6rem' : '0'});
            `}
          />
        </span>
        Show my stats on my profile
      </button>
      {error && (
        <p
          className={css`
            margin: 0.6rem 0 0;
            color: ${PAPER.warn};
            font-size: 1.1rem;
          `}
        >
          {error}
        </p>
      )}
    </div>
  );

  async function handleToggleVisibility() {
    if (savingVisibility) return;
    setSavingVisibility(true);
    setError('');
    try {
      const result = await setReflectionStatsVisibility({
        showOnProfile: !showOnProfile
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setShowOnProfile(!!result?.showOnProfile);
    } finally {
      setSavingVisibility(false);
    }
  }
}
