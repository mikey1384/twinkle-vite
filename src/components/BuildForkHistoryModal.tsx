import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Modal from '~/components/Modal';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import BuildProjectListItem, {
  type BuildProjectListItemData
} from '~/components/BuildProjectListItem';
import { useAppContext, useKeyContext } from '~/contexts';
import { getBuildWorkspacePath } from '~/containers/Build/buildNavigation';

const triggerClass = css`
  appearance: none;
  margin: 0;
  font-family: inherit;
  text-align: inherit;
  cursor: pointer;
`;

const modalBodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const historyListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const historyItemClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const historyStepClass = css`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(147, 51, 234, 0.1);
  color: #6b21a8;
  border: 1px solid rgba(147, 51, 234, 0.24);
  font-size: 0.9rem;
  font-weight: 900;
`;

const messageClass = css`
  padding: 1rem;
  border-radius: 0.65rem;
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
`;

const truncatedClass = css`
  padding: 1rem;
  border-radius: 0.65rem;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.12);
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.24);
`;

const retryButtonClass = css`
  appearance: none;
  align-self: flex-start;
  border: 1px solid rgba(65, 140, 235, 0.35);
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.12);
  color: #1d4ed8;
  cursor: pointer;
  padding: 0.55rem 0.85rem;
  font-weight: 900;
`;

export function BuildForkHistoryTrigger({
  buildId,
  className,
  style,
  children,
  title = 'View fork history'
}: {
  buildId: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  title?: string;
}) {
  const [modalShown, setModalShown] = useState(false);
  const normalizedBuildId = Number(buildId || 0);

  if (normalizedBuildId <= 0) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cx(className, triggerClass)}
        style={style}
        title={title}
        aria-label={title}
        onClick={handleClick}
      >
        {children}
      </button>
      {modalShown ? (
        <BuildForkHistoryModal
          buildId={normalizedBuildId}
          isOpen
          onClose={() => setModalShown(false)}
        />
      ) : null}
    </>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setModalShown(true);
  }
}

export default function BuildForkHistoryModal({
  buildId,
  isOpen,
  onClose
}: {
  buildId: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const viewerUserId = useKeyContext((v) => v.myState.userId);
  const loadBuildForkHistory = useAppContext(
    (v) => v.requestHelpers.loadBuildForkHistory
  );
  const [loading, setLoading] = useState(false);
  const [builds, setBuilds] = useState<BuildProjectListItemData[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || Number(buildId || 0) <= 0) return;
    let canceled = false;
    void loadHistory();

    async function loadHistory() {
      setLoading(true);
      setError('');
      try {
        const data = await loadBuildForkHistory(buildId);
        if (canceled) return;
        setBuilds(normalizeBuilds(data?.builds));
        setTruncated(Boolean(data?.truncated));
      } catch (err: any) {
        if (canceled) return;
        setBuilds([]);
        setTruncated(false);
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Fork history could not be loaded.'
        );
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // loadBuildForkHistory is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isOpen]);

  return (
    <Modal
      modalKey={`BuildForkHistoryModal-${buildId}`}
      isOpen={isOpen}
      onClose={onClose}
      title="Fork History"
      size="lg"
    >
      <div className={modalBodyClass}>
        {loading ? (
          <Loading />
        ) : error ? (
          <>
            <div className={messageClass}>{error}</div>
            <button
              type="button"
              className={retryButtonClass}
              onClick={handleRetry}
            >
              Try again
            </button>
          </>
        ) : builds.length === 0 ? (
          <div className={messageClass}>No fork history found.</div>
        ) : (
          <div className={historyListClass}>
            {builds.map((build, index) => {
              const isOwner =
                Number(viewerUserId || 0) > 0 &&
                Number(viewerUserId) === Number(build.userId || 0);
              return (
                <div key={build.id} className={historyItemClass}>
                  <div className={historyStepClass}>
                    <Icon icon="code-branch" />
                    {getHistoryStepLabel({ builds, index })}
                  </div>
                  <BuildProjectListItem
                    build={build}
                    to={getForkHistoryBuildPath(build, isOwner)}
                    isOwner={isOwner}
                    primaryActionLabel="Open"
                    primaryActionIcon="external-link-alt"
                    showCollaborationRequestAction={false}
                    showForkBadge={false}
                  />
                </div>
              );
            })}
          </div>
        )}
        {!loading && !error && truncated ? (
          <div className={truncatedClass}>
            Some private ancestors are only visible to their owners or team
            members.
          </div>
        ) : null}
      </div>
    </Modal>
  );

  function handleRetry() {
    setBuilds([]);
    setTruncated(false);
    setError('');
    setLoading(true);
    loadBuildForkHistory(buildId)
      .then((data: any) => {
        setBuilds(normalizeBuilds(data?.builds));
        setTruncated(Boolean(data?.truncated));
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            'Fork history could not be loaded.'
        );
      })
      .finally(() => setLoading(false));
  }
}

function normalizeBuilds(value: unknown): BuildProjectListItemData[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((build) => normalizeBuild(build))
    .filter((build): build is BuildProjectListItemData => Boolean(build));
}

function normalizeBuild(value: any): BuildProjectListItemData | null {
  const id = Number(value?.id || 0);
  if (id <= 0) return null;
  return {
    ...value,
    id,
    title: String(value?.title || '').trim() || 'Untitled Build',
    description: value?.description || null,
    isPublic:
      value?.isPublic === true ||
      value?.isPublic === '1' ||
      Number(value?.isPublic || 0) === 1,
    updatedAt: Number(value?.updatedAt || 0),
    createdAt: Number(value?.createdAt || 0)
  };
}

function getForkHistoryBuildPath(
  build: BuildProjectListItemData,
  isOwner: boolean
) {
  if (isOwner || !build.isPublic) {
    return getBuildWorkspacePath(build);
  }
  return `/app/${build.id}`;
}

function getHistoryStepLabel({
  builds,
  index
}: {
  builds: BuildProjectListItemData[];
  index: number;
}) {
  if (index === 0) return 'Current';
  const childBuild = builds[index - 1];
  const parentBuild = builds[index];
  if (
    isContributionBranch(childBuild) &&
    isContributionParent({ branchBuild: childBuild, parentBuild })
  ) {
    return 'Branched from';
  }
  if (index === builds.length - 1) return 'Original';
  return 'Forked from';
}

function isContributionBranch(build: BuildProjectListItemData | undefined) {
  const status = String(build?.contributionStatus || 'none');
  return status !== 'none';
}

function isContributionParent({
  branchBuild,
  parentBuild
}: {
  branchBuild: BuildProjectListItemData;
  parentBuild: BuildProjectListItemData | undefined;
}) {
  const parentBuildId = Number(parentBuild?.id || 0);
  if (parentBuildId <= 0) return false;
  return (
    Number(branchBuild.contributionRootBuildId || 0) === parentBuildId ||
    Number(branchBuild.sourceBuildId || 0) === parentBuildId
  );
}
