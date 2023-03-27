import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SuccessText from './SuccessText';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
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
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Reading Cleared</header>
      <main>
        <SuccessText difficulty={difficulty} />
        <div style={{ marginTop: '3.5rem' }}>
          You answered {numQuestions} out of {numQuestions} question
          {numQuestions === 1 ? '' : 's'} correctly!
        </div>
        <div
          style={{
            marginTop: '1rem',
            marginBottom: '2rem',
            fontSize: difficulty > 3 ? '1.7rem' : '1.5rem'
          }}
        >
          You earned{' '}
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(rewardTable[difficulty].xp)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b> and{' '}
          <b style={{ color: Color.brownOrange() }}>
            {addCommasToNumber(rewardTable[difficulty].coins)} coins
          </b>
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
