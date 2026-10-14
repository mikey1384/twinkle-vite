import React, { useMemo, useState } from 'react';
import usePendingAction from '~/helpers/hooks/usePendingAction';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

export default function Questions({
  approvedQuestions,
  onSetQuestionIds,
  onSetQuestionObj,
  pendingQuestions
}: {
  approvedQuestions: any[];
  onSetQuestionIds: (arg0: any) => void;
  onSetQuestionObj: (arg0: any) => void;
  pendingQuestions: any[];
}) {
  const { pendingAction, runAction } = usePendingAction();
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
        style={{
          marginTop: '2rem',
          fontSize: '1.6rem',
          height: '5rem'
        }}
      >
        <nav
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => {
            setActiveTab('pending');
          }}
        >
          Pending
        </nav>
        <nav
          className={activeTab === 'approved' ? 'active' : ''}
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
                border: '1px solid var(--ui-border)'
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
                    loading={pendingAction === 'approve:' + question.id}
                    color="green"
                    disabled={pendingAction !== null}
                    variant="soft"
                    tone="raised"
                    style={{ opacity: 0.5 }}
                    onClick={() => handleApprove(question.id)}
                  >
                    <Icon icon="check" />
                  </Button>
                  <Button
                    loading={pendingAction === 'delete:' + question.id}
                    color="cranberry"
                    disabled={pendingAction !== null}
                    variant="soft"
                    tone="raised"
                    style={{ marginLeft: '1rem', opacity: 0.5 }}
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
                    loading={pendingAction === 'disapprove:' + question.id}
                    color="cranberry"
                    disabled={pendingAction !== null}
                    variant="soft"
                    tone="raised"
                    style={{ opacity: 0.5 }}
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

  function handleApprove(...args: Parameters<typeof handleApproveRequest>) {
    return runAction('approve:' + args[0], () => handleApproveRequest(...args));
  }

  async function handleApproveRequest(questionId: number) {
    await approveGoogleQuestion(questionId);
    onSetQuestionObj((prev: any) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isApproved: true
      }
    }));
  }

  function handleDisApprove(...args: Parameters<typeof handleDisApproveRequest>) {
    return runAction('disapprove:' + args[0], () => handleDisApproveRequest(...args));
  }

  async function handleDisApproveRequest(questionId: number) {
    await disapproveGoogleQuestion(questionId);
    onSetQuestionObj((prev: any) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isApproved: false
      }
    }));
  }

  function handleDelete(...args: Parameters<typeof handleDeleteRequest>) {
    return runAction('delete:' + args[0], () => handleDeleteRequest(...args));
  }

  async function handleDeleteRequest(questionId: number) {
    await deleteGoogleQuestion(questionId);
    onSetQuestionIds((prev: any) =>
      prev.filter((id: number) => id !== questionId)
    );
    onSetQuestionObj((prev: any) => {
      const newQuestionObj = { ...prev };
      delete newQuestionObj[questionId];
      return newQuestionObj;
    });
  }
}
