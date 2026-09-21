import React from 'react';
import AICards from './AICards';
import Vocabulary from './Vocabulary';
import { AI_CARD_CHAT_TYPE, VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import useUserActivity from '~/helpers/hooks/useUserActivity';

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
  useUserActivity(
    chatType === VOCAB_CHAT_TYPE && !loadingVocabulary
      ? { kind: 'game', id: 'word-master' }
      : chatType === AI_CARD_CHAT_TYPE && !loadingAICardChat
        ? { kind: 'game', id: 'ai-cards' }
        : null,
    { priority: 0 }
  );

  return chatType === VOCAB_CHAT_TYPE ? (
    <Vocabulary
      displayedThemeColor={displayedThemeColor}
      loadingVocabulary={loadingVocabulary}
    />
  ) : (
    <AICards
      displayedThemeColor={displayedThemeColor}
      loadingAICardChat={loadingAICardChat}
    />
  );
}
