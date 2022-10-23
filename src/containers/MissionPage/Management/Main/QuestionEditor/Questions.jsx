import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import FilterBar from '~/components/FilterBar';

Questions.propTypes = {
  approvedQuestions: PropTypes.array.isRequired,
  pendingQuestions: PropTypes.array.isRequired
};

export default function Questions({ approvedQuestions, pendingQuestions }) {
  const [activeTab, setActiveTab] = useState('pending');
  const displayedQuestions = useMemo(
    () => (activeTab === 'pending' ? pendingQuestions : approvedQuestions),
    [activeTab, approvedQuestions, pendingQuestions]
  );
  return (
    <div style={{ marginTop: '3rem' }}>
      <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>
        Registered questions
      </p>
      <FilterBar
        bordered
        style={{
          marginTop: '2rem',
          fontSize: '1.6rem',
          height: '5rem'
        }}
      >
        <nav
          className={activeTab === 'pending' ? 'active' : null}
          onClick={() => {
            setActiveTab('pending');
          }}
        >
          Pending
        </nav>
        <nav
          className={activeTab === 'approved' ? 'active' : null}
          onClick={() => {
            setActiveTab('approved');
          }}
        >
          Approved
        </nav>
      </FilterBar>
      <div style={{ marginTop: '1.7rem' }}>
        {displayedQuestions.map((question, index) => (
          <div
            style={{
              background: '#fff',
              marginTop: index === 0 ? '0' : '1rem',
              padding: '2rem',
              fontSize: '1.7rem',
              textAlign: 'center',
              border: `1px solid ${Color.borderGray()}`
            }}
            key={question.id}
          >
            {question.content}
          </div>
        ))}
      </div>
    </div>
  );
}
