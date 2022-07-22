import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import QuestionBlock from './QuestionBlock';
import ButtonGroup from '~/components/Buttons/ButtonGroup';
import Button from '~/components/Button';
import QuestionsListGroup from './QuestionsListGroup';
import { isMobile } from '~/helpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import ReactPlayer from 'react-player';
import { css } from '@emotion/css';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';

const Styles = {
  Player: css`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  `,
  leftSection: css`
    width: 40%;
    height: auto;
    max-height: 100%;
    padding: 1rem;
    overflow-y: scroll;
    padding-right: 2rem;
  `,
  rightSection: css`
    width: 60%;
    height: auto;
    padding: 1rem;
    display: flex;
    justify-content: flex-end;
  `,
  videoContainer: css`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
  `,
  videoInterface: css`
    padding: 0 3rem;
    margin-top: 2rem;
  `
};

const addLabel = localize('add');
const pleaseClickDoneButtonBelowLabel = localize('pleaseClickDoneButtonBelow');
const pleaseEnterTitleLabel = localize('pleaseEnterTitle');
const pleaseMarkTheCorrectChoiceLabel = localize('pleaseMarkTheCorrectChoice');
const reorderLabel = localize('reorder');
const resetLabel = localize('reset');
const saveLabel = localize('save');
const submitLabel = localize('submit2');
const thereMustBeAtLeastTwoChoicesLabel = localize(
  'thereMustBeAtLeastTwoChoices'
);
const Backend = isMobile(navigator) ? TouchBackend : HTML5Backend;

QuestionsBuilder.propTypes = {
  onHide: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  questions: PropTypes.array.isRequired,
  title: PropTypes.string.isRequired,
  videoCode: PropTypes.string.isRequired
};

export default function QuestionsBuilder({
  onHide,
  onSubmit,
  questions: initialQuestions = [],
  title,
  videoCode
}) {
  const {
    success: { color: successColor },
    info: { color: infoColor }
  } = useKeyContext((v) => v.theme);
  const [reorderModeOn, setReorderModeOn] = useState(false);
  const [questions, setQuestions] = useState({});
  const [questionIds, setQuestionIds] = useState([]);
  const LeftMenuRef = useRef(null);
  const QuestionBlocksRef = useRef(null);
  const QuestionsRef = useRef([]);

  useEffect(() => {
    setQuestions(
      initialQuestions.length !== 0
        ? formatQuestions(initialQuestions)
        : newQuestion(0)
    );
    setQuestionIds(
      initialQuestions.length > 0
        ? initialQuestions.map((question, index) => index)
        : [0]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DndProvider backend={Backend}>
      <Modal closeWhenClickedOutside={false} large onHide={onHide}>
        <header>{title}</header>
        <main
          style={{
            flexDirection: 'row',
            justifyContent: reorderModeOn ? 'center' : 'space-between',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <section
            className={Styles.leftSection}
            ref={LeftMenuRef}
            style={{
              width: reorderModeOn && '80%',
              overflow: 'scroll',
              height: 'CALC(100vh - 21rem)'
            }}
          >
            {reorderModeOn ? (
              <QuestionsListGroup
                questions={questions}
                questionIds={questionIds}
                onMove={onQuestionsRearrange}
                onReorderDone={(questionIds) => {
                  setQuestionIds(questionIds);
                  setReorderModeOn(false);
                }}
                onReorderCancel={() => setReorderModeOn(false)}
              />
            ) : questionIds.length > 0 ? (
              <div ref={QuestionBlocksRef}>
                {questionIds.map((questionId, index) => {
                  const question = questions[questionId];
                  return (
                    <QuestionBlock
                      {...question}
                      key={index}
                      questionId={Number(questionId)}
                      hideErrorMsg={(id) => {
                        setQuestions({
                          ...questions,
                          [id]: {
                            ...questions[id],
                            errorMessage: ''
                          }
                        });
                      }}
                      questionIndex={index}
                      errorMessage={question.errorMessage}
                      innerRef={(ref) => {
                        QuestionsRef.current[questionId] = ref;
                      }}
                      onSelectChoice={onSelectChoice}
                      onRearrange={onChoicesRearrange}
                      onRemove={onRemoveQuestion}
                      onUndoRemove={onUndoRemove}
                      onEditStart={(questionId) => {
                        setQuestions({
                          ...questions,
                          [questionId]: {
                            ...questions[questionId],
                            onEdit: true
                          }
                        });
                      }}
                      onEditCancel={(questionId) => {
                        setQuestions({
                          ...questions,
                          [questionId]: {
                            ...questions[questionId],
                            errorMessage: '',
                            onEdit: false
                          }
                        });
                      }}
                      onEditDone={handleChoiceEditDone}
                    />
                  );
                })}
              </div>
            ) : null}
          </section>
          {!reorderModeOn && (
            <section className={Styles.rightSection}>
              <div className={Styles.videoContainer}>
                <ReactPlayer
                  url={`https://www.youtube.com/watch?v=${videoCode}`}
                  controls
                  width="100%"
                />
                <div className={Styles.videoInterface}>
                  <ButtonGroup
                    buttons={[
                      {
                        label: `+ ${addLabel}`,
                        filled: true,
                        onClick: onAddQuestion,
                        color: successColor
                      },
                      {
                        label: reorderLabel,
                        filled: true,
                        onClick: () => setReorderModeOn(true),
                        color: infoColor
                      },
                      {
                        label: resetLabel,
                        filled: true,
                        onClick: onReset,
                        color: 'orange'
                      }
                    ]}
                  />
                  <div
                    style={{
                      marginTop: '1rem',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <Button
                      color="logoBlue"
                      filled
                      onClick={handleSave}
                      style={{ fontSize: '2rem', marginRight: '1rem' }}
                    >
                      <Icon
                        style={{ marginRight: '0.7rem' }}
                        icon="cloud-upload-alt"
                      />
                      {saveLabel}
                    </Button>
                    <Button
                      color="blue"
                      filled
                      onClick={() => handleSave({ isSubmit: true })}
                      style={{ fontSize: '2rem' }}
                    >
                      {submitLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </Modal>
    </DndProvider>
  );

  function onAddQuestion() {
    setQuestions({
      ...questions,
      ...newQuestion(Object.keys(questions).length)
    });
    setQuestionIds(questionIds.concat(Object.keys(questions).length));
    setTimeout(() => {
      LeftMenuRef.current.scrollTop = QuestionBlocksRef.current.offsetHeight;
    }, 0);
  }

  function onRemoveQuestion(questionId) {
    setQuestions({
      ...questions,
      [questionId]: {
        ...questions[questionId],
        errorMessage: '',
        deleted: true
      }
    });
  }

  function onUndoRemove(questionId) {
    setQuestions({
      ...questions,
      [questionId]: {
        ...questions[questionId],
        deleted: false
      }
    });
  }

  function handleChoiceEditDone({
    questionId,
    choices,
    choiceIds,
    editedQuestionTitle
  }) {
    setQuestions({
      ...questions,
      [questionId]: {
        ...questions[questionId],
        errorMessage: '',
        choicesObj: choices,
        choiceIds,
        title: editedQuestionTitle,
        onEdit: false
      }
    });
  }

  function onQuestionsRearrange({ sourceId, targetId }) {
    const newQuestionOrder = [...questionIds];
    const sourceIndex = newQuestionOrder.indexOf(sourceId);
    const targetIndex = newQuestionOrder.indexOf(targetId);
    newQuestionOrder.splice(sourceIndex, 1);
    newQuestionOrder.splice(targetIndex, 0, sourceId);
    setQuestionIds(newQuestionOrder);
  }

  function onSelectChoice({ questionId, choiceId }) {
    setQuestions((questions) => ({
      ...questions,
      [questionId]: {
        ...questions[questionId],
        correctChoice: choiceId,
        errorMessage: ''
      }
    }));
  }

  function onChoicesRearrange({ questionIndex, sourceId, targetId }) {
    const newIndices = [...questions[questionIndex].choiceIds];
    const sourceIndex = newIndices.indexOf(sourceId);
    const targetIndex = newIndices.indexOf(targetId);
    newIndices.splice(sourceIndex, 1);
    newIndices.splice(targetIndex, 0, sourceId);
    setQuestions((questions) => ({
      ...questions,
      [questionIds[questionIndex]]: {
        ...questions[questionIds[questionIndex]],
        choiceIds: newIndices
      }
    }));
  }

  function onReset() {
    setQuestions(
      initialQuestions.length === 0
        ? newQuestion(0)
        : formatQuestions(initialQuestions)
    );
    setQuestionIds(
      initialQuestions.length > 0
        ? initialQuestions.map((question, index) => index)
        : [0]
    );
  }

  function handleSave({ isSubmit } = {}) {
    let errorObj = {
      questionId: null,
      message: '',
      onEdit: true
    };
    const errorHash = {
      notDone: {
        message: pleaseClickDoneButtonBelowLabel,
        onEdit: true
      },
      missingTitle: {
        message: pleaseEnterTitleLabel,
        onEdit: true
      },
      notEnoughChoices: {
        message: thereMustBeAtLeastTwoChoicesLabel,
        onEdit: true
      },
      invalidChoice: {
        message: pleaseMarkTheCorrectChoiceLabel,
        onEdit: false
      }
    };

    for (let i = 0; i < questionIds.length; i++) {
      if (!questions[i].deleted) {
        if (errorInQuestion(questions[i])) {
          errorObj = {
            questionId: i,
            message: errorHash[errorInQuestion(questions[i])].message,
            onEdit: errorHash[errorInQuestion(questions[i])].onEdit
          };
          break;
        }
      }
    }

    if (typeof errorObj.questionId === 'number') {
      setQuestions({
        ...questions,
        [errorObj.questionId]: {
          ...questions[errorObj.questionId],
          onEdit: errorObj.onEdit,
          errorMessage: errorObj.message
        }
      });
      setTimeout(
        () => QuestionsRef.current[errorObj.questionId].scrollIntoView(),
        0
      );
      return;
    }

    const finishedQuestions = questionIds
      .filter((questionId) => !questions[questionId].deleted)
      .map((questionId) => questions[questionId]);

    onSubmit(finishedQuestions);
    if (isSubmit) {
      onHide();
    }

    function errorInQuestion(question) {
      if (question.onEdit) return 'notDone';
      if (!question.title || stringIsEmpty(question.title)) {
        return 'missingTitle';
      }
      const validChoices = Object.keys(question.choicesObj)
        .map((id) => question.choicesObj[id])
        .filter((choice) => !!choice);
      if (validChoices.length < 2) {
        return 'notEnoughChoices';
      }
      if (!question.choicesObj[question.correctChoice]) {
        return 'invalidChoice';
      }
    }
  }

  function formatQuestions(questions) {
    let questionsObject = {};
    questions.forEach((question, index) => {
      questionsObject[index] = {
        correctChoice: question.correctChoice,
        title: question.title,
        onEdit: false,
        choicesObj: question.choices.reduce(
          (result, choice, index) => ({
            ...result,
            [index + 1]: choice || ''
          }),
          {}
        ),
        choiceIds: [1, 2, 3, 4, 5],
        errorMessage: '',
        deleted: false
      };
    });
    return questionsObject;
  }

  function newQuestion(questionId) {
    return {
      [questionId]: {
        title: '',
        onEdit: true,
        choicesObj: {
          1: '',
          2: '',
          3: '',
          4: '',
          5: ''
        },
        choiceIds: [0, 1, 2, 3, 4],
        errorMessage: '',
        deleted: false
      }
    };
  }
}
