import type {
  AiImageGenerationEstimate,
  AiImageQuality,
  OpenAiImageModel
} from '~/helpers/aiImageModels';
import React, { useEffect, useRef, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';

// Session cache so switching back to a model and quality already fetched is
// instant. Keyed by user too, since the estimate is per account.
const estimateCache = new Map<string, number>();
const cacheKey = (userId: unknown, model: string, quality: string) =>
  `${userId}|${model}|${quality}`;

export default function AiImageEstimate({
  model,
  quality
}: {
  model: OpenAiImageModel;
  quality: AiImageQuality;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadEstimate = useAppContext(
    (v) => v.requestHelpers.loadAIImageGenerationEstimate
  );
  const loadEstimateRef = useRef(loadEstimate);
  loadEstimateRef.current = loadEstimate;
  const [estimate, setEstimate] = useState<{
    model: string;
    quality: string;
    percent: number;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const cachedPercent = estimateCache.get(cacheKey(userId, model, quality));
  const current =
    cachedPercent !== undefined
      ? { percent: cachedPercent }
      : estimate?.model === model && estimate.quality === quality
        ? estimate
        : null;
  // While a new model or quality loads, keep showing the previous estimate
  // (dimmed) so the line does not change length or flash "Checking...".
  const previous = !current && !failed ? estimate : null;
  const shown = current || previous;
  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!userId) return;
    if (estimateCache.has(cacheKey(userId, model, quality))) return;
    loadEstimateRef.current({ model, quality })
      .then((result: AiImageGenerationEstimate) => {
        if (!active) return;
        if (!(result.fullBatteryUnits > 0) || !(result.energyUnits >= 0))
          throw new Error('Invalid estimate');
        const percent = (result.energyUnits / result.fullBatteryUnits) * 100;
        estimateCache.set(cacheKey(userId, model, quality), percent);
        setEstimate({ model, quality, percent });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [model, quality, userId]);

  return (
    <span
      role="status"
      style={{
        display: 'block',
        flexBasis: '100%',
        textAlign: 'left',
        fontSize: '1rem',
        lineHeight: 1.5,
        opacity: previous ? 0.55 : 1,
        transition: 'opacity 0.15s'
      }}
    >
      {!userId
        ? 'Sign in to see the battery estimate.'
        : shown
          ? `Image estimate: ${shown.percent < 1 ? '<1' : `~${Math.round(shown.percent)}`}% of a full battery. Your prompt and reference image use additional energy.`
          : failed
            ? 'Battery estimate unavailable. Final spending follows actual image usage.'
            : 'Checking battery estimate…'}
    </span>
  );
}
