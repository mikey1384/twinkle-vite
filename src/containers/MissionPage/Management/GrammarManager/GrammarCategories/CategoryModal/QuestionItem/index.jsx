import { useState } from 'react';
import PropTypes from 'prop-types';
import { mobileMaxWidth } from '~/constants/css';
import FilterBar from '~/components/FilterBar';
import Question from './Question';
import { css } from '@emotion/css';

QuestionItem.propTypes = {
  question: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
};
export default function QuestionItem({ index, question }) {
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
      <Question question={question} />
    </div>
  );
}
