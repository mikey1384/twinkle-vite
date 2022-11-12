import PropTypes from 'prop-types';
import AIDrawing from './AIDrawing';
import Vocabulary from './Vocabulary';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';

Collect.propTypes = {
  chatType: PropTypes.string,
  loadingVocabulary: PropTypes.bool
};

export default function Collect({ chatType, loadingVocabulary }) {
  return chatType === VOCAB_CHAT_TYPE ? (
    <Vocabulary loadingVocabulary={loadingVocabulary} />
  ) : (
    <AIDrawing />
  );
}
