import { useState } from 'react';
import PropTypes from 'prop-types';
import { mobileMaxWidth } from '~/constants/css';
import FilterBar from '~/components/FilterBar';
import Question from './Question';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import MoveModule from './MoveModule';

QuestionItem.propTypes = {
  categories: PropTypes.array.isRequired,
  question: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onMoveQuestion: PropTypes.func.isRequired
};

const deviceIsMobile = isMobile(navigator);

export default function QuestionItem({
  categories,
  index,
  question,
  onMoveQuestion
}) {
  const [activeTab, setActiveTab] = useState('question');
  return (
    <div
      style={{ marginTop: index === 0 ? 0 : '5rem' }}
      className={css`
        width: 60%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      <FilterBar
        bordered={!deviceIsMobile}
        style={{
          fontSize: '1.3rem',
          height: '3.5rem'
        }}
      >
        <nav
          className={activeTab === 'question' ? 'active' : ''}
          onClick={() => {
            setActiveTab('question');
          }}
        >
          Question
        </nav>
        <nav
          className={activeTab === 'move' ? 'active' : ''}
          onClick={() => {
            setActiveTab('move');
          }}
        >
          Move To
        </nav>
      </FilterBar>
      {activeTab === 'question' ? (
        <Question question={question} />
      ) : (
        <MoveModule
          questionId={question.id}
          categories={categories}
          onMoveQuestion={onMoveQuestion}
        />
      )}
    </div>
  );
}
