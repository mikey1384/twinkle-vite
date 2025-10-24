import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import QuestionContent from './QuestionContent';
import QuestionEditForm from './QuestionEditForm';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';

export default function QuestionListItem({
  onApproveQuestion,
  onDeleteQuestion,
  onEditQuestion,
  onSetIsEditing,
  question,
  style
}: {
  onApproveQuestion: (v: any) => void;
  onDeleteQuestion: (v: any) => void;
  onEditQuestion: (v: any) => void;
  onSetIsEditing: (v: boolean) => void;
  question: any;
  style?: React.CSSProperties;
}) {
  const approveGrammarQuestion = useAppContext(
    (v) => v.requestHelpers.approveGrammarQuestion
  );
  const deleteGrammarQuestion = useAppContext(
    (v) => v.requestHelpers.deleteGrammarQuestion
  );
  const correctChoice = useMemo(() => {
    return question.choices[question.answerIndex];
  }, [question.answerIndex, question.choices]);
  const wrongChoices = useMemo(() => {
    return question.choices.filter(
      (_: any, index: number) => index !== question.answerIndex
    );
  }, [question.answerIndex, question.choices]);

  return (
    <div
      style={style}
      className={css`
        width: 100%;
        background: #fff;
        border-radius: ${borderRadius};
        padding: 1.5rem 1rem 1.5rem 1rem;
        border: 1px solid var(--ui-border);
        @media (max-width: ${mobileMaxWidth}) {
          border-left: 0;
          border-right: 0;
          border-radius: 0;
        }
      `}
    >
      {question.isEditing ? (
        <QuestionEditForm
          onEditQuestion={onEditQuestion}
          correctChoice={correctChoice}
          leftSideText={question.question.split('_____')[0]}
          rightSideText={question.question.split('_____')[1]}
          wrongChoice1={wrongChoices[0]}
          wrongChoice2={wrongChoices[1]}
          wrongChoice3={wrongChoices[2]}
          questionId={question.id}
          onCancel={() => onSetIsEditing(false)}
        />
      ) : (
        <QuestionContent
          correctChoice={correctChoice}
          wrongChoices={wrongChoices}
          question={question}
        />
      )}
      {!question.isEditing && (
        <div
          style={{
            marginTop: '4rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Button
            style={{
              width: '50%',
              fontSize: '1.7rem'
            }}
            variant="solid"
            tone="raised"
            color="darkerGray"
            onClick={() => onSetIsEditing(true)}
          >
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '0.7rem' }}>Edit</span>
          </Button>
          <Button
            style={{ width: '50%', fontSize: '1.7rem', marginTop: '1rem' }}
            variant="soft"
            tone="raised"
            color={!question.isApproved ? 'darkBlue' : 'rose'}
            onClick={handleApprove}
          >
            {!question.isApproved ? 'Approve' : 'Disapprove'}
          </Button>
          {!question.isApproved && (
            <Button
              style={{ width: '50%', fontSize: '1.7rem', marginTop: '5rem' }}
              color="rose"
              variant="soft"
              tone="raised"
              onClick={handleDelete}
            >
              <Icon icon="trash-alt" />
              <span style={{ marginLeft: '0.7rem' }}>Delete</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );

  async function handleApprove() {
    const success = await approveGrammarQuestion({
      questionId: question.id,
      isApproved: !question.isApproved
    });
    if (success) {
      onApproveQuestion(!question.isApproved);
    }
  }

  async function handleDelete() {
    const success = await deleteGrammarQuestion(question.id);
    if (success) {
      onDeleteQuestion(question.id);
    }
  }
}
