import PropTypes from 'prop-types';
import Vocabulary from './Vocabulary';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';

Collect.propTypes = {
  chatType: PropTypes.string
};

export default function Collect({ chatType }) {
  return chatType === VOCAB_CHAT_TYPE ? <Vocabulary /> : <div>not vocab</div>;
}
