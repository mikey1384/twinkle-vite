import PropTypes from 'prop-types';
import AIDrawing from './AIDrawing';
import Vocabulary from './Vocabulary';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';

Collect.propTypes = {
  chatType: PropTypes.string
};

export default function Collect({ chatType }) {
  return chatType === VOCAB_CHAT_TYPE ? <Vocabulary /> : <AIDrawing />;
}
