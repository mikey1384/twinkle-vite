import PropTypes from 'prop-types';
import AICards from './AICards';
import Vocabulary from './Vocabulary';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';

Collect.propTypes = {
  chatType: PropTypes.string,
  loadingVocabulary: PropTypes.bool,
  loadingAICardChat: PropTypes.bool
};

export default function Collect({
  chatType,
  loadingVocabulary,
  loadingAICardChat
}) {
  return chatType === VOCAB_CHAT_TYPE ? (
    <Vocabulary loadingVocabulary={loadingVocabulary} />
  ) : (
    <AICards loadingAICardChat={loadingAICardChat} />
  );
}
