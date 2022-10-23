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
  onSetQuestionIds: PropTypes.func.isRequired,
  onSetQuestionObj: PropTypes.func.isRequired
};

export default function Questions({
  approvedQuestions,
  onSetQuestionIds,
  onSetQuestionObj,
  pendingQuestions
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDisapproving, setIsDisapproving] = useState(false);
  const approveGoogleQuestion = useAppContext(
    (v) => v.requestHelpers.approveGoogleQuestion
  );
  const disapproveGoogleQuestion = useAppContext(
    (v) => v.requestHelpers.disapproveGoogleQuestion
  );
  const deleteGoogleQuestion = useAppContext(
    (v) => v.requestHelpers.deleteGoogleQuestion
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
        {displayedQuestions.length > 0 ? (
          displayedQuestions.map((question, index) => (
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
              {activeTab === 'pending' ? (
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
                    disabled={isApproving}
                    skeuomorphic
                    opacity={0.5}
                    onClick={() => handleApprove(question.id)}
                  >
                    <Icon icon="check" />
                  </Button>
                  <Button
                    color="cranberry"
                    disabled={isDeleting}
                    skeuomorphic
                    opacity={0.5}
                    style={{ marginLeft: '1rem' }}
                    onClick={() => handleDelete(question.id)}
                  >
                    <Icon icon="trash-alt" />
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '1rem',
                    display: 'flex'
                  }}
                >
                  <Button
                    color="cranberry"
                    disabled={isDisapproving}
                    skeuomorphic
                    opacity={0.5}
                    onClick={() => handleDisApprove(question.id)}
                  >
                    <Icon icon="ban" />
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            style={{
              fontSize: '2rem',
              textAlign: 'center',
              marginTop: '10rem'
            }}
          >
            No {activeTab} questions
          </div>
        )}
      </div>
    </div>
  );

  async function handleApprove(questionId) {
    setIsApproving(true);
    await approveGoogleQuestion(questionId);
    onSetQuestionObj((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isApproved: true
      }
    }));
    setIsApproving(false);
  }

  async function handleDisApprove(questionId) {
    setIsDisapproving(true);
    await disapproveGoogleQuestion(questionId);
    onSetQuestionObj((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isApproved: false
      }
    }));
    setIsDisapproving(false);
  }

  async function handleDelete(questionId) {
    setIsDeleting(true);
    await deleteGoogleQuestion(questionId);
    onSetQuestionIds((prev) => prev.filter((id) => id !== questionId));
    onSetQuestionObj((prev) => {
      const newQuestionObj = { ...prev };
      delete newQuestionObj[questionId];
      return newQuestionObj;
    });
    setIsDeleting(false);
  }
}
