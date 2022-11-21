import { useRef } from 'react';
import PropTypes from 'prop-types';
import PromptInput from './PromptInput';
import FilterBar from '~/components/FilterBar';
import ActivitiesContainer from './ActivitiesContainer';
import Loading from '~/components/Loading';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import { useAppContext, useChatContext } from '~/contexts';
import { css } from '@emotion/css';
import StatusInterface from './StatusInterface';

AIDrawing.propTypes = {
  loadingAIImageChat: PropTypes.bool
};

export default function AIDrawing({ loadingAIImageChat }) {
  const getOpenAiImage = useAppContext((v) => v.requestHelpers.getOpenAiImage);
  const postAiCard = useAppContext((v) => v.requestHelpers.postAiCard);
  const processAiCardScore = useAppContext(
    (v) => v.requestHelpers.processAiCardScore
  );
  const saveAIImageToS3 = useAppContext(
    (v) => v.requestHelpers.saveAIImageToS3
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

  const inputRef = useRef(null);

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
          <nav onClick={() => navigate(`/chat/${VOCAB_CHAT_TYPE}`)}>
            Vocabulary
          </nav>
          <nav className="active">AI Image Cards</nav>
        </FilterBar>
      </div>
      {loadingAIImageChat ? (
        <div style={{ height: 'CALC(100% - 6.5rem)' }}>
          <Loading style={{ height: '50%' }} text="Loading AI Image Cards" />
        </div>
      ) : (
        <ActivitiesContainer />
      )}

      <StatusInterface
        posting={isGeneratingAICard}
        statusMessage={aiImageStatusMessage}
      />
      <div
        style={{
          height: '6.5rem',
          background: Color.inputGray(),
          padding: '1rem',
          borderTop: `1px solid ${Color.borderGray()}`
        }}
      >
        <PromptInput
          onSubmit={handleSubmit}
          innerRef={inputRef}
          posting={isGeneratingAICard}
        />
      </div>
    </div>
  );

  async function handleSubmit(text) {
    try {
      onSetIsGeneratingAICard(true);
      onSetAIImageStatusMessage('AI is processing your request...');
      const { score, level, cardId } = await processAiCardScore(text);
      onSetAIImageStatusMessage('The AI is thinking...');
      const imageUrl = await getOpenAiImage(text);
      onSetAIImageStatusMessage('The AI is generating your card....');
      const imagePath = await saveAIImageToS3(imageUrl);
      const card = await postAiCard({ imagePath, cardId });
      onSetAIImageStatusMessage('Card Generated');
      onPostAICard({
        prompt: text,
        id: cardId,
        score,
        level,
        ...card
      });
      onSetIsGeneratingAICard(false);
    } catch (error) {
      onSetIsGeneratingAICard(false);
      if (error.data?.error?.status === 400) {
        return onSetAIImageStatusMessage(
          `The AI refused to handle your request because it didn't like the words you used.`
        );
      }
      return onSetAIImageStatusMessage(
        `The AI couldn't generate this card. There was an error.`
      );
    }
  }
}
