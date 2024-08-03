import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Form from './Form';
import Loading from '~/components/Loading';
import Submitted from './Submitted';
import { ADMIN_MANAGEMENT_LEVEL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';

export default function FormModal({ onHide }: { onHide: () => void }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const { managementLevel } = useKeyContext((v) => v.myState);
  const retryDobApproval = useAppContext(
    (v) => v.requestHelpers.retryDobApproval
  );
  const submitDobForApproval = useAppContext(
    (v) => v.requestHelpers.submitDobForApproval
  );
  const checkDobApprovalSubmission = useAppContext(
    (v) => v.requestHelpers.checkDobApprovalSubmission
  );
  const [approvalItems, setApprovalItems] = useState<{
    [key: string]: {
      key: string;
      label: string;
      inputType: 'date' | 'text' | 'checkbox';
      value: string;
      isSubmitted: boolean | null;
      submitStatus: string | null;
      submittedValue: string | null;
    };
  }>({
    dob: {
      key: 'dob',
      inputType: 'date',
      label: 'Date of Birth',
      value: '',
      isSubmitted: null,
      submitStatus: null,
      submittedValue: null
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tryingAgain, setTryingAgain] = useState(false);

  useEffect(() => {
    init();

    async function init() {
      const {
        isSubmitted: dobSubmitted,
        content,
        status
      } = await checkDobApprovalSubmission();
      setApprovalItems((prev) => ({
        ...prev,
        dob: {
          ...prev.dob,
          isSubmitted: dobSubmitted,
          submittedValue: content,
          submitStatus: status
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal onHide={onHide}>
      <header>Additional Profile Details</header>
      <main style={{ justifyContent: 'center', minHeight: '20vh' }}>
        {managementLevel >= ADMIN_MANAGEMENT_LEVEL ? (
          <div
            style={{ fontSize: '1.7rem' }}
          >{`You run this website. You don't need verification`}</div>
        ) : approvalItems.dob.isSubmitted === null ? (
          <Loading />
        ) : (
          Object.values(approvalItems).map((item) =>
            item.isSubmitted && !tryingAgain ? (
              <Submitted
                key={item.key}
                status={item.submitStatus}
                value={item.submittedValue}
                onTryAgain={() => handleTryAgain(item.key)}
              />
            ) : (
              <Form
                type={item.inputType}
                key={item.key}
                label={item.label}
                value={item.value}
                onChange={(value) => handleSetValue(item.key, value)}
              />
            )
          )
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
        <Button
          loading={isSubmitting}
          disabled={!canSubmit()}
          color={doneColor}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </footer>
    </Modal>
  );

  function canSubmit() {
    return Object.values(approvalItems).some(
      (item) => item.value && !item.isSubmitted
    );
  }

  function handleSetValue(key: string, value: string) {
    setApprovalItems((prev) => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  }

  function handleTryAgain(key: string) {
    setTryingAgain(true);
    setApprovalItems((prev) => ({
      ...prev,
      [key]: { ...prev[key], isSubmitted: false, submitStatus: null }
    }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      for (const item of Object.values(approvalItems)) {
        if (item.value && !item.isSubmitted) {
          if (item.key === 'dob') {
            if (tryingAgain) {
              await retryDobApproval(item.value);
            } else {
              await submitDobForApproval(item.value);
            }
            setApprovalItems((prev) => ({
              ...prev,
              dob: {
                ...prev.dob,
                isSubmitted: true,
                submitStatus: 'pending',
                value: ''
              }
            }));
          }
          // Add more conditions here for other approval items
        }
      }
      setTryingAgain(false);
    } catch (error) {
      console.error('Error submitting approval items: ', error);
    } finally {
      setIsSubmitting(false);
    }
  }
}
