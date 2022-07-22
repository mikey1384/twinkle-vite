import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useInputContext } from '~/contexts';
import {
  addEmoji,
  exceedsCharLimit,
  finalizeEmoji
} from '~/helpers/stringHelpers';

ApproveInterface.propTypes = {
  activeTab: PropTypes.string.isRequired,
  attempt: PropTypes.object.isRequired,
  managementObj: PropTypes.object.isRequired,
  onSetManagementObj: PropTypes.func.isRequired,
  onSetAttemptObj: PropTypes.func.isRequired
};

export default function ApproveInterface({
  activeTab,
  attempt,
  managementObj,
  onSetManagementObj,
  onSetAttemptObj
}) {
  const uploadMissionFeedback = useAppContext(
    (v) => v.requestHelpers.uploadMissionFeedback
  );
  const state = useInputContext((v) => v.state);
  const onSetMissionFeedbackForm = useInputContext(
    (v) => v.actions.onSetMissionFeedbackForm
  );
  const inputState = useMemo(
    () =>
      state[`mission-feedback-${attempt.id}`] || {
        feedback: '',
        status: ''
      },
    [attempt.id, state]
  );
  const statusRef = useRef(inputState.status || '');
  const [status, setStatus] = useState(inputState.status || '');
  const feedbackRef = useRef(inputState.feedback || '');
  const [feedback, setFeedback] = useState(inputState.feedback || '');

  const feedbackExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'rewardComment',
        text: feedback
      }),
    [feedback]
  );

  useEffect(() => {
    return function cleanUp() {
      onSetMissionFeedbackForm({
        attemptId: attempt.id,
        form: {
          feedback: feedbackRef.current,
          status: statusRef.current
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ marginTop: '2rem' }}>
      <div
        style={{
          marginTop: '2rem',
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Button
          filled={status === 'fail'}
          onClick={() => handleSetStatus('fail')}
          color="rose"
        >
          <Icon icon="thumbs-down" />
          <span style={{ marginLeft: '1rem' }}>Reject</span>
        </Button>
        <Button
          filled={status === 'pass'}
          onClick={() => handleSetStatus('pass')}
          color="green"
          style={{ marginLeft: '1rem' }}
        >
          <Icon icon="thumbs-up" />
          <span style={{ marginLeft: '1rem' }}>Approve</span>
        </Button>
      </div>
      {status && (
        <div
          style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '2rem' }}>Feedback:</div>
          <Textarea
            minRows={3}
            value={feedback}
            onChange={(event) => {
              handleSetFeedback(addEmoji(event.target.value));
            }}
            placeholder={`Explain why you are approving/rejecting this mission attempt...`}
            style={{ marginTop: '1rem', ...feedbackExceedsCharLimit?.style }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              width: '100%'
            }}
          >
            <Button
              style={{ marginTop: '1.5rem', fontSize: '2rem' }}
              color={status === 'pass' ? 'green' : 'rose'}
              filled
              onClick={handleConfirm}
            >
              <Icon icon={status === 'pass' ? 'thumbs-up' : 'thumbs-down'} />
              <span style={{ marginLeft: '1rem' }}>
                confirm {status === 'pass' ? 'approval' : 'rejection'}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  async function handleConfirm() {
    const success = await uploadMissionFeedback({
      attemptId: attempt.id,
      feedback: finalizeEmoji(feedback),
      status
    });
    if (success) {
      onSetManagementObj({
        [activeTab]: managementObj[activeTab].filter(
          (attemptId) => attemptId !== attempt.id
        )
      });
      onSetAttemptObj({
        [attempt.id]: {
          ...attempt,
          feedback,
          status
        }
      });
    }
  }

  function handleSetFeedback(text) {
    setFeedback(text);
    feedbackRef.current = text;
  }

  function handleSetStatus(status) {
    setStatus(status);
    statusRef.current = status;
  }
}
