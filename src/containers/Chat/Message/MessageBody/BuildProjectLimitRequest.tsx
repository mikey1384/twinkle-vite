import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import { useAppContext } from '~/contexts';
import {
  compareBuildProjectLimitRequestVersions,
  getBuildProjectLimitRequestOpenPath
} from '~/helpers/buildProjectLimitApproval';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface ProjectLimitRequestPayload {
  requestId?: number;
  buildId?: number;
  requestedByUserId?: number;
  requestedByUsername?: string | null;
  requestedMaxFiles?: number | null;
  requestedMaxProjectBytes?: number | null;
  status?: RequestStatus;
  title?: string;
  revision?: number;
  eventTimeMs?: number;
}

export default function BuildProjectLimitRequest({
  request,
  myId,
  sender
}: {
  request?: ProjectLimitRequestPayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
    profileTheme?: string | null;
  };
}) {
  const navigate = useNavigate();
  const reviewRequest = useAppContext(
    (v) => v.requestHelpers.reviewBuildProjectLimitRequest
  );
  const [canonicalRequest, setCanonicalRequest] = useState(request || null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const payload = useMemo(
    () =>
      compareBuildProjectLimitRequestVersions(request, canonicalRequest) > 0
        ? request
        : canonicalRequest,
    [canonicalRequest, request]
  );
  const requestId = Number(payload?.requestId || 0);
  const buildId = Number(payload?.buildId || 0);
  const title = String(payload?.title || 'Untitled Build');
  const status: RequestStatus = payload?.status || 'pending';
  const sentByMe = Number(sender.id) === Number(myId);
  const requestedByMe =
    Number(payload?.requestedByUserId || 0) === Number(myId) || sentByMe;
  const canReview = Number(myId) === ADMIN_USER_ID && status === 'pending';
  const projectPath = getBuildProjectLimitRequestOpenPath({
    buildId,
    myId,
    requestedByUserId: Number(payload?.requestedByUserId || sender.id),
    reviewerUserId: ADMIN_USER_ID,
    status
  });
  const requestedMaxFiles = Number(payload?.requestedMaxFiles || 0);
  const requestedMaxProjectBytes = Number(
    payload?.requestedMaxProjectBytes || 0
  );

  useEffect(() => {
    function applyCanonicalRequest(update: any) {
      const updatedRequest = update?.request;
      if (Number(updatedRequest?.requestId || 0) !== requestId) return;
      setCanonicalRequest((current) =>
        compareBuildProjectLimitRequestVersions(updatedRequest, current) >= 0
          ? updatedRequest
          : current
      );
    }

    socket.on('build_project_limits_updated', applyCanonicalRequest);
    return () => {
      socket.off('build_project_limits_updated', applyCanonicalRequest);
    };
  }, [requestId]);

  if (!requestId || !buildId) return null;

  return (
    <BuildMessageCard
      bannerIcon="sparkles"
      themeName={sender.profileTheme}
      bannerText={
        status === 'approved'
          ? 'Project room approved'
          : status === 'rejected'
            ? 'Project room request declined'
            : 'Asked for more project room'
      }
      title={title}
      chips={
        <>
          {requestedMaxFiles > 0 ? (
            <BuildMessageCardChip icon="copy" themeName={sender.profileTheme}>
              {requestedMaxFiles} files
            </BuildMessageCardChip>
          ) : null}
          {requestedMaxProjectBytes > 0 ? (
            <BuildMessageCardChip icon="save" themeName={sender.profileTheme}>
              {formatBytes(requestedMaxProjectBytes)}
            </BuildMessageCardChip>
          ) : null}
        </>
      }
      actions={
        <>
          {canReview ? (
            <GameCTAButton
              variant="success"
              size="md"
              icon="check"
              shiny
              loading={actionLoading}
              onClick={() => handleReview(true)}
            >
              Approve
            </GameCTAButton>
          ) : null}
          {canReview ? (
            <GameCTAButton
              variant="neutral"
              size="md"
              icon="times"
              disabled={actionLoading}
              onClick={() => handleReview(false)}
            >
              Decline
            </GameCTAButton>
          ) : null}
          {projectPath ? (
            <GameCTAButton
              variant="logoBlue"
              size="md"
              icon="external-link-alt"
              onClick={() => navigate(projectPath)}
            >
              Open project
            </GameCTAButton>
          ) : null}
        </>
      }
    >
      <div className={messageClass}>
        {status === 'pending' ? (
          <>
            <Icon icon="info-circle" />
            <span>
              {requestedByMe
                ? 'Mikey can open this project while the request is pending so he can review it. Nothing changes until it is approved.'
                : `${sender.username} is nearing this project's current limit. Approving changes Main, and every branch inherits it.`}
            </span>
          </>
        ) : status === 'approved' ? (
          <>
            <Icon icon="check-circle" />
            <span>
              Main and all of its branches can use the approved room now.
            </span>
          </>
        ) : (
          <>
            <Icon icon="times-circle" />
            <span>The project's current limits did not change.</span>
          </>
        )}
      </div>
      {actionError ? <div className={errorClass}>{actionError}</div> : null}
    </BuildMessageCard>
  );

  async function handleReview(approved: boolean) {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError('');
    try {
      const result = await reviewRequest({ requestId, approved });
      if (!result?.success || !result?.request) {
        setActionError(result?.error || 'Could not review this request');
        return;
      }
      setCanonicalRequest((current) =>
        compareBuildProjectLimitRequestVersions(result.request, current) >= 0
          ? result.request
          : current
      );
    } catch (error: any) {
      setActionError(
        error?.responseData?.error ||
          error?.response?.data?.error ||
          error?.message ||
          'Could not review this request'
      );
    } finally {
      setActionLoading(false);
    }
  }
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${Math.round(value / (1024 * 1024))} MB`;
  }
  return `${Math.round(value / 1024)} KB`;
}

const messageClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  border: 1px solid ${Color.logoBlue(0.18)};
  border-radius: 10px;
  background: ${Color.logoBlue(0.07)};
  color: ${Color.darkerGray()};
  padding: 0.85rem 0.95rem;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.45;
  > svg {
    color: ${Color.logoBlue()};
    flex: 0 0 auto;
    margin-top: 0.2rem;
  }
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  font-weight: 700;
`;
