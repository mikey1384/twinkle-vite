import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import GradientButton from '~/components/Buttons/GradientButton';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import { css } from '@emotion/css';
import { Card } from '~/types';
import { useAppContext, useChatContext } from '~/contexts';

export default function DailyRewardModal({ onHide }: { onHide: () => void }) {
  const unlockDailyReward = useAppContext(
    (v) => v.requestHelpers.unlockDailyReward
  );
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [animateReveal, setAnimateReveal] = useState(false);
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
        const { cards, chosenCardId, isAlreadyChecked } =
          await unlockDailyReward();
        if (isAlreadyChecked) {
          setCurrentCardId(chosenCardId);
          setAlreadyChecked(true);
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
    return () => {
      setAnimateReveal(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCard = useMemo(() => {
    return cardObj[currentCardId];
  }, [cardObj, currentCardId]);

  return (
    <Modal
      className={css`
        @keyframes flashEffect {
          0% {
            background-color: transparent;
          }
          50% {
            background-color: rgba(255, 0, 255, 0.7);
          }
          100% {
            background-color: transparent;
          }
        }

        .flashBackground {
          animation: flashEffect 0.6s ease-out;
        }
      `}
      wrapped
      onHide={onHide}
    >
      <header>Daily Reward</header>
      <main className={animateReveal ? 'flashBackground' : ''}>
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
            className={css`
              @keyframes popEffect {
                0% {
                  transform: scale(0.9);
                  opacity: 0.7;
                }
                50% {
                  transform: scale(1.2);
                  opacity: 1;
                }
                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }

              .chosenCardWrapper {
                animation: popEffect 0.6s ease-out;
              }
            `}
          >
            {!isRevealPressed && !alreadyChecked && (
              <GradientButton
                onClick={handleReveal}
                fontSize="1.5rem"
                mobileFontSize="1.1rem"
              >
                Show me my reward!
              </GradientButton>
            )}
            {currentCard && (
              <div
                className={
                  currentCardId === chosenCardId &&
                  isRevealPressed &&
                  animateReveal
                    ? 'chosenCardWrapper'
                    : ''
                }
              >
                <AICard key={currentCard.id} card={currentCard} detailShown />
              </div>
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
        setAnimateReveal(true);
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
