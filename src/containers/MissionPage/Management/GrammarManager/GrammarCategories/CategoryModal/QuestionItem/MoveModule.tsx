import React, { useState } from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import Loading from '~/components/Loading';

export default function MoveModule({
  categories,
  questionId,
  onMoveQuestion
}: {
  categories: any[];
  questionId: number;
  onMoveQuestion: (v: number) => void;
}) {
  const [moving, setMoving] = useState(false);
  const updateGrammarQuestionCategory = useAppContext(
    (v) => v.requestHelpers.updateGrammarQuestionCategory
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        textAlign: 'center',
        padding: '1rem',
        opacity: moving ? 0.5 : 1,
        border: '1px solid var(--ui-border)'
      }}
    >
      {categories.length === 0 && (
        <div>
          <p>There is no category to move to</p>
        </div>
      )}
      {categories.map((category, index) => (
        <div style={{ marginTop: index === 0 ? 0 : '2rem' }} key={index}>
          <span
            onClick={() => (moving ? null : handleMoveQuestion(category))}
            className={css`
              line-height: 2;
              width: auto;
              cursor: ${moving ? 'not-allowed' : 'pointer'};
              color: ${Color.blue()};
              &:hover {
                text-decoration: underline;
              }
            `}
          >
            {category}
          </span>
        </div>
      ))}
      {moving ? <Loading style={{ position: 'absolute', top: 0 }} /> : null}
    </div>
  );

  async function handleMoveQuestion(category: string) {
    setMoving(true);
    await updateGrammarQuestionCategory({ questionId, category });
    onMoveQuestion(questionId);
    setMoving(false);
  }
}
