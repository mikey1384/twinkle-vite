import React, { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Attempt from './Attempt';
import Loading from '~/components/Loading';
import EmptyStateMessage from '~/components/EmptyStateMessage';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext, useKeyContext } from '~/contexts';

const displayedStatus: Record<string, string> = {
  fail: 'rejected',
  pending: 'pending',
  pass: 'approved'
};

export default function Attempts({
  activeTab,
  mission,
  missionId,
  onSetMissionState
}: {
  activeTab: string;
  mission: any;
  missionId: number;
  onSetMissionState: (arg0: any) => void;
}) {
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMissionAttemptsForPage = useAppContext(
    (v) => v.requestHelpers.loadMissionAttemptsForPage
  );

  useEffect(() => {
    if (isAdmin) {
      initAttempts();
    }
    async function initAttempts() {
      setLoading(true);
      const {
        attemptObj,
        [`${activeTab}AttemptIds`]: attemptIds,
        loadMoreButton
      } = await loadMissionAttemptsForPage({
        activeTab,
        missionId
      });
      onSetMissionState({
        missionId,
        newState: {
          [`${activeTab}AttemptIds`]: attemptIds,
          attemptObj: { ...mission.attemptObj, ...attemptObj },
          loadMoreButton
        }
      });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin]);

  return (
    <ErrorBoundary componentPath="MissionPage/Management/Main/Attempts">
      {loading ? (
        <Loading />
      ) : !mission[`${activeTab}AttemptIds`] ||
        mission[`${activeTab}AttemptIds`].length === 0 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '15rem'
          }}
        >
          <EmptyStateMessage style={{ width: '70rem', maxWidth: '100%' }}>
            {`There are no ${displayedStatus[activeTab]} attempts`}
          </EmptyStateMessage>
        </div>
      ) : (
        <>
          {mission[`${activeTab}AttemptIds`]?.map(
            (attemptId: number, index: number) => {
              const attempt = mission.attemptObj[attemptId];
              return (
                <Attempt
                  key={attempt.id}
                  activeTab={activeTab}
                  attempt={attempt}
                  style={{ marginTop: index > 0 ? '1rem' : 0 }}
                  onSetMissionState={onSetMissionState}
                  mission={mission}
                />
              );
            }
          )}
        </>
      )}
      {mission.loadMoreButton && !loading && (
        <LoadMoreButton
          style={{ marginTop: '2rem', fontSize: '1.7rem' }}
          filled
          color="green"
          loading={loadingMore}
          onClick={handleLoadMoreAttempts}
        />
      )}
    </ErrorBoundary>
  );

  async function handleLoadMoreAttempts() {
    const currentAttemptIds = mission[`${activeTab}AttemptIds`];
    const lastAttemptId = currentAttemptIds[currentAttemptIds.length - 1];
    setLoadingMore(true);
    const {
      attemptObj,
      [`${activeTab}AttemptIds`]: attemptIds,
      loadMoreButton
    } = await loadMissionAttemptsForPage({
      activeTab,
      missionId,
      lastAttemptId,
      lastAttemptReviewTimeStamp:
        mission.attemptObj[lastAttemptId].reviewTimeStamp
    });
    onSetMissionState({
      missionId,
      newState: {
        [`${activeTab}AttemptIds`]: currentAttemptIds.concat(attemptIds),
        attemptObj: { ...mission.attemptObj, ...attemptObj },
        loadMoreButton
      }
    });
    setLoadingMore(false);
  }
}
