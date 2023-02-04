import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import CardItem from './CardItem';

MoreAICardsModal.propTypes = {
  cards: PropTypes.array.isRequired,
  onHide: PropTypes.func
};

export default function MoreAICardsModal({ cards, onHide }) {
  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>Selected Cards</header>
      <main>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} />
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
