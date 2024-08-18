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
  const getOpenAiImage = useAppContext((v) => v.requestHelpers.getOpenAiImage);
  const postAICard = useAppContext((v) => v.requestHelpers.postAICard);
  const processAiCardQuality = useAppContext(
    (v) => v.requestHelpers.processAiCardQuality
  );
  const saveAIImageToS3 = useAppContext(
    (v) => v.requestHelpers.saveAIImageToS3
  );
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
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column'
      }}
    >
      <div
        className={css`
          z-index: 100;
          box-shadow: 0 3px 5px -3px ${Color.black(0.6)};
          width: 100%;
        `}
      >
        <FilterBar
          style={{
            height: '4.5rem',
            fontSize: '1.6rem',
            marginBottom: 0
          }}
        >
          <nav onClick={handleFilterClick}>Vocabulary</nav>
          <nav className="active">AI Cards</nav>
        </FilterBar>
      </div>
      {loadingAICardChat ? (
        <div style={{ height: 'CALC(100% - 6.5rem)' }}>
          <Loading style={{ height: '50%' }} text="Loading AI Cards" />
        </div>
      ) : (
        <ActivitiesContainer displayedThemeColor={displayedThemeColor} />
      )}

      <StatusInterface
        posting={isGeneratingAICard}
        statusMessage={aiCardStatusMessage}
      />
      {!canGenerateAICard && (
        <div
          style={{
            textAlign: 'center',
            width: '100%',
            color: '#fff',
            background: Color.black(),
            fontFamily: 'monospace',
            padding: '1rem'
          }}
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
        style={{
          height: '6.5rem',
          background: Color.inputGray(),
          padding: '1rem',
          borderTop: `1px solid ${Color.borderGray()}`
        }}
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
    let isPurchased = false;
    try {
      onSetIsGeneratingAICard(true);
      onSetAICardStatusMessage('Processing transaction...');
      const {
        isMaxReached,
        quality,
        level,
        cardId,
        word,
        prompt,
        coins,
        numCardSummoned
      } = await processAiCardQuality();
      onUpdateNumSummoned(numCardSummoned);
      if (isMaxReached) {
        onSetIsGeneratingAICard(false);
        return onSetAICardStatusMessage(
          `You cannot summon any more cards today.`
        );
      }
      if (!quality) {
        onSetAICardStatusMessage(
          `You don't have enough Twinkle Coins to summon a card.`
        );
        onSetIsGeneratingAICard(false);
        return onSetUserState({ userId, newState: { twinkleCoins: coins } });
      }
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      isPurchased = true;
      onSetAICardStatusMessage('Purchase complete! Summoning your card...');
      const { imageUrl, style, engine } = await getOpenAiImage({
        prompt
      });
      onSetAICardStatusMessage('Almost done...');
      const imagePath = await saveAIImageToS3(imageUrl);
      const { feed, card } = await postAICard({
        imagePath,
        cardId,
        style,
        engine,
        quality,
        level,
        word,
        prompt
      });
      onSetAICardStatusMessage('Card Summoned');
      onPostAICardFeed({
        feed,
        isSummon: true,
        card: {
          prompt,
          id: cardId,
          quality,
          level,
          word,
          ...card
        }
      });
    } catch (error) {
      console.error(error);
      const statusMessage = isPurchased
        ? `Couldn't generate the card's image at this time. Reload the website and check the "My Collection" section.`
        : 'Payment failed. Try again.';
      onSetAICardStatusMessage(statusMessage);
    } finally {
      onSetIsGeneratingAICard(false);
    }
  }
}
