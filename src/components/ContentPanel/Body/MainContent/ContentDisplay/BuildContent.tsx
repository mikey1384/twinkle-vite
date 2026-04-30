import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { css } from '@emotion/css';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useInView } from 'react-intersection-observer';
import { BUILD_APP_IFRAME_ALLOW } from '~/containers/Build/iframePermissions';

type BuildCollaborationMode = 'private' | 'contribution' | 'open_source';
type BuildContributionAccess = 'anyone' | 'invite_only';

interface BuildCollaborationRequest {
  id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'canceled';
  message?: string;
  ownerHidden?: number;
}

export default function BuildContent({
  build,
  contentId,
  navigate,
  theme
}: {
  build: {
    id?: number;
    userId?: number;
    title?: string;
    description?: string;
    collaborationMode?: BuildCollaborationMode;
    contributionAccess?: BuildContributionAccess;
    thumbnailUrl?: string | null;
    updatedAt?: number | null;
  };
  contentId: number;
  navigate: (url: string, options?: Record<string, any>) => void;
  theme?: string;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const forkBuild = useAppContext((v) => v.requestHelpers.forkBuild);
  const createBuildContributionFork = useAppContext(
    (v) => v.requestHelpers.createBuildContributionFork
  );
  const loadMyBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.loadMyBuildCollaborationRequest
  );
  const createBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.createBuildCollaborationRequest
  );
  const cancelBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.cancelBuildCollaborationRequest
  );
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [VisibilityRef, previewInView] = useInView({
    initialInView: true,
    threshold: 0.05
  });
  const [iframeActivated, setIframeActivated] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');
  const [
    collaborationRequestModalShown,
    setCollaborationRequestModalShown
  ] = useState(false);
  const [collaborationRequestMessage, setCollaborationRequestMessage] =
    useState('');
  const [collaborationRequest, setCollaborationRequest] =
    useState<BuildCollaborationRequest | null>(null);
  const [collaborationRequestLoading, setCollaborationRequestLoading] =
    useState(false);
  const [collaborationRequestError, setCollaborationRequestError] =
    useState('');
  const buildId = Number(build?.id || 0);
  const ownerId = Number(build?.userId || 0);
  const isOwner = Boolean(userId && ownerId && Number(userId) === ownerId);
  const collaborationMode = normalizeCollaborationMode(
    build?.collaborationMode
  );
  const contributionAccess = normalizeContributionAccess(
    build?.contributionAccess
  );
  const showContributeAction =
    !isOwner &&
    Boolean(userId) &&
    (collaborationMode === 'contribution' ||
      collaborationMode === 'open_source') &&
    contributionAccess === 'anyone';
  const showForkAction =
    !isOwner && Boolean(userId) && collaborationMode === 'open_source';
  const showCollaborationRequestAction =
    !isOwner &&
    Boolean(userId) &&
    (collaborationMode === 'private' ||
      (collaborationMode === 'contribution' &&
        contributionAccess === 'invite_only') ||
      (collaborationMode === 'open_source' &&
        contributionAccess === 'invite_only'));
  const collaborationRequestActionLabel =
    collaborationMode === 'private' ? 'Offer Collaboration' : 'Request Access';
  const showDiscussAction = isOwner;
  const showCollaborationSettingsAction = isOwner;
  const collaborationSettingsLabel =
    collaborationMode === 'private'
      ? 'Set Up Collaboration'
      : 'Manage Collaboration';
  const thumbnailUrl = String(build?.thumbnailUrl || '').trim();
  const hasThumbnail = Boolean(thumbnailUrl);
  const { colorKey: playButtonColorKey } = useRoleColor('button', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const { colorKey: playButtonHoverColorKey } = useRoleColor(
    'buttonHovered',
    {
      themeName: theme,
      fallback: playButtonColorKey || 'logoBlue'
    }
  );
  const appPath = useMemo(() => {
    return buildId ? `/app/${buildId}` : '';
  }, [buildId]);
  const embeddedAppPath = useMemo(() => {
    if (!appPath) return '';
    const searchParams = new URLSearchParams({
      embedded: '1'
    });
    if (Number(build?.updatedAt) > 0) {
      searchParams.set('rev', String(Number(build.updatedAt)));
    }
    return `${appPath}?${searchParams.toString()}`;
  }, [appPath, build?.updatedAt]);

  useEffect(() => {
    setIframeReady(false);
  }, [embeddedAppPath]);

  useEffect(() => {
    if (!iframeActivated || !iframeReady) return;
    postRuntimeVisibility(previewInView);
  }, [iframeActivated, iframeReady, previewInView]);

  if (!buildId || !embeddedAppPath) {
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 18rem;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          background: #fff;
          color: ${Color.darkGray()};
          font-weight: 600;
        `}
      >
        This app preview is unavailable.
      </div>
    );
  }

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
      `}
    >
      {collaborationRequestModalShown ? renderCollaborationRequestModal() : null}
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.7rem;
            min-width: 0;
          `}
        >
          <div
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.55rem;
              padding: 0.45rem 0.85rem;
              border-radius: 999px;
              background: ${Color.logoBlue(0.12)};
              color: ${Color.logoBlue()};
              font-size: 1.2rem;
              font-weight: 700;
            `}
          >
            <Icon icon="rocket" />
            <span>Lumine App</span>
          </div>
          {build.title ? (
            <div
              className={css`
                min-width: 0;
                font-size: 1.35rem;
                font-weight: 700;
                color: ${Color.darkGray()};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              `}
            >
              {build.title}
            </div>
          ) : null}
        </div>
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.55rem;
            flex-wrap: wrap;
          `}
        >
          {showContributeAction ? (
            <Button
              color="logoBlue"
              variant="soft"
              shape="pill"
              size="sm"
              uppercase={false}
              loading={actionLoading === 'contribute'}
              disabled={Boolean(actionLoading)}
              onClick={handleContribute}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Icon icon="code-branch" />
              <span>Contribute</span>
            </Button>
          ) : null}
          {showForkAction ? (
            <Button
              color="purple"
              variant="soft"
              shape="pill"
              size="sm"
              uppercase={false}
              loading={actionLoading === 'fork'}
              disabled={Boolean(actionLoading)}
              onClick={handleFork}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Icon icon="code-branch" />
              <span>Fork</span>
            </Button>
          ) : null}
          {showCollaborationRequestAction ? (
            <Button
              color="pink"
              variant="soft"
              shape="pill"
              size="sm"
              uppercase={false}
              loading={actionLoading === 'collaborationRequest'}
              disabled={Boolean(actionLoading)}
              onClick={handleOpenCollaborationRequestModal}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Icon icon="user-plus" />
              <span>{collaborationRequestActionLabel}</span>
            </Button>
          ) : null}
          {showDiscussAction ? (
            <Button
              color="darkerGray"
              variant="outline"
              shape="pill"
              size="sm"
              uppercase={false}
              disabled={Boolean(actionLoading)}
              onClick={handleDiscuss}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Icon icon="comments" />
              <span>Discuss</span>
            </Button>
          ) : null}
          {showCollaborationSettingsAction ? (
            <Button
              color="pink"
              variant="soft"
              shape="pill"
              size="sm"
              uppercase={false}
              disabled={Boolean(actionLoading)}
              onClick={handleOpenCollaborationSettings}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Icon icon="users" />
              <span>{collaborationSettingsLabel}</span>
            </Button>
          ) : null}
          <Button
            color="logoBlue"
            variant="solid"
            tone="raised"
            shape="pill"
            size="sm"
            uppercase={false}
            disabled={Boolean(actionLoading)}
            onClick={handleOpenApp}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Icon icon="external-link-alt" />
            <span>Open App</span>
          </Button>
        </div>
      </div>
      {actionError ? (
        <div
          className={css`
            color: #be123c;
            font-size: 1.05rem;
            font-weight: 700;
          `}
        >
          {actionError}
        </div>
      ) : null}
      <div
        ref={VisibilityRef}
        className={css`
          position: relative;
          width: 100%;
          height: 58rem;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          overflow: hidden;
          background: #fff;
          @media (max-width: ${mobileMaxWidth}) {
            height: 48rem;
            border-left: 0;
            border-right: 0;
            border-radius: 0;
          }
        `}
      >
        {!iframeActivated && (
          <div
            className={css`
              position: absolute;
              inset: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 1rem;
              padding: 2rem;
              background: ${hasThumbnail
                ? `linear-gradient(180deg, rgba(8, 16, 32, 0.18) 0%, rgba(8, 16, 32, 0.28) 56%, rgba(8, 16, 32, 0.4) 100%), url("${thumbnailUrl}") center / cover no-repeat`
                : 'radial-gradient(circle at top, #eef5ff 0%, #fafbff 58%, #fff 100%)'};
              color: ${hasThumbnail ? '#fff' : Color.darkGray()};
              z-index: 1;
              text-align: center;
            `}
          >
            <div
              className={css`
                width: 4.8rem;
                height: 4.8rem;
                border-radius: 999px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: ${hasThumbnail
                  ? 'rgba(255, 255, 255, 0.16)'
                  : Color.logoBlue(0.12)};
                color: ${hasThumbnail ? '#fff' : Color.logoBlue()};
                font-size: 1.8rem;
                backdrop-filter: ${hasThumbnail ? 'blur(8px)' : 'none'};
              `}
            >
              <Icon icon="rocket" />
            </div>
            <div
              className={css`
                font-size: 1.55rem;
                font-weight: 800;
                color: ${hasThumbnail ? '#fff' : Color.darkGray()};
                max-width: 32rem;
                line-height: 1.3;
                text-shadow: ${hasThumbnail
                  ? '0 2px 18px rgba(0, 0, 0, 0.35)'
                  : 'none'};
              `}
            >
              {build.title || 'Lumine App'}
            </div>
            {build.description?.trim() ? (
              <div
                className={css`
                  max-width: 32rem;
                  font-size: 1.05rem;
                  line-height: 1.55;
                  color: ${hasThumbnail
                    ? 'rgba(255, 255, 255, 0.94)'
                    : Color.darkGray(0.8)};
                  display: -webkit-box;
                  -webkit-line-clamp: 3;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-shadow: ${hasThumbnail
                    ? '0 2px 16px rgba(0, 0, 0, 0.28)'
                    : 'none'};
                `}
              >
                {build.description.trim()}
              </div>
            ) : null}
            <Button
              color={playButtonColorKey}
              hoverColor={playButtonHoverColorKey}
              variant="solid"
              tone="raised"
              shape="pill"
              size="lg"
              uppercase={false}
              onClick={handlePlay}
              style={{
                minWidth: '14rem',
                justifyContent: 'center',
                boxShadow: hasThumbnail
                  ? '0 12px 24px rgba(18, 90, 255, 0.3)'
                  : '0 10px 20px rgba(18, 90, 255, 0.18)'
              }}
            >
              <Icon icon="play" />
              <span style={{ marginLeft: '0.7rem' }}>Play</span>
            </Button>
          </div>
        )}
        {iframeActivated && !iframeReady && (
          <div
            className={css`
              position: absolute;
              inset: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0.8rem;
              background: #fafbff;
              color: ${Color.darkGray()};
              z-index: 1;
            `}
          >
            <Icon icon="spinner" pulse />
            <div
              className={css`
                font-size: 1.25rem;
                font-weight: 700;
              `}
            >
              Loading app...
            </div>
          </div>
        )}
        {iframeActivated && (
          <iframe
            ref={iframeRef}
            src={embeddedAppPath}
            title={build.title || 'Lumine App'}
            allow={BUILD_APP_IFRAME_ALLOW}
            allowFullScreen
            loading="lazy"
            onLoad={() => {
              setIframeReady(true);
              postRuntimeVisibility(previewInView);
            }}
            className={css`
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              border: none;
              background: #fff;
              opacity: ${iframeReady ? 1 : 0};
              transition: opacity 0.18s ease;
            `}
          />
        )}
      </div>
    </div>
  );

  function handlePlay() {
    onSetMediaStarted({
      contentType: 'build',
      contentId,
      started: true
    });
    setIframeActivated(true);
    setIframeReady(false);
  }

  function handleOpenApp() {
    if (!appPath) return;
    navigate(appPath);
  }

  function handleDiscuss() {
    if (!buildId) return;
    navigate(`/build/${buildId}`, {
      state: {
        openPeoplePanel: true
      }
    });
  }

  function handleOpenCollaborationSettings() {
    if (!buildId) return;
    navigate(`/build/${buildId}`, {
      state: {
        openCollaborationSettings: true,
        openPeoplePanel: true
      }
    });
  }

  async function handleOpenCollaborationRequestModal() {
    if (!buildId || actionLoading) return;
    setActionLoading('collaborationRequest');
    setActionError('');
    setCollaborationRequestError('');
    setCollaborationRequestModalShown(true);
    try {
      const result = await loadMyBuildCollaborationRequest(buildId);
      const nextRequest = result?.request || null;
      setCollaborationRequest(nextRequest);
      setCollaborationRequestMessage(String(nextRequest?.message || ''));
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to load collaboration request'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleSubmitCollaborationRequest() {
    if (!buildId || collaborationRequestLoading) return;
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await createBuildCollaborationRequest({
        buildId,
        message: collaborationRequestMessage
      });
      if (result?.request) {
        setCollaborationRequest(result.request);
        setCollaborationRequestMessage(String(result.request.message || ''));
      }
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to send collaboration request'
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleCancelCollaborationRequest() {
    if (!buildId || !collaborationRequest?.id || collaborationRequestLoading) {
      return;
    }
    setCollaborationRequestLoading(true);
    setCollaborationRequestError('');
    try {
      const result = await cancelBuildCollaborationRequest({
        buildId,
        requestId: collaborationRequest.id
      });
      if (result?.success) {
        setCollaborationRequest(null);
        setCollaborationRequestMessage('');
      }
    } catch (error: any) {
      setCollaborationRequestError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to cancel collaboration request'
      );
    } finally {
      setCollaborationRequestLoading(false);
    }
  }

  async function handleContribute() {
    if (!buildId || actionLoading) return;
    setActionLoading('contribute');
    setActionError('');
    try {
      const result = await createBuildContributionFork(buildId);
      if (result?.success && result?.build?.id) {
        navigate(`/build/${result.build.id}`, {
          state: {
            openPeoplePanel: true
          }
        });
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to start contribution'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleFork() {
    if (!buildId || actionLoading) return;
    setActionLoading('fork');
    setActionError('');
    try {
      const result = await forkBuild(buildId);
      if (result?.success && result?.build?.id) {
        navigate(`/build/${result.build.id}`);
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error || error?.message || 'Failed to fork app'
      );
    } finally {
      setActionLoading('');
    }
  }

  function postRuntimeVisibility(visible: boolean) {
    const runtimeWindow = iframeRef.current?.contentWindow;
    if (!runtimeWindow) return;
    runtimeWindow.postMessage(
      {
        source: 'twinkle-content-panel',
        type: 'runtime-visibility:update',
        payload: {
          visible
        }
      },
      '*'
    );
  }

  function renderCollaborationRequestModal() {
    const pending = collaborationRequest?.status === 'pending';
    const accepted = collaborationRequest?.status === 'accepted';
    return (
      <Modal
        modalKey="BuildCollaborationRequestModal"
        isOpen
        onClose={
          collaborationRequestLoading
            ? () => {}
            : () => setCollaborationRequestModalShown(false)
        }
        closeOnBackdropClick={!collaborationRequestLoading}
        title={
          collaborationMode === 'contribution'
            ? 'Request Contributor Access'
            : 'Offer Collaboration'
        }
        size="sm"
        footer={
          <div
            className={css`
              display: flex;
              justify-content: flex-end;
              gap: 0.65rem;
              flex-wrap: wrap;
            `}
          >
            <Button
              variant="ghost"
              disabled={collaborationRequestLoading}
              onClick={() => setCollaborationRequestModalShown(false)}
            >
              Close
            </Button>
            {pending ? (
              <Button
                color="darkerGray"
                variant="outline"
                loading={collaborationRequestLoading}
                disabled={collaborationRequestLoading}
                onClick={handleCancelCollaborationRequest}
              >
                Cancel Request
              </Button>
            ) : accepted ? (
              <Button
                color="logoBlue"
                loading={collaborationRequestLoading}
                disabled={collaborationRequestLoading}
                onClick={handleContribute}
              >
                Start Contributing
              </Button>
            ) : (
              <Button
                color="pink"
                loading={collaborationRequestLoading}
                disabled={collaborationRequestLoading}
                onClick={handleSubmitCollaborationRequest}
              >
                Send Request
              </Button>
            )}
          </div>
        }
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
          `}
        >
          {pending ? (
            <div
              className={css`
                color: ${Color.darkGray()};
                font-weight: 800;
                line-height: 1.4;
              `}
            >
              Your request is pending.
            </div>
          ) : accepted ? (
            <div
              className={css`
                color: ${Color.logoBlue()};
                font-weight: 800;
                line-height: 1.4;
              `}
            >
              Your request was accepted. You can start a project-scoped
              contribution fork.
            </div>
          ) : (
            <div
              className={css`
                color: ${Color.darkGray()};
                font-weight: 700;
                line-height: 1.45;
              `}
            >
              Ask the owner to invite you as a contributor.
            </div>
          )}
          {!accepted ? (
            <textarea
              value={collaborationRequestMessage}
              onChange={(event) =>
                setCollaborationRequestMessage(event.target.value)
              }
              disabled={pending || collaborationRequestLoading}
              maxLength={1000}
              placeholder="Optional message"
              className={css`
                min-height: 7rem;
                resize: vertical;
                border: 1px solid var(--ui-border);
                border-radius: ${borderRadius};
                padding: 0.75rem;
                font: inherit;
                &:focus {
                  outline: 2px solid ${Color.pink(0.22)};
                  border-color: ${Color.pink(0.65)};
                }
              `}
            />
          ) : null}
          {collaborationRequest?.ownerHidden ? (
            <div
              className={css`
                color: ${Color.darkGray(0.7)};
                font-size: 0.9rem;
                font-weight: 700;
              `}
            >
              This request is saved in the owner&apos;s hidden request list.
            </div>
          ) : null}
          {collaborationRequestError ? (
            <div
              className={css`
                color: #be123c;
                font-weight: 800;
              `}
            >
              {collaborationRequestError}
            </div>
          ) : null}
        </div>
      </Modal>
    );
  }
}

function normalizeCollaborationMode(value: unknown): BuildCollaborationMode {
  return value === 'contribution' || value === 'open_source'
    ? value
    : 'private';
}

function normalizeContributionAccess(value: unknown): BuildContributionAccess {
  return value === 'invite_only' ? 'invite_only' : 'anyone';
}
