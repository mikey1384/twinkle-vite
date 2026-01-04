import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import CardItem from './CardItem';
import { calculateTotalBurnValue } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Card } from '~/types';

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
  const totalBv = useMemo(() => calculateTotalBurnValue(cards), [cards]);

  return (
    <Modal
      isOpen
      onClose={onHide}
      modalLevel={modalOverModal ? 2 : undefined}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header>{`${moreAICardsModalTitle} (total burn value: ${addCommasToNumber(
          totalBv
        )} XP)`}</header>
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
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );
}
