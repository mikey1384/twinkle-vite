import React from 'react';
import AICards from './AICards';
import Vocabulary from './Vocabulary';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';

export default function Collect({
  chatType,
  displayedThemeColor,
  loadingVocabulary,
  loadingAICardChat
}: {
  chatType: string;
  displayedThemeColor: string;
  loadingVocabulary: boolean;
  loadingAICardChat: boolean;
}) {
  return chatType === VOCAB_CHAT_TYPE ? (
    <Vocabulary loadingVocabulary={loadingVocabulary} />
  ) : (
    <AICards
      displayedThemeColor={displayedThemeColor}
      loadingAICardChat={loadingAICardChat}
    />
  );
}
