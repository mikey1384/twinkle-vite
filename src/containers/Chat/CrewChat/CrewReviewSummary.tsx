import React from 'react';
import CrewReviewFeedback from '~/containers/BridgeBuilderQuest/CrewReviewFeedback';
import type { CrewView } from '~/containers/BridgeBuilderQuest/types';

export default function CrewReviewSummary({ crew }: { crew: CrewView }) {
  const step = crew.progress.currentStep;
  if (crew.status !== 'active' || (step !== 'crew' && step !== 'grownUp')) return null;
  const review = crew.reviews?.[step];
  return review ? <CrewReviewFeedback step={step} review={review} compact /> : null;
}
