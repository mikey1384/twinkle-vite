import React, { useState, useEffect, useRef } from 'react';
import ContentInput from './ContentInput';
import SubjectInput from './SubjectInput';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useInputContext, useKeyContext } from '~/contexts';
import usePendingAction from '~/helpers/hooks/usePendingAction';
import {
  forgetPostDraft,
  waitForPostDraftSaves
} from './SubjectInput/usePostDrafts';

export default function InputModal({
  isOpen,
  onHide
}: {
  isOpen: boolean;
  onHide: () => void;
}) {
  const { pendingAction, runAction } = usePendingAction();
  const subject = useInputContext((v) => v.state.subject);
  const userId = useKeyContext((v) => v.myState.userId);
  const checkDrafts = useAppContext((v) => v.requestHelpers.checkDrafts);
  const deleteDraft = useAppContext((v) => v.requestHelpers.deleteDraft);
  const onSetSubjectTitle = useInputContext((v) => v.actions.onSetSubjectTitle);
  const onSetSubjectDescription = useInputContext(
    (v) => v.actions.onSetSubjectDescription
  );
  const onSetSecretAnswer = useInputContext((v) => v.actions.onSetSecretAnswer);
  const onSetHasSecretAnswer = useInputContext(
    (v) => v.actions.onSetHasSecretAnswer
  );
  const titleRef = useRef(subject.details.title || '');
  const descriptionRef = useRef(subject.details.description || '');
  const [title, setTitle] = useState(subject.details.title || '');
  // null until this opening's drafts have loaded
  const [drafts, setDrafts] = useState<any[] | null>(null);
  const [draftsLoadFailed, setDraftsLoadFailed] = useState(false);
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
    if (!isOpen || !userId) {
      setDrafts(null);
      setDraftsLoadFailed(false);
      return;
    }
    let cancelled = false;
    fetchDrafts();
    async function fetchDrafts() {
      try {
        // a draft saved while the form was closing is listed once
        await waitForPostDraftSaves();
        const data = await checkDrafts({ contentType: 'subject' });
        if (cancelled) return;
        setDraftsLoadFailed(!Array.isArray(data));
        setDrafts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load drafts:', error);
        if (cancelled) return;
        setDraftsLoadFailed(true);
        setDrafts([]);
      }
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel/InputModal">
      <Modal
        modalKey="InputModal"
        isOpen={isOpen}
        onClose={handleClose}
        title="Post Something"
        size="lg"
        allowOverflow
        closeOnBackdropClick={false}
        modalLevel={0}
        footer={
          <Button
            loading={pendingAction === 'close'}
            variant="ghost"
            onClick={handleClose}
          >
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
            draftsLoadFailed={draftsLoadFailed}
            draftIdRef={draftIdRef}
            onModalHide={onHide}
          />
          <ContentInput onModalHide={onHide} />
        </div>
      </Modal>
    </ErrorBoundary>
  );

  function handleClose() {
    return runAction('close', closeAndCleanDraft);
  }

  async function closeAndCleanDraft() {
    if (draftIdRef.current && stringIsEmpty(title)) {
      try {
        titleRef.current = '';
        descriptionRef.current = '';
        onSetSubjectTitle('');
        onSetSubjectDescription('');
        onSetSecretAnswer('');
        onSetHasSecretAnswer(false);
        const draftId = draftIdRef.current;
        await deleteDraft(draftId);
        forgetPostDraft(draftId);
      } catch (error) {
        console.error('Failed to delete draft:', error);
      }
    }
    onHide();
  }
}
