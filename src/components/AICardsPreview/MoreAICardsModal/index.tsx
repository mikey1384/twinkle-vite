import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import CardItem from './CardItem';
import { useNavigate } from 'react-router-dom';
import { calculateTotalBurnValue } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Card } from '~/types';

export default function MoreAICardsModal({
  cards,
  exploreUrl,
  onSetAICardModalCardId,
  onHide,
  modalOverModal,
  moreAICardsModalTitle = 'Selected Cards',
  themeColor
}: {
  cards: Card[];
  exploreUrl?: string;
  onSetAICardModalCardId?: (cardId: number) => void;
  onHide: () => void;
  modalOverModal?: boolean;
  moreAICardsModalTitle?: string;
  themeColor?: string;
}) {
  const navigate = useNavigate();
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
          {exploreUrl && (
            <Button
              color={themeColor || 'logoBlue'}
              variant="solid"
              tone="raised"
              style={{ marginRight: '0.7rem' }}
              onClick={() => {
                onHide();
                navigate(exploreUrl);
              }}
            >
              <Icon icon="cards-blank" style={{ marginRight: '0.5rem' }} />
              View All Cards
            </Button>
          )}
          <Button variant="ghost" onClick={onHide}>
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );
}
