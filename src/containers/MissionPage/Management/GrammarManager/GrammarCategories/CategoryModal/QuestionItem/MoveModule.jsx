import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';

MoveModule.propTypes = {
  categories: PropTypes.array.isRequired,
  questionId: PropTypes.number.isRequired,
  onMoveQuestion: PropTypes.func.isRequired
};

export default function MoveModule({ categories, questionId, onMoveQuestion }) {
  const updateGrammarQuestionCategory = useAppContext(
    (v) => v.requestHelpers.updateGrammarQuestionCategory
  );

  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center',
        padding: '1rem',
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      {categories.map((category, index) => (
        <div style={{ marginTop: index === 0 ? 0 : '2rem' }} key={index}>
          <span
            onClick={() => handleMoveQuestion(category)}
            className={css`
              line-height: 2;
              width: auto;
              cursor: pointer;
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
    </div>
  );

  async function handleMoveQuestion(category) {
    await updateGrammarQuestionCategory({ questionId, category });
    onMoveQuestion(questionId);
  }
}
