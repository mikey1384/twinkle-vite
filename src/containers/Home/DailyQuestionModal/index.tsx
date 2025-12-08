import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import NewModal from '~/components/NewModal';
import DailyQuestionPanel from '../TopMenu/InputPanel/InputModal/DailyQuestionPanel';

export default function DailyQuestionModal({ onHide }: { onHide: () => void }) {
  return (
    <ErrorBoundary componentPath="Home/DailyQuestionModal">
      <NewModal
        isOpen={true}
        onClose={onHide}
        title={`Today's Question`}
        size="lg"
        closeOnBackdropClick={false}
        modalLevel={0}
      >
        <DailyQuestionPanel onClose={onHide} />
      </NewModal>
    </ErrorBoundary>
  );
}
