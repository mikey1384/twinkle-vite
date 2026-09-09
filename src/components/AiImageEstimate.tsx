import type {
  AiImageGenerationEstimate,
  AiImageQuality,
  OpenAiImageModel
} from '~/helpers/aiImageModels';
import React, { useEffect, useRef, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';

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
  const current =
    estimate?.model === model && estimate.quality === quality ? estimate : null;
  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!userId) return;
    loadEstimateRef.current({ model, quality })
      .then((result: AiImageGenerationEstimate) => {
        if (!active) return;
        if (!(result.fullBatteryUnits > 0) || !(result.energyUnits >= 0))
          throw new Error('Invalid estimate');
        setEstimate({
          model: result.model,
          quality: result.quality,
          percent: (result.energyUnits / result.fullBatteryUnits) * 100
        });
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
        fontSize: '1rem',
        lineHeight: 1.5
      }}
    >
      {!userId
        ? 'Sign in to see the battery estimate.'
        : current
          ? `Image estimate: ${current.percent < 1 ? '<1' : `~${Math.round(current.percent)}`}% of a full battery. Your prompt and reference image use additional energy.`
          : failed
            ? 'Battery estimate unavailable. Final spending follows actual image usage.'
            : 'Checking battery estimate…'}
    </span>
  );
}
