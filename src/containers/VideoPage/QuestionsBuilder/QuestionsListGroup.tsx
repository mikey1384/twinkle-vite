import React, { useState } from 'react';
import PropTypes from 'prop-types';
import QuestionsListItem from './QuestionsListItem';
import RoundList from '~/components/RoundList';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';

const reorderQuestionsLabel = localize('reorderQuestions');

QuestionsListGroup.propTypes = {
  questionIds: PropTypes.array.isRequired,
  questions: PropTypes.object.isRequired,
  onReorderDone: PropTypes.func.isRequired,
  onReorderCancel: PropTypes.func.isRequired
};

export default function QuestionsListGroup({
  onReorderCancel,
  onReorderDone,
  questions,
  questionIds: initialQuestionIds
}: {
  onReorderCancel: () => void;
  onReorderDone: (questionIds: number[]) => void;
  questions: { [key: number]: any };
  questionIds: number[];
}) {
  const [questionIds, setQuestionIds] = useState(initialQuestionIds);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <h3 style={{ color: Color.darkerGray() }}>{reorderQuestionsLabel}</h3>
      <RoundList style={{ marginTop: '2rem' }}>
        {questionIds.map((questionId) => (
          <QuestionsListItem
            key={questionId}
            item={questions[questionId]}
            questionId={Number(questionId)}
            onMove={handleMove}
          />
        ))}
      </RoundList>
      <div style={{ marginTop: '2rem', display: 'flex' }}>
        <Button
          transparent
          style={{ marginRight: '1rem' }}
          onClick={onReorderCancel}
        >
          Cancel
        </Button>
        <Button color="blue" onClick={handleReorderDone}>
          Done
        </Button>
      </div>
    </div>
  );

  function handleMove({
    sourceId,
    targetId
  }: {
    sourceId: number;
    targetId: number;
  }) {
    const newIndices = [...questionIds];
    const sourceIndex = newIndices.indexOf(sourceId);
    const targetIndex = newIndices.indexOf(targetId);
    newIndices.splice(sourceIndex, 1);
    newIndices.splice(targetIndex, 0, sourceId);
    setQuestionIds(newIndices);
  }

  function handleReorderDone() {
    onReorderDone(questionIds);
  }
}
