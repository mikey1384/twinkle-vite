import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import type { BuildProjectListItemData } from '~/components/BuildProjectListItem';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

const MAX_PINNED_PROFILE_BUILDS = 10;

export default function SelectPinnedBuildsModal({
  currentlySelectedBuildIds,
  onHide,
  onSubmit
}: {
  currentlySelectedBuildIds: number[];
  onHide: () => void;
  onSubmit: (buildIds: number[]) => Promise<void> | void;
}) {
  const loadMyPublicBuildsForPinning = useAppContext(
    (v) => v.requestHelpers.loadMyPublicBuildsForPinning
  );
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableBuilds, setAvailableBuilds] = useState<BuildProjectListItemData[]>(
    []
  );
  const [selectedBuildIds, setSelectedBuildIds] = useState<number[]>(() =>
    normalizeBuildIds(currentlySelectedBuildIds)
  );

  useEffect(() => {
    let canceled = false;
    void init();

    async function init() {
      setLoading(true);
      try {
        const data = await loadMyPublicBuildsForPinning();
        if (canceled) return;
        const publicBuilds = Array.isArray(data?.builds) ? data.builds : [];
        setAvailableBuilds(publicBuilds);
        const publicBuildIdSet = new Set(
          publicBuilds.map((build: BuildProjectListItemData) => Number(build.id))
        );
        setSelectedBuildIds((prev) =>
          normalizeBuildIds(prev).filter((buildId) => publicBuildIdSet.has(buildId))
        );
      } catch (error) {
        console.error('Failed to load builds for pinning:', error);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderedBuilds = useMemo(() => {
    const selectedIndexById = new Map<number, number>();
    selectedBuildIds.forEach((buildId, index) => {
      selectedIndexById.set(buildId, index);
    });
    return [...availableBuilds].sort((a, b) => {
      const aSelectedIndex = selectedIndexById.get(Number(a.id));
      const bSelectedIndex = selectedIndexById.get(Number(b.id));
      if (aSelectedIndex != null && bSelectedIndex != null) {
        return aSelectedIndex - bSelectedIndex;
      }
      if (aSelectedIndex != null) return -1;
      if (bSelectedIndex != null) return 1;
      return Number(b.updatedAt || 0) - Number(a.updatedAt || 0);
    });
  }, [availableBuilds, selectedBuildIds]);

  return (
    <Modal
      modalKey="SelectPinnedBuilds"
      isOpen
      size="xl"
      onClose={() => {
        if (submitting) return;
        onHide();
      }}
      hasHeader={false}
      bodyPadding={0}
      allowOverflow
    >
      <LegacyModalLayout wrapped>
        <header>Pin Builds</header>
        <main>
          <div className={summaryClassName}>
            Choose up to {MAX_PINNED_PROFILE_BUILDS} public builds to show on your
            profile.
          </div>
          <div className={counterClassName}>
            {selectedBuildIds.length}/{MAX_PINNED_PROFILE_BUILDS} selected
          </div>
          {loading ? (
            <Loading />
          ) : orderedBuilds.length === 0 ? (
            <div className={emptyStateClassName}>
              You do not have any public builds to pin yet.
            </div>
          ) : (
            <div className={listClassName}>
              {orderedBuilds.map((build) => {
                const isSelected = selectedBuildIds.includes(Number(build.id));
                const isDisabled =
                  !isSelected &&
                  selectedBuildIds.length >= MAX_PINNED_PROFILE_BUILDS;
                return (
                  <button
                    key={build.id}
                    type="button"
                    className={`${buildRowClassName} ${
                      isSelected ? selectedBuildRowClassName : ''
                    } ${isDisabled ? disabledBuildRowClassName : ''}`}
                    onClick={() => handleToggleBuild(build.id)}
                    disabled={isDisabled || submitting}
                  >
                    <div className={buildRowHeaderClassName}>
                      <div className={buildRowTitleClassName}>{build.title}</div>
                      <div className={buildRowCheckClassName}>
                        <Icon
                          icon={isSelected ? 'check-square' : ['far', 'square']}
                        />
                      </div>
                    </div>
                    {build.description && (
                      <div className={buildRowDescriptionClassName}>
                        {build.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </main>
        <footer>
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            disabled={submitting}
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button loading={submitting} color={doneColor} onClick={handleSubmit}>
            Done
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  function handleToggleBuild(buildId: number) {
    setSelectedBuildIds((prev) => {
      if (prev.includes(buildId)) {
        return prev.filter((id) => id !== buildId);
      }
      if (prev.length >= MAX_PINNED_PROFILE_BUILDS) {
        return prev;
      }
      return [...prev, buildId];
    });
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(selectedBuildIds);
    } finally {
      setSubmitting(false);
    }
  }
}

function normalizeBuildIds(buildIds: number[]) {
  const normalized: number[] = [];
  const seen = new Set<number>();
  for (const rawBuildId of Array.isArray(buildIds) ? buildIds : []) {
    const buildId = Number(rawBuildId);
    if (!Number.isFinite(buildId) || buildId <= 0 || seen.has(buildId)) continue;
    seen.add(buildId);
    normalized.push(buildId);
  }
  return normalized;
}

const summaryClassName = css`
  width: 100%;
  color: ${Color.gray()};
  margin-bottom: 0.6rem;
  line-height: 1.5;
`;

const counterClassName = css`
  width: 100%;
  font-weight: bold;
  margin-bottom: 1.4rem;
`;

const listClassName = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const emptyStateClassName = css`
  min-height: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: ${Color.gray()};
  font-weight: bold;
`;

const buildRowClassName = css`
  width: 100%;
  border: 1px solid ${Color.borderGray()};
  border-radius: 1.2rem;
  background: white;
  padding: 1.3rem 1.4rem;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: ${Color.logoBlue()};
    box-shadow: 0 10px 24px -18px rgba(0, 0, 0, 0.35);
  }
`;

const selectedBuildRowClassName = css`
  border-color: ${Color.logoBlue()};
  box-shadow: 0 0 0 1px ${Color.logoBlue()};
`;

const disabledBuildRowClassName = css`
  opacity: 0.55;
  cursor: not-allowed;
`;

const buildRowHeaderClassName = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const buildRowTitleClassName = css`
  font-weight: bold;
  font-size: 1.6rem;
  color: ${Color.black()};
`;

const buildRowCheckClassName = css`
  flex-shrink: 0;
  color: ${Color.logoBlue()};
  font-size: 1.8rem;
`;

const buildRowDescriptionClassName = css`
  margin-top: 0.7rem;
  color: ${Color.gray()};
  line-height: 1.5;
`;
