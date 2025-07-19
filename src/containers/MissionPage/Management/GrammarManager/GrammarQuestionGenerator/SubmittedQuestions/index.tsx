import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import QuestionListItem from './QuestionListItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext, useKeyContext } from '~/contexts';

SubmittedQuestions.propTypes = {
  style: PropTypes.object,
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired
};

export default function SubmittedQuestions({
  style,
  mission,
  onSetMissionState
}: {
  style?: React.CSSProperties;
  mission: any;
  onSetMissionState: (v: any) => void;
}) {
  const isAdmin = useKeyContext((v) => v.myState.isAdmin);
  const {
    managementTab: activeTab = 'pending',
    loadMoreGrammarQuestionsButton: loadMoreButton
  } = mission;
  const loadGrammarQuestions = useAppContext(
    (v) => v.requestHelpers.loadGrammarQuestions
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    if (isAdmin) {
      init();
    }
    async function init() {
      setLoading(true);
      const {
        questionObj,
        [`${activeTab}QuestionIds`]: questionIds,
        loadMoreButton
      } = await loadGrammarQuestions({ activeTab });
      onSetMissionState({
        missionId: mission.id,
        newState: {
          [`${activeTab}QuestionIds`]: questionIds,
          questionObj: { ...mission.questionObj, ...questionObj },
          loadMoreGrammarQuestionsButton: loadMoreButton
        }
      });
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin]);

  return (
    <div style={style}>
      <FilterBar
        bordered
        style={{
          fontSize: '1.6rem',
          height: '5rem'
        }}
      >
        <nav
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => {
            onSetMissionState({
              missionId: mission.id,
              newState: { managementTab: 'pending' }
            });
          }}
        >
          Pending
        </nav>
        <nav
          className={activeTab === 'approved' ? 'active' : ''}
          onClick={() => {
            onSetMissionState({
              missionId: mission.id,
              newState: { managementTab: 'approved' }
            });
          }}
        >
          Approved
        </nav>
      </FilterBar>
      {loading ? (
        <Loading />
      ) : mission[`${activeTab}QuestionIds`]?.length === 0 ? (
        <div
          style={{
            marginTop: '10rem',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            width: '100%',
            textAlign: 'center'
          }}
        >
          {`There are no ${activeTab} questions`}
        </div>
      ) : (
        <>
          {mission[`${activeTab}QuestionIds`]?.map(
            (questionId: number, index: number) => {
              const question = mission.questionObj[questionId];
              return (
                <QuestionListItem
                  key={questionId}
                  question={question}
                  onSetIsEditing={(isEditing) =>
                    onSetMissionState({
                      missionId: mission.id,
                      newState: {
                        questionObj: {
                          ...mission.questionObj,
                          [questionId]: {
                            ...mission.questionObj[questionId],
                            isEditing
                          }
                        }
                      }
                    })
                  }
                  onEditQuestion={(editedQuestion) => {
                    onSetMissionState({
                      missionId: mission.id,
                      newState: {
                        questionObj: {
                          ...mission.questionObj,
                          [questionId]: {
                            ...mission.questionObj[questionId],
                            ...editedQuestion,
                            isEditing: false
                          }
                        }
                      }
                    });
                  }}
                  onApproveQuestion={(isApproved) =>
                    onSetMissionState({
                      missionId: mission.id,
                      newState: {
                        [`${isApproved ? 'pending' : 'approved'}QuestionIds`]:
                          mission[
                            `${isApproved ? 'pending' : 'approved'}QuestionIds`
                          ].filter((id: number) => id !== questionId),
                        questionObj: {
                          ...mission.questionObj,
                          [questionId]: {
                            ...mission.questionObj[questionId],
                            isApproved
                          }
                        }
                      }
                    })
                  }
                  onDeleteQuestion={(questionId) =>
                    onSetMissionState({
                      missionId: mission.id,
                      newState: {
                        [`${activeTab}QuestionIds`]: mission[
                          `${activeTab}QuestionIds`
                        ].filter((id: number) => id !== questionId),
                        questionObj: {
                          ...mission.questionObj,
                          [questionId]: null
                        }
                      }
                    })
                  }
                  style={{ marginTop: index === 0 ? 0 : '1rem' }}
                />
              );
            }
          )}
        </>
      )}
      {loadMoreButton && (
        <LoadMoreButton
          style={{ marginTop: '2rem', fontSize: '1.7rem' }}
          filled
          color="green"
          loading={loadingMore}
          onClick={handleLoadMoreQuestions}
        />
      )}
    </div>
  );

  async function handleLoadMoreQuestions() {
    setLoadingMore(true);
    const lastQuestionId =
      mission[`${activeTab}QuestionIds`]?.[
        mission[`${activeTab}QuestionIds`]?.length - 1
      ] || null;
    if (!lastQuestionId) return;
    const {
      questionObj,
      [`${activeTab}QuestionIds`]: loadedQuestionIds,
      loadMoreButton
    } = await loadGrammarQuestions({ activeTab, lastQuestionId });
    onSetMissionState({
      missionId: mission.id,
      newState: {
        [`${activeTab}QuestionIds`]:
          mission[`${activeTab}QuestionIds`].concat(loadedQuestionIds),
        questionObj: { ...mission.questionObj, ...questionObj },
        loadMoreGrammarQuestionsButton: loadMoreButton
      }
    });
    setLoadingMore(false);
  }
}
