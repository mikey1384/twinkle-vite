import React from 'react';
import GenerateCardInterface from './GenerateCardInterface';
import FilterBar from '~/components/FilterBar';
import ActivitiesContainer from './ActivitiesContainer';
import Loading from '~/components/Loading';
import { Link, useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import StatusInterface from './StatusInterface';

export default function AICards({
  displayedThemeColor,
  loadingAICardChat
}: {
  displayedThemeColor: string;
  loadingAICardChat: boolean;
}) {
  const { userId, canGenerateAICard } = useKeyContext((v) => v.myState);
  const generateAICard = useAppContext((v) => v.requestHelpers.generateAICard);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetCollectType = useAppContext(
    (v) => v.user.actions.onSetCollectType
  );
  const onUpdateNumSummoned = useChatContext(
    (v) => v.actions.onUpdateNumSummoned
  );
  const aiCardStatusMessage = useChatContext(
    (v) => v.state.aiCardStatusMessage
  );
  const isGeneratingAICard = useChatContext((v) => v.state.isGeneratingAICard);
  const numCardSummonedToday = useChatContext(
    (v) => v.state.numCardSummonedToday
  );
  const onSetIsGeneratingAICard = useChatContext(
    (v) => v.actions.onSetIsGeneratingAICard
  );
  const onSetAICardStatusMessage = useChatContext(
    (v) => v.actions.onSetAICardStatusMessage
  );
  const onPostAICardFeed = useChatContext((v) => v.actions.onPostAICardFeed);
  const navigate = useNavigate();

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        height: 100%;
      `}
    >
      <div
        className={css`
          z-index: 100;
          box-shadow: 0 3px 5px -3px ${Color.black(0.6)};
        `}
      >
        <FilterBar
          style={{
            height: '4.5rem',
            fontSize: '1.6rem',
            marginBottom: 0
          }}
        >
          <nav onClick={handleFilterClick}>Word Master</nav>
          <nav className="active">AI Cards</nav>
        </FilterBar>
      </div>
      <div
        className={css`
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        `}
      >
        {loadingAICardChat ? (
          <Loading style={{ height: '50%' }} text="Loading AI Cards" />
        ) : (
          <ActivitiesContainer displayedThemeColor={displayedThemeColor} />
        )}
      </div>

      <StatusInterface
        posting={isGeneratingAICard}
        statusMessage={aiCardStatusMessage}
      />
      {!canGenerateAICard && (
        <div
          className={css`
            text-align: center;
            width: 100%;
            color: #fff;
            background: ${Color.black()};
            font-family: monospace;
            padding: 1rem;
          `}
        >
          You do not have the license to summon AI Cards. Get it from the{' '}
          <Link
            style={{ fontWeight: 'bold', color: Color.gold() }}
            to={`/settings`}
          >
            settings
          </Link>{' '}
          page
        </div>
      )}
      <div
        className={css`
          height: 6.5rem;
          background: ${Color.inputGray()};
          padding: 1rem;
          border-top: 1px solid ${Color.borderGray()};
        `}
      >
        <GenerateCardInterface
          canGenerateAICard={!!canGenerateAICard}
          numSummoned={numCardSummonedToday}
          onGenerateAICard={handleGenerateCard}
          posting={isGeneratingAICard}
          loading={loadingAICardChat}
        />
      </div>
    </div>
  );

  function handleFilterClick() {
    onSetCollectType(VOCAB_CHAT_TYPE);
    navigate(`/chat/${VOCAB_CHAT_TYPE}`);
  }

  async function handleGenerateCard() {
    try {
      onSetIsGeneratingAICard(true);
      onSetAICardStatusMessage('Processing transaction...');
      const {
        isMaxReached,
        notEnoughCoins,
        coins,
        numCardSummoned,
        feed,
        card
      } = await generateAICard();
      onUpdateNumSummoned(numCardSummoned);
      if (isMaxReached) {
        onSetIsGeneratingAICard(false);
        return onSetAICardStatusMessage(
          `You cannot summon any more cards today.`
        );
      }
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      if (notEnoughCoins) {
        onSetIsGeneratingAICard(false);
        return onSetAICardStatusMessage(
          `You don't have enough Twinkle Coins to summon a card.`
        );
      }
      onSetAICardStatusMessage('Card Summoned');
      onPostAICardFeed({
        feed,
        isSummon: true,
        card
      });
    } catch (error: any) {
      console.error(error);

      const errorKey = error?.data?.error;

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (errorKey === 'inappropriate_word') {
        errorMessage = 'Payment failed. Please try again.';
      } else if (errorKey === 'failure_after_payment') {
        errorMessage =
          "Card generation failed after payment. Reload the site, open 'My Collection' at the bottom right, select your card, and press 'Generate' to retry.";
      }

      onSetAICardStatusMessage(errorMessage);
    } finally {
      onSetIsGeneratingAICard(false);
    }
  }
}
