import PropTypes from 'prop-types';
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

AICards.propTypes = {
  loadingAIImageChat: PropTypes.bool
};

export default function AICards({ loadingAIImageChat }) {
  const { canGenerateAICard } = useKeyContext((v) => v.myState);
  const getOpenAiImage = useAppContext((v) => v.requestHelpers.getOpenAiImage);
  const postAICard = useAppContext((v) => v.requestHelpers.postAICard);
  const processAiCardQuality = useAppContext(
    (v) => v.requestHelpers.processAiCardQuality
  );
  const saveAIImageToS3 = useAppContext(
    (v) => v.requestHelpers.saveAIImageToS3
  );
  const onSetCollectType = useAppContext(
    (v) => v.user.actions.onSetCollectType
  );
  const aiImageStatusMessage = useChatContext(
    (v) => v.state.aiImageStatusMessage
  );
  const isGeneratingAICard = useChatContext((v) => v.state.isGeneratingAICard);
  const onSetIsGeneratingAICard = useChatContext(
    (v) => v.actions.onSetIsGeneratingAICard
  );
  const onSetAIImageStatusMessage = useChatContext(
    (v) => v.actions.onSetAIImageStatusMessage
  );
  const onPostAICard = useChatContext((v) => v.actions.onPostAICard);
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
      {loadingAIImageChat ? (
        <div style={{ height: 'CALC(100% - 6.5rem)' }}>
          <Loading style={{ height: '50%' }} text="Loading AI Cards" />
        </div>
      ) : (
        <ActivitiesContainer />
      )}

      <StatusInterface
        posting={isGeneratingAICard}
        statusMessage={aiImageStatusMessage}
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
          You do not have the license to summon AI Cards. Unlock it from the{' '}
          <Link
            style={{ fontWeight: 'bold', color: Color.gold() }}
            to={`/store`}
          >
            store
          </Link>
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
          onGenerateAICard={handleGenerateCard}
          posting={isGeneratingAICard}
          loading={loadingAIImageChat}
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
      onSetAIImageStatusMessage('Processing your request...');
      const { quality, level, cardId, word, prompt } =
        await processAiCardQuality();
      onSetAIImageStatusMessage('Thinking...');
      const { imageUrl, style } = await getOpenAiImage(prompt);
      onSetAIImageStatusMessage('Generating your card...');
      const imagePath = await saveAIImageToS3(imageUrl);
      const card = await postAICard({ imagePath, cardId, style });
      onSetAIImageStatusMessage('Card Summoned');
      onPostAICard({
        prompt,
        id: cardId,
        quality,
        level,
        word,
        ...card
      });
    } catch (error) {
      onSetAIImageStatusMessage(
        `Zero couldn't generate this card. There was an error.`
      );
    }
    onSetIsGeneratingAICard(false);
  }
}
