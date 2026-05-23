import { useEffect } from 'react';
import { useAppContext, useBuildContext } from '~/contexts';

const pendingViewerRequestLoads = new Map<string, Promise<void>>();

export function useEnsureBuildViewerCollaborationRequest({
  buildId,
  enabled,
  isOwner,
  loading,
  loaded,
  userId,
  viewerStateUserId
}: {
  buildId: number;
  enabled: boolean;
  isOwner: boolean;
  loading: boolean;
  loaded: boolean;
  userId: number | string | null | undefined;
  viewerStateUserId?: number | null;
}) {
  const loadMyBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.loadMyBuildCollaborationRequest
  );
  const onPatchBuildSummary = useBuildContext(
    (v) => v.actions.onPatchBuildSummary
  );
  const viewerId = Math.max(0, Math.floor(Number(userId || 0)));
  const normalizedViewerStateUserId = Math.max(
    0,
    Math.floor(Number(viewerStateUserId || 0))
  );

  useEffect(() => {
    if (!buildId || !enabled) return;
    if (!viewerId || isOwner) {
      onPatchBuildSummary({
        buildId,
        patch: {
          viewerCollaborationRequest: null,
          viewerCollaborationRequestLoaded: Boolean(viewerId),
          viewerCollaborationRequestLoading: false,
          viewerStateUserId: viewerId || null
        }
      });
      return;
    }
    if (normalizedViewerStateUserId !== viewerId) {
      onPatchBuildSummary({
        buildId,
        patch: {
          viewerCollaborationRequest: null,
          viewerCollaborationRequestLoaded: false,
          viewerCollaborationRequestLoading: false,
          viewerStateUserId: viewerId
        }
      });
      return;
    }
    if (loaded) return;
    const requestKey = `${buildId}:${viewerId}`;
    if (pendingViewerRequestLoads.has(requestKey)) return;
    onPatchBuildSummary({
      buildId,
      patch: {
        viewerCollaborationRequestLoading: true,
        viewerStateUserId: viewerId
      }
    });
    const requestPromise = loadMyBuildCollaborationRequest(buildId)
      .then((result: any) => {
        onPatchBuildSummary({
          buildId,
          patch: {
            viewerCollaborationRequest: result?.request || null,
            viewerCollaborationRequestLoaded: true,
            viewerCollaborationRequestLoading: false,
            viewerStateUserId: viewerId
          }
        });
      })
      .catch(() => {
        onPatchBuildSummary({
          buildId,
          patch: {
            viewerCollaborationRequest: null,
            viewerCollaborationRequestLoaded: true,
            viewerCollaborationRequestLoading: false,
            viewerStateUserId: viewerId
          }
        });
      })
      .finally(() => {
        pendingViewerRequestLoads.delete(requestKey);
      });
    pendingViewerRequestLoads.set(requestKey, requestPromise);
    // Context action/request helpers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    buildId,
    enabled,
    isOwner,
    loaded,
    loading,
    normalizedViewerStateUserId,
    viewerId
  ]);
}
