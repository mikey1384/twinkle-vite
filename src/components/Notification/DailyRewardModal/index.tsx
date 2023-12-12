import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import GradientButton from '~/components/Buttons/GradientButton';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import { Card } from '~/types';
import { useAppContext, useChatContext } from '~/contexts';

export default function DailyRewardModal({ onHide }: { onHide: () => void }) {
  const unlockDailyReward = useAppContext(
    (v) => v.requestHelpers.unlockDailyReward
  );
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [loading, setLoading] = useState(false);
  const [cardIds, setCardIds] = useState<number[]>([]);
  const [chosenCardId, setChosenCardId] = useState(0);
  const [currentCardId, setCurrentCardId] = useState(0);
  const [alreadyChecked, setAlreadyChecked] = useState(false);
  const [isRevealPressed, setIsRevealPressed] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { cards, chosenCardId, alreadyChecked } =
          await unlockDailyReward();
        if (alreadyChecked) {
          setAlreadyChecked(true);
        } else {
          // originally below goes here
        }
        setCardIds(cards.map((card: Card) => card.id));
        for (const card of cards) {
          onUpdateAICard({
            cardId: card.id,
            newState: card
          });
        }
        setChosenCardId(chosenCardId);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCard = useMemo(() => {
    return cardObj[currentCardId];
  }, [cardObj, currentCardId]);

  return (
    <Modal wrapped onHide={onHide}>
      <header>Daily Reward</header>
      <main>
        {loading ? (
          <Loading />
        ) : (
          <div
            style={{
              minHeight: '30vh',
              display: 'flex',
              height: '100%',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <div>Already checked? {alreadyChecked ? 'Yes' : 'No'}</div>
            {!isRevealPressed && (
              <GradientButton
                onClick={handleReveal}
                fontSize="1.5rem"
                mobileFontSize="1.1rem"
              >
                Show me my reward!
              </GradientButton>
            )}
            {currentCard && (
              <AICard key={currentCard.id} card={currentCard} detailShown />
            )}
          </div>
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  function handleReveal() {
    setIsRevealPressed(true);
    let currentIndex = 0;
    let interval = 2000;
    let isFirstIteration = true;
    let fastIterations = 0;

    setCurrentCardId(cardIds[currentIndex]);

    const reveal = () => {
      if (
        currentIndex === cardIds.indexOf(chosenCardId) &&
        fastIterations >= 2
      ) {
        setCurrentCardId(chosenCardId);
      } else {
        currentIndex = (currentIndex + 1) % cardIds.length;
        setCurrentCardId(cardIds[currentIndex]);

        if (currentIndex === 0 && interval <= 100) {
          fastIterations++;
        }

        if (currentIndex === 0 && isFirstIteration) {
          isFirstIteration = false;
        } else if (!isFirstIteration && interval > 100) {
          interval *= 0.8;
        }

        setTimeout(reveal, interval);
      }
    };
    setTimeout(reveal, interval);
  }
}
