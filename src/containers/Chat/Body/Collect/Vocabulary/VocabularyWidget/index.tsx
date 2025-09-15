import React from 'react';
import { css } from '@emotion/css';
import Backdrop from './Backdrop';
import PromptMessage from './PromptMessage';

interface QuizBatchSummary {
  id: number;
  title: string;
  createdAt: number;
  questionCount: number;
  status?: string;
}

interface VocabularyWidgetProps {
  widgetHeight: string;
  wordRegisterStatus: any;
  inputTextIsEmpty: boolean;
  isNewWord: boolean;
  searchedWord: any;
  socketConnected: boolean;
  vocabErrorMessage?: string;
  isCensored?: boolean;
  isSubmitting?: boolean;
  statusMessage: string;
  canHit?: boolean;
  quizBatches: QuizBatchSummary[];
  onSelectBatch?: (batch: QuizBatchSummary | null) => void;
  activeBatchId?: number | null;
}

export default function VocabularyWidget({
  widgetHeight,
  wordRegisterStatus,
  inputTextIsEmpty,
  isNewWord,
  searchedWord,
  socketConnected,
  vocabErrorMessage,
  isSubmitting,
  isCensored,
  statusMessage,
  canHit,
  quizBatches,
  onSelectBatch,
  activeBatchId
}: VocabularyWidgetProps) {
  const hasWordRegisterStatus = Boolean(wordRegisterStatus);
  const isSearching = !inputTextIsEmpty;

  return (
    <div
      className={css`
        position: relative;
        z-index: 5;
        width: 100%;
        height: ${widgetHeight};
        overflow: visible;
      `}
    >
      <Backdrop
        quizBatches={quizBatches}
        onSelectBatch={onSelectBatch}
        activeBatchId={activeBatchId}
      />
      <PromptMessage
        isSearching={isSearching}
        searchedWord={searchedWord}
        socketConnected={socketConnected}
        vocabErrorMessage={vocabErrorMessage}
        isSubmitting={isSubmitting}
        isNewWord={isNewWord}
        isCensored={isCensored}
        wordRegisterStatus={hasWordRegisterStatus ? wordRegisterStatus : null}
        statusMessage={statusMessage}
        canHit={canHit}
      />
    </div>
  );
}
