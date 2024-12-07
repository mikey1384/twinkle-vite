import React, { useState, useEffect, useRef } from 'react';
import ContentInput from './ContentInput';
import SubjectInput from './SubjectInput';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useInputContext } from '~/contexts';

export default function InputModal({ onHide }: { onHide: () => void }) {
  const subject = useInputContext((v) => v.state.subject);
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
    fetchDrafts();
    async function fetchDrafts() {
      const data = await checkDrafts({ contentType: 'subject' });
      setDrafts(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel/InputModal">
      <Modal wrapped closeWhenClickedOutside={false} onHide={handleClose}>
        <header>Post Something</header>
        <main>
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
        </main>
        <footer>
          <Button transparent onClick={handleClose}>
            Close
          </Button>
        </footer>
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
