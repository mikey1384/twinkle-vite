import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import CardItem from './CardItem';

MoreAICardsModal.propTypes = {
  cards: PropTypes.array.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  onHide: PropTypes.func,
  modalOverModal: PropTypes.bool
};

export default function MoreAICardsModal({
  cards,
  onSetAICardModalCardId,
  onHide,
  modalOverModal
}) {
  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>Selected Cards</header>
      <main>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onClick={() => onSetAICardModalCardId(card.id)}
            />
          ))}
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
