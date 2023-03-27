import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SuccessText from './SuccessText';
import { addCommasToNumber } from '~/helpers/stringHelpers';

SuccessModal.propTypes = {
  difficulty: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired,
  numQuestions: PropTypes.number.isRequired,
  rewardTable: PropTypes.object.isRequired
};

export default function SuccessModal({
  difficulty,
  onHide,
  numQuestions,
  rewardTable
}) {
  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Reading Cleared</header>
      <main>
        <SuccessText difficulty={difficulty} />
        <div style={{ marginTop: '3.5rem' }}>
          You answered {numQuestions} out of {numQuestions} question
          {numQuestions === 1 ? '' : 's'} correctly!
        </div>
        <div style={{ marginTop: '1rem', marginBottom: '3rem' }}>
          You earned {addCommasToNumber(rewardTable[difficulty].xp)} XP and{' '}
          {addCommasToNumber(rewardTable[difficulty].coins)} coins
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          close
        </Button>
      </footer>
    </Modal>
  );
}
