import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import GrammarReview from './GrammarReview';
import FilterBar from '~/components/FilterBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import GrammarRankings from './GrammarRankings';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';

RepeatMissionAddon.propTypes = {
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

export default function RepeatMissionAddon({
  mission,
  onSetMissionState
}: {
  mission: any;
  onSetMissionState: (v: any) => void;
}) {
  const loadGrammarAttempts = useAppContext(
    (v) => v.requestHelpers.loadGrammarAttempts
  );
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const userId = useKeyContext((v) => v.myState.userId);
  const [loadingReview, setLoadingReview] = useState(false);
  const {
    grammarReviewPrevUserId,
    grammarReviewLoaded,
    grammarReviewTab = 'gotWrong'
  } = mission;
  const activeTab = useMemo(() => {
    return mission.selectedAddonTab || 'grammarReview';
  }, [mission.selectedAddonTab]);

  useEffect(() => {
    init();
    async function init() {
      setLoadingReview(true);
      const {
        questionObj,
        gotWrongAttempts,
        gotRightAttempts,
        gotWrongLoadMoreButton,
        gotRightLoadMoreButton
      } = await loadGrammarAttempts();
      if (!grammarReviewLoaded || userId !== grammarReviewPrevUserId) {
        onSetMissionState({
          missionId: mission.id,
          newState: {
            grammarReviewPrevUserId: userId,
            grammarReviewTab:
              gotWrongAttempts.length > 0 ? 'gotWrong' : 'gotRight',
            questionObj: {
              ...mission.questionObj,
              ...questionObj
            },
            gotWrongAttempts,
            gotRightAttempts,
            gotWrongLoadMoreButtonShown: gotWrongLoadMoreButton,
            gotRightLoadMoreButtonShown: gotRightLoadMoreButton,
            grammarReviewLoaded: true,
            selectedAddonTab:
              gotWrongAttempts.length > 0 ? 'grammarReview' : 'rankings'
          }
        });
      }
      setLoadingReview(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, grammarReviewPrevUserId, grammarReviewLoaded, mission.id]);

  const missionAttemptExist = useMemo(() => {
    return (
      (mission.gotWrongAttempts?.length || 0) +
        (mission.gotRightAttempts?.length || 0) >
        0 || myAttempts[mission.id]?.status === 'pass'
    );
  }, [mission, myAttempts]);

  return (
    <div style={{ width: '100%' }}>
      {(!mission.started || mission.failed) && (
        <ErrorBoundary componentPath="MissionPage/Main/RepeatMissionAddons/index">
          {missionAttemptExist && (
            <FilterBar style={{ marginTop: '1.5rem' }} bordered>
              <nav
                className={activeTab === 'grammarReview' ? 'active' : ''}
                onClick={() =>
                  onSetMissionState({
                    missionId: mission.id,
                    newState: { selectedAddonTab: 'grammarReview' }
                  })
                }
              >
                Review
              </nav>
              <nav
                className={activeTab === 'rankings' ? 'active' : ''}
                onClick={() =>
                  onSetMissionState({
                    missionId: mission.id,
                    newState: { selectedAddonTab: 'rankings' }
                  })
                }
              >
                Rankings
              </nav>
            </FilterBar>
          )}
          {activeTab === 'grammarReview' && missionAttemptExist && (
            <GrammarReview
              activeTab={grammarReviewTab}
              loadingReview={loadingReview}
              mission={mission}
              onSetMissionState={onSetMissionState}
              style={{ marginTop: '1rem' }}
            />
          )}
          {(activeTab === 'rankings' || !missionAttemptExist) && (
            <GrammarRankings mission={mission} myAttempts={myAttempts} />
          )}
        </ErrorBoundary>
      )}
    </div>
  );
}
