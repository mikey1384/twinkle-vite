import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Form from './Form';
import Loading from '~/components/Loading';
import Submitted from './Submitted';
import { useAppContext, useKeyContext } from '~/contexts';

export default function FormModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const submitDobForApproval = useAppContext(
    (v) => v.requestHelpers.submitDobForApproval
  );
  const checkDobApprovalSubmission = useAppContext(
    (v) => v.requestHelpers.checkDobApprovalSubmission
  );
  const [dob, setDob] = useState('');
  const [submittedDob, setSubmittedDob] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean | null>(null);

  useEffect(() => {
    init();
    async function init() {
      const {
        isSubmitted: dobSubmitted,
        content,
        status
      } = await checkDobApprovalSubmission();
      setSubmittedDob(content);
      setSubmitStatus(status);
      setIsSubmitted(dobSubmitted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal onHide={onHide}>
      <header>Additional Profile Details</header>
      <main>
        {isSubmitted === null ? (
          <Loading />
        ) : isSubmitted ? (
          <Submitted status={submitStatus} dob={submittedDob} />
        ) : (
          <Form dob={dob} onSetDob={setDob} />
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
        <Button disabled={!dob} color={doneColor} onClick={handleSubmit}>
          Submit
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    await submitDobForApproval(dob);
    onHide();
  }
}
