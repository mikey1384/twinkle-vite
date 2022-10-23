import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

Questions.propTypes = {
  approvedQuestions: PropTypes.array.isRequired,
  pendingQuestions: PropTypes.array.isRequired,
  onSetQuestionObj: PropTypes.func.isRequired
};

export default function Questions({
  approvedQuestions,
  onSetQuestionObj,
  pendingQuestions
}) {
  const approveGoogleQuestion = useAppContext(
    (v) => v.requestHelpers.approveGoogleQuestion
  );
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
              width: '100%',
              position: 'relative',
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
            {activeTab === 'pending' && (
              <div
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '1rem',
                  display: 'flex'
                }}
              >
                <Button
                  color="green"
                  skeuomorphic
                  opacity={0.5}
                  onClick={() => handleApprove(question.id)}
                >
                  <Icon icon="check" />
                </Button>
                <Button
                  color="cranberry"
                  skeuomorphic
                  opacity={0.5}
                  style={{ marginLeft: '1rem' }}
                  onClick={() => console.log('clicked')}
                >
                  <Icon icon="trash-alt" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  async function handleApprove(questionId) {
    await approveGoogleQuestion(questionId);
    onSetQuestionObj((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isApproved: true
      }
    }));
  }
}
