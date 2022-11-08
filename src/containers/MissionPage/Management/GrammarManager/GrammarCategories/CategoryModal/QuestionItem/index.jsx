import { useState } from 'react';
import PropTypes from 'prop-types';
import { mobileMaxWidth } from '~/constants/css';
import FilterBar from '~/components/FilterBar';
import Question from './Question';
import { css } from '@emotion/css';
import MoveModule from './MoveModule';

QuestionItem.propTypes = {
  categories: PropTypes.array.isRequired,
  question: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
};
export default function QuestionItem({ categories, index, question }) {
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
        bordered
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
        <MoveModule categories={categories} />
      )}
    </div>
  );
}
