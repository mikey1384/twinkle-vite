import React, { useState, useEffect, useRef } from 'react';
import ContentInput from './ContentInput';
import SubjectInput from './SubjectInput';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useInputContext, useKeyContext } from '~/contexts';

export default function InputModal({
  isOpen,
  onHide
}: {
  isOpen: boolean;
  onHide: () => void;
}) {
  const subject = useInputContext((v) => v.state.subject);
  const userId = useKeyContext((v) => v.myState.userId);
  const checkDrafts = useAppContext((v) => v.requestHelpers.checkDrafts);
  const deleteDraft = useAppContext((v) => v.requestHelpers.deleteDraft);
  const onSetSubjectTitle = useInputContext((v) => v.actions.onSetSubjectTitle);
  const onSetSubjectDescription = useInputContext(
    (v) => v.actions.onSetSubjectDescription
  );
  const titleRef = useRef(subject.details.title || '');
  const descriptionRef = useRef(subject.details.description || '');
  const [title, setTitle] = useState(subject.details.title || '');
  const [drafts, setDrafts] = useState([]);
  const draftIdRef = useRef<number | null>(null);

  useEffect(() => {
    const nextTitle = subject?.details?.title || '';
    if (nextTitle !== titleRef.current) {
      setTitle(nextTitle);
      titleRef.current = nextTitle;
    }
    const nextDescription = subject?.details?.description || '';
    if (nextDescription !== descriptionRef.current) {
      descriptionRef.current = nextDescription;
    }
  }, [subject?.details?.title, subject?.details?.description]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    fetchDrafts();
    async function fetchDrafts() {
      const data = await checkDrafts({ contentType: 'subject' });
      setDrafts(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel/InputModal">
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Post Something"
        size="lg"
        allowOverflow
        closeOnBackdropClick={false}
        modalLevel={0}
        footer={
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
        }
      >
        <div style={{ width: '100%' }}>
          <SubjectInput
            title={title}
            titleRef={titleRef}
            descriptionRef={descriptionRef}
            onSetTitle={setTitle}
            subject={subject}
            drafts={drafts}
            draftIdRef={draftIdRef}
            onModalHide={onHide}
          />
          <ContentInput onModalHide={onHide} />
        </div>
      </Modal>
    </ErrorBoundary>
  );

  async function handleClose() {
    if (draftIdRef.current && stringIsEmpty(title)) {
      try {
        titleRef.current = '';
        descriptionRef.current = '';
        onSetSubjectTitle('');
        onSetSubjectDescription('');
        await deleteDraft(draftIdRef.current);
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }
    onHide();
  }
}
