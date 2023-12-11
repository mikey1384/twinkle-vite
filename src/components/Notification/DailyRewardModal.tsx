import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import GradientButton from '~/components/Buttons/GradientButton';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { cardLevelHash } from '~/constants/defaultValues';
import { Card } from '~/types';
import { useAppContext, useChatContext } from '~/contexts';
import { css } from '@emotion/css';

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
  const [isRevealing, setIsRevealing] = useState(false);

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
    <Modal onHide={onHide}>
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
            <GradientButton
              onClick={handleReveal}
              fontSize="1.5rem"
              mobileFontSize="1.1rem"
              loading={isRevealing}
            >
              Show me my reward!
            </GradientButton>
            <div
              className={css`
                color: ${cardLevelHash[currentCard?.level]?.color || '#000'};
                font-size: 2.5rem;
                font-weight: bold;
                display: flex;
                justify-content: center;
                align-items: center;
              `}
            >
              {currentCard?.word}
            </div>
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
    setIsRevealing(true);
    let currentIndex = 0;
    let interval = 1000;
    let isFirstIteration = true;
    let fastIterations = 0;

    const reveal = () => {
      if (
        currentIndex === cardIds.indexOf(chosenCardId) &&
        fastIterations >= 5
      ) {
        setIsRevealing(false);
        setCurrentCardId(chosenCardId);
      } else {
        setCurrentCardId(cardIds[currentIndex]);
        currentIndex = (currentIndex + 1) % cardIds.length;

        // Increment fastIterations at the end of each cycle when the interval is 100ms or less
        if (currentIndex === 0 && interval <= 100) {
          fastIterations++;
        }

        // Check if the first iteration is complete
        if (currentIndex === 0 && isFirstIteration) {
          isFirstIteration = false;
        } else if (!isFirstIteration && interval > 100) {
          interval *= 0.9; // Shorten the interval only after the first iteration
        }

        setTimeout(reveal, interval);
      }
    };
    setTimeout(reveal, interval);
  }
}
