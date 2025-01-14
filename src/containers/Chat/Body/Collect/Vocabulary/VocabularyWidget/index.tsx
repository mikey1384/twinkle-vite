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
  notFoundLabel: string;
  notRegistered?: boolean;
  alreadyRegistered?: boolean;
  vocabErrorMessage?: string;
  isSubmitting?: boolean;
  notDiscoveredYetLabel?: string;
  alreadyDiscoveredLabel?: string;
}

export default function VocabularyWidget({
  widgetHeight,
  wordRegisterStatus,
  inputTextIsEmpty,
  searchedWord,
  socketConnected,
  notFoundLabel,
  notRegistered,
  alreadyRegistered,
  vocabErrorMessage,
  isSubmitting,
  notDiscoveredYetLabel,
  alreadyDiscoveredLabel
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
        notFoundLabel={notFoundLabel}
        wordRegisterStatus={hasWordRegisterStatus ? wordRegisterStatus : null}
        notRegistered={notRegistered}
        alreadyRegistered={alreadyRegistered}
        vocabErrorMessage={vocabErrorMessage}
        isSubmitting={isSubmitting}
        notDiscoveredYetLabel={notDiscoveredYetLabel}
        alreadyDiscoveredLabel={alreadyDiscoveredLabel}
      />
    </div>
  );
}
