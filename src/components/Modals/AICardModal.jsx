import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import useCardCss from '~/helpers/hooks/useCardCss';
import AICard from '~/components/AICard';

AICardModal.propTypes = {
  card: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function AICardModal({ card, onHide }) {
  const cardCss = useCardCss(card);
  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>#{card.id}</header>
      <main>
        <div className={cardCss}>
          <AICard
            card={card}
            quality={card.quality}
            imagePath={card.imagePath}
          />
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
