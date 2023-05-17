import React from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import CardItem from './CardItem';
import { Card } from '~/types';

MoreAICardsModal.propTypes = {
  cards: PropTypes.array.isRequired,
  hideNumMore: PropTypes.bool,
  onSetAICardModalCardId: PropTypes.func,
  onHide: PropTypes.func.isRequired,
  modalOverModal: PropTypes.bool
};
export default function MoreAICardsModal({
  cards,
  onSetAICardModalCardId,
  onHide,
  modalOverModal,
  moreAICardsModalTitle = 'Selected Cards'
}: {
  cards: Card[];
  onSetAICardModalCardId?: (cardId: number) => void;
  onHide: () => void;
  modalOverModal?: boolean;
  moreAICardsModalTitle?: string;
}) {
  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>{moreAICardsModalTitle}</header>
      <main>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onClick={() => onSetAICardModalCardId?.(card.id)}
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
