import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import PreviewPanel from './PreviewPanel';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { normalizeAllowedBuildPreviewFrameSrc } from '~/helpers/buildPreviewOriginHelpers';
import type { Build } from './PreviewPanel/types';
import type { BuildCapabilitySnapshot } from './types/capabilityTypes';

interface RewardProposalPreviewPayload {
  reviewId: number;
  buildId: number;
  proposalRevision: number;
  previewPath: string;
  build: Build;
  capabilitySnapshot: BuildCapabilitySnapshot | null;
}

// The creator can't keep a version they never played. This runs the admin's
// suggested snapshot exactly as a Build app preview (same SDK bridge, same
// frame isolation), for the app's owner and the reward reviewer only. The
// server serves the frozen offer, never the creator's draft, and the shell
// carries no reward grant, so in-app rewards stay simulated and pay nothing.
export default function RewardProposalPlayModal({
  reviewId,
  onClose
}: {
  reviewId: number;
  onClose: () => void;
}) {
  const openPreview = useAppContext(
    (v) => v.requestHelpers.openBuildRewardProposalPreview
  );
  const [payload, setPayload] = useState<RewardProposalPreviewPayload | null>(
    null
  );
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    handleLoad();
    return () => {
      active = false;
    };

    async function handleLoad() {
      try {
        const result = await openPreview(reviewId);
        if (!active) return;
        const previewPath = normalizeAllowedBuildPreviewFrameSrc(
          String(result?.previewPath || '')
        );
        if (!previewPath || !result?.build?.id) {
          setError('Couldn’t open the suggested version right now.');
          return;
        }
        setPayload({ ...result, previewPath });
      } catch (err: any) {
        if (active)
          setError(
            err?.message || 'Couldn’t open the suggested version right now.'
          );
      }
    }
    // openPreview is a stable request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  const title = payload?.build?.title
    ? `Suggested version · ${payload.build.title}`
    : 'Suggested version';

  return (
    <Modal
      modalKey="BuildRewardProposalPlay"
      isOpen
      size="fullscreen"
      bodyPadding={0}
      onClose={onClose}
      title={title}
    >
      <div className={shellClass}>
        <div className={noticeClass}>
          <Icon icon="info-circle" />
          <span>
            You’re trying the version the admin suggested. XP and Coins here
            are practice only, and the app’s code doesn’t change until the
            creator accepts. Saves and shared data are the app’s real ones.
          </span>
        </div>
        <div className={stageClass}>
          {error ? (
            <div className={errorClass} role="alert">
              <Icon icon="exclamation-triangle" />
              <span>{error}</span>
            </div>
          ) : payload ? (
            <PreviewPanel
              build={payload.build}
              code={null}
              // The frame loads the suggested files from the server; the panel
              // only needs to know there is something to run.
              projectFiles={RUNNABLE_PLACEHOLDER_FILES}
              isOwner={false}
              codeWorkspaceAvailable={false}
              runtimeOnly
              capabilitySnapshot={payload.capabilitySnapshot || null}
              previewSrcOverride={payload.previewPath}
              rewardProposalReviewId={payload.reviewId}
              onReplaceCode={() => {}}
              onApplyRestoredProjectFiles={() => {}}
              onSaveProjectFiles={async () => ({ success: false })}
            />
          ) : (
            <Loading text="Loading the suggested version..." />
          )}
        </div>
      </div>
    </Modal>
  );
}

const RUNNABLE_PLACEHOLDER_FILES = [{ path: '/index.html', content: '' }];

const shellClass = css`
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const noticeClass = css`
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 1.5rem;
  background: ${Color.logoBlue(0.08)};
  border-top: 1px solid ${Color.logoBlue(0.18)};
  border-bottom: 1px solid ${Color.logoBlue(0.18)};
  color: ${Color.darkerGray()};
  font-size: 1.3rem;
  line-height: 1.45;
  > svg {
    flex: 0 0 auto;
    margin-top: 0.25rem;
    color: ${Color.logoBlue()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.6rem 1rem;
    font-size: 1.2rem;
  }
`;

const stageClass = css`
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  position: relative;
  overflow: hidden;
  background: #fff;
`;

const errorClass = css`
  align-self: center;
  justify-self: center;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  max-width: 36rem;
  padding: 1.5rem;
  color: ${Color.darkerGray()};
  font-size: 1.4rem;
  line-height: 1.45;
  > svg {
    flex: 0 0 auto;
    margin-top: 0.25rem;
    color: ${Color.orange()};
  }
`;
