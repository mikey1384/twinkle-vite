import React, { useEffect, useState } from 'react';
import Attempt from './Attempt';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import EmptyStateMessage from '~/components/EmptyStateMessage';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext } from '~/contexts';
import localize from '~/constants/localize';

const displayedStatus: {
  [key: string]: string;
} = {
  fail: 'rejected',
  pending: 'pending',
  pass: 'approved'
};

const pendingLabel = localize('pending');
const approvedLabel = localize('approved');
const rejectedLabel = localize('rejected');

export default function Attempts({
  attemptObj,
  managementObj,
  selectedTab,
  onSelectTab,
  onSetAttemptObj,
  onSetManagementObj
}: {
  attemptObj: any;
  managementObj: any;
  selectedTab: string;
  onSelectTab: (tab: string) => void;
  onSetAttemptObj: (arg0: any) => void;
  onSetManagementObj: (arg0: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMissionAttempts = useAppContext(
    (v) => v.requestHelpers.loadMissionAttempts
  );
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const {
        attemptObj,
        [`${selectedTab}AttemptIds`]: attemptIds,
        loadMoreButton
      } = await loadMissionAttempts({
        activeTab: selectedTab
      });
      onSetManagementObj({
        [selectedTab]: attemptIds,
        [`${selectedTab}LoadMoreButton`]: loadMoreButton
      });
      onSetAttemptObj(attemptObj);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);
  return (
    <div style={{ width: '100%' }}>
      <FilterBar
        style={{
          fontSize: '1.6rem',
          height: '5rem'
        }}
      >
        <nav
          className={selectedTab === 'pending' ? 'active' : ''}
          onClick={() => onSelectTab('pending')}
        >
          {pendingLabel}
        </nav>
        <nav
          className={selectedTab === 'pass' ? 'active' : ''}
          onClick={() => onSelectTab('pass')}
        >
          {approvedLabel}
        </nav>
        <nav
          className={selectedTab === 'fail' ? 'active' : ''}
          onClick={() => onSelectTab('fail')}
        >
          {rejectedLabel}
        </nav>
      </FilterBar>
      {loading ? (
        <Loading />
      ) : !managementObj[selectedTab] ||
        managementObj[selectedTab].length === 0 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '15rem',
            padding: '0 1rem'
          }}
        >
          <EmptyStateMessage style={{ width: '70rem', maxWidth: '100%' }}>
            {`There are no ${displayedStatus[selectedTab]} attempts`}
          </EmptyStateMessage>
        </div>
      ) : (
        <>
          {managementObj[selectedTab]?.map(
            (attemptId: number, index: number) => {
              const attempt = attemptObj[attemptId];
              return (
                <Attempt
                  key={attempt.id}
                  activeTab={selectedTab}
                  attempt={attempt}
                  managementObj={managementObj}
                  onSetManagementObj={onSetManagementObj}
                  onSetAttemptObj={onSetAttemptObj}
                  style={{ marginTop: index > 0 ? '1rem' : 0 }}
                />
              );
            }
          )}
        </>
      )}
      {managementObj[`${selectedTab}LoadMoreButton`] && !loading && (
        <LoadMoreButton
          style={{ marginTop: '2rem', fontSize: '1.7rem' }}
          filled
          loading={loadingMore}
          onClick={handleLoadMoreAttempts}
        />
      )}
    </div>
  );

  async function handleLoadMoreAttempts() {
    const currentAttemptIds = managementObj[selectedTab];
    const lastAttemptId = currentAttemptIds[currentAttemptIds.length - 1];
    setLoadingMore(true);
    const {
      attemptObj: newAttemptObj,
      [`${selectedTab}AttemptIds`]: attemptIds,
      loadMoreButton
    } = await loadMissionAttempts({
      activeTab: selectedTab,
      lastAttemptId,
      lastAttemptReviewTimeStamp: attemptObj[lastAttemptId]?.reviewTimeStamp
    });
    onSetAttemptObj(newAttemptObj);
    onSetManagementObj({
      [selectedTab]: [...currentAttemptIds, ...attemptIds],
      [`${selectedTab}LoadMoreButton`]: loadMoreButton
    });
    setLoadingMore(false);
  }
}
