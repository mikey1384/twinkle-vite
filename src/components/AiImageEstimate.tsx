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
const cacheKey = (
  userId: unknown,
  model: string,
  quality: string,
  referenceCount: number
) => `${userId}|${model}|${quality}|${referenceCount}`;

export default function AiImageEstimate({
  model,
  quality,
  referenceCount
}: {
  model: OpenAiImageModel;
  quality: AiImageQuality;
  // pictures sent along: an added image, the picture being edited and a
  // picked collection's pictures; the estimate includes them. Left out, the
  // estimate covers the image only and says references cost more.
  referenceCount?: number;
}) {
  const references = Math.max(0, Math.floor(referenceCount || 0));
  const userId = useKeyContext((v) => v.myState.userId);
  const loadEstimate = useAppContext(
    (v) => v.requestHelpers.loadAIImageGenerationEstimate
  );
  const loadEstimateRef = useRef(loadEstimate);
  loadEstimateRef.current = loadEstimate;
  const [estimate, setEstimate] = useState<{
    model: string;
    quality: string;
    referenceCount: number;
    percent: number;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const cachedPercent = estimateCache.get(
    cacheKey(userId, model, quality, references)
  );
  const current =
    cachedPercent !== undefined
      ? { percent: cachedPercent }
      : estimate?.model === model &&
          estimate.quality === quality &&
          estimate.referenceCount === references
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
    const key = cacheKey(userId, model, quality, references);
    if (estimateCache.has(key)) return;
    loadEstimateRef.current({
      model,
      quality,
      referenceImageCount: references
    })
      .then((result: AiImageGenerationEstimate) => {
        if (!active) return;
        if (!(result.fullBatteryUnits > 0) || !(result.energyUnits >= 0))
          throw new Error('Invalid estimate');
        const percent = (result.energyUnits / result.fullBatteryUnits) * 100;
        estimateCache.set(key, percent);
        setEstimate({ model, quality, referenceCount: references, percent });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [model, quality, references, userId]);

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
          ? `Image estimate: ${shown.percent < 1 ? '<1' : `~${Math.round(shown.percent)}`}% of a full battery${
              referenceCount === undefined
                ? '. Your prompt and reference image use additional energy.'
                : references > 0
                  ? `, including ${references} reference picture${references === 1 ? '' : 's'}. Your prompt uses a little more.`
                  : '. Your prompt uses a little more.'
            }`
          : failed
            ? 'Battery estimate unavailable. Final spending follows actual image usage.'
            : 'Checking battery estimate…'}
    </span>
  );
}
