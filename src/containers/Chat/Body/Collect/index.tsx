import React from 'react';
import AICards from './AICards';
import Vocabulary from './Vocabulary';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';

export default function Collect({
  chatType,
  loadingVocabulary,
  loadingAICardChat
}: {
  chatType: string;
  loadingVocabulary: boolean;
  loadingAICardChat: boolean;
}) {
  return chatType === VOCAB_CHAT_TYPE ? (
    <Vocabulary loadingVocabulary={loadingVocabulary} />
  ) : (
    <AICards loadingAICardChat={loadingAICardChat} />
  );
}
