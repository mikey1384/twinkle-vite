import React, { Suspense, useState } from 'react';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { lazyWithRetry } from '~/helpers/lazyImportHelpers';

// The play modal mounts a full Build preview; keep it out of the chat and
// settings bundles until someone actually presses the button.
const RewardProposalPlayModal = lazyWithRetry(
  () => import('~/containers/Build/RewardProposalPlayModal')
);

// "Try this version": plays the admin's suggested version before anyone
// decides. Callers show it only to the app's owner and the reward reviewer;
// the server enforces the same rule.
export default function RewardProposalTryButton({
  reviewId,
  size = 'md'
}: {
  reviewId: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [open, setOpen] = useState(false);
  if (!(Number(reviewId) > 0)) return null;
  return (
    <>
      <GameCTAButton
        variant="purple"
        size={size}
        icon="play"
        onClick={() => setOpen(true)}
      >
        Try this version
      </GameCTAButton>
      {open ? (
        <Suspense fallback={null}>
          <RewardProposalPlayModal
            reviewId={Number(reviewId)}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      ) : null}
    </>
  );
}
