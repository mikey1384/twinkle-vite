import { useState } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
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
      <div
        style={{
          padding: '1rem',
          border: `1px solid ${Color.borderGray()}`
        }}
        key={question.id}
      >
        {question.content}
        {question.choices.map((choice, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '1rem'
            }}
          >
            <span>{choice.label}</span>
            {choice.isAnswer && (
              <span
                style={{
                  marginLeft: '1rem',
                  color: Color.green()
                }}
              >
                <Icon icon="check" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
