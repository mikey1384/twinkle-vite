import React from 'react';
import { css } from '@emotion/css';
import Backdrop from './Backdrop';
import PromptMessage from './PromptMessage';

interface VocabularyWidgetProps {
  widgetHeight: string;
  wordRegisterStatus: any;
  inputTextIsEmpty: boolean;
  searchedWord: any;
  socketConnected: boolean;
  vocabErrorMessage?: string;
  isSubmitting?: boolean;
  statusMessage: string; // <== NEW: single status string from parent
}

export default function VocabularyWidget({
  widgetHeight,
  wordRegisterStatus,
  inputTextIsEmpty,
  searchedWord,
  socketConnected,
  vocabErrorMessage,
  isSubmitting,
  statusMessage
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
      <Backdrop />
      <PromptMessage
        isSearching={isSearching}
        searchedWord={searchedWord}
        socketConnected={socketConnected}
        vocabErrorMessage={vocabErrorMessage}
        isSubmitting={isSubmitting}
        wordRegisterStatus={hasWordRegisterStatus ? wordRegisterStatus : null}
        statusMessage={statusMessage}
      />
    </div>
  );
}
