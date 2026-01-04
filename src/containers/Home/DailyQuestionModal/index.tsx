import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import DailyQuestionPanel from './DailyQuestionPanel';

export default function DailyQuestionModal({ onHide }: { onHide: () => void }) {
  return (
    <ErrorBoundary componentPath="Home/DailyQuestionModal">
      <Modal
        isOpen={true}
        allowOverflow
        onClose={onHide}
        title={`Today's Question`}
        size="lg"
        closeOnBackdropClick={false}
        modalLevel={0}
      >
        <DailyQuestionPanel onClose={onHide} />
      </Modal>
    </ErrorBoundary>
  );
}
