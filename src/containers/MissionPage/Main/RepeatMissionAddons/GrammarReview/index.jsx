import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import QuestionListItem from './QuestionListItem';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

GrammarReview.propTypes = {
  activeTab: PropTypes.string,
  loadingReview: PropTypes.bool,
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function GrammarReview({
  activeTab,
  loadingReview,
  mission,
  onSetMissionState,
  style
}) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const loadMoreGrammarAttempts = useAppContext(
    (v) => v.requestHelpers.loadMoreGrammarAttempts
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const { [`${activeTab}LoadMoreButtonShown`]: loadMoreButtonShown } = mission;

  return (
    <ErrorBoundary
      componentPath="MissionPage/Main/RepeatMissionAddons/GrammarReview/index"
      style={style}
    >
      {loadingReview ? (
        <Loading />
      ) : (
        <>
          <FilterBar
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
            style={{ marginTop: '1rem' }}
            bordered
          >
            <nav
              className={activeTab === 'gotWrong' ? 'active' : ''}
              onClick={() =>
                onSetMissionState({
                  missionId: mission.id,
                  newState: { grammarReviewTab: 'gotWrong' }
                })
              }
            >
              Questions You Got Wrong
            </nav>
            <nav
              className={activeTab === 'gotRight' ? 'active' : ''}
              onClick={() =>
                onSetMissionState({
                  missionId: mission.id,
                  newState: { grammarReviewTab: 'gotRight' }
                })
              }
            >
              Questions You Got Right
            </nav>
          </FilterBar>
          {mission[`${activeTab}Attempts`]?.length === 0 ? (
            <div
              style={{
                marginTop: '10rem',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                width: '100%',
                textAlign: 'center'
              }}
            >
              {activeTab === 'gotWrong'
                ? `You didn't get any question wrong`
                : `You didn't get any question right`}
            </div>
          ) : (
            <>
              {mission[`${activeTab}Attempts`]?.map((attempt, index) => {
                return (
                  <QuestionListItem
                    key={attempt.id}
                    question={mission.questionObj[attempt.rootId]}
                    style={{ marginTop: index === 0 ? 0 : '1rem' }}
                  />
                );
              })}
            </>
          )}
          {loadMoreButtonShown && (
            <LoadMoreButton
              style={{ marginTop: '2rem', fontSize: '1.7rem' }}
              filled
              color={loadMoreButtonColor}
              loading={loadingMore}
              onClick={handleLoadMore}
            />
          )}
        </>
      )}
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const currentAttempts = mission[`${activeTab}Attempts`];
    const {
      questionObj,
      [`${activeTab}Attempts`]: attempts,
      loadMoreButton
    } = await loadMoreGrammarAttempts({
      activeTab,
      lastTimeStamp: currentAttempts[currentAttempts.length - 1].timeStamp
    });
    onSetMissionState({
      missionId: mission.id,
      newState: {
        questionObj: {
          ...mission.questionObj,
          ...questionObj
        },
        [`${activeTab}Attempts`]: currentAttempts.concat(attempts),
        [`${activeTab}LoadMoreButtonShown`]: loadMoreButton
      }
    });
    setLoadingMore(false);
  }
}
