import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Form from './Form';
import Loading from '~/components/Loading';
import Submitted from './Submitted';
import { ADMIN_MANAGEMENT_LEVEL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';

export default function FormModal({
  type = 'dob',
  onHide
}: {
  type: string;
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const { managementLevel } = useKeyContext((v) => v.myState);
  const { checkDobApprovalSubmission, submitDobForApproval, retryDobApproval } =
    useAppContext((v) => v.requestHelpers);

  const approvalTypeConfigs: {
    [key: string]: {
      label: string;
      inputType: 'date' | 'text' | 'checkbox';
      checkSubmission: () => Promise<{
        isSubmitted: boolean;
        content: string | null;
        status: string | null;
      }>;
      submitForApproval: (value: string) => Promise<void>;
      retryApproval: (value: string) => Promise<void>;
    };
  } = {
    dob: {
      label: 'Date of Birth',
      inputType: 'date',
      checkSubmission: async () => {
        return checkDobApprovalSubmission();
      },
      submitForApproval: async (value: string) => {
        return submitDobForApproval(value);
      },
      retryApproval: async (value: string) => {
        return retryDobApproval(value);
      }
    }
    // Add more types here as needed
  };

  const [approvalItem, setApprovalItem] = useState({
    value: '',
    isSubmitted: null as boolean | null,
    submitStatus: null as string | null,
    submittedValue: null as string | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tryingAgain, setTryingAgain] = useState(false);

  useEffect(() => {
    init();

    async function init() {
      const config = approvalTypeConfigs[type];
      if (config) {
        const { isSubmitted, content, status } = await config.checkSubmission();
        setApprovalItem({
          value: '',
          isSubmitted,
          submitStatus: status,
          submittedValue: content
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const config = approvalTypeConfigs[type];

  if (!config) {
    console.error(`Unknown approval type: ${type}`);
    return null;
  }

  return (
    <Modal onHide={onHide}>
      <header>Additional Profile Details</header>
      <main style={{ justifyContent: 'center', minHeight: '20vh' }}>
        {managementLevel >= ADMIN_MANAGEMENT_LEVEL ? (
          <div style={{ fontSize: '1.7rem' }}>
            {`You run this website. You don't need verification`}
          </div>
        ) : approvalItem.isSubmitted === null ? (
          <Loading />
        ) : approvalItem.isSubmitted && !tryingAgain ? (
          <Submitted
            status={approvalItem.submitStatus}
            value={approvalItem.submittedValue}
            onTryAgain={handleTryAgain}
          />
        ) : (
          <Form
            type={config.inputType}
            label={config.label}
            value={approvalItem.value}
            onChange={handleSetValue}
          />
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
    return approvalItem.value && !approvalItem.isSubmitted;
  }

  function handleSetValue(value: string) {
    setApprovalItem((prev) => ({ ...prev, value }));
  }

  function handleTryAgain() {
    setTryingAgain(true);
    setApprovalItem((prev) => ({
      ...prev,
      isSubmitted: false,
      submitStatus: null
    }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      if (approvalItem.value && !approvalItem.isSubmitted) {
        if (tryingAgain) {
          await config.retryApproval(approvalItem.value);
        } else {
          await config.submitForApproval(approvalItem.value);
        }
        setApprovalItem((prev) => ({
          ...prev,
          isSubmitted: true,
          submitStatus: 'pending',
          value: ''
        }));
      }
      setTryingAgain(false);
    } catch (error) {
      console.error(`Error submitting ${type} approval:`, error);
    } finally {
      setIsSubmitting(false);
    }
  }
}
