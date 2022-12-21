import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import useAICard from '~/helpers/hooks/useAICard';
import AICard from '~/components/AICard';
import SanitizedHTML from 'react-sanitized-html';
import SellModal from './SellModal';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { qualityProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import UnlistedMenu from './UnlistedMenu';
import ListedMenu from './ListedMenu';

AICardModal.propTypes = {
  cardId: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function AICardModal({ cardId, onHide }) {
  const getOpenAiImage = useAppContext((v) => v.requestHelpers.getOpenAiImage);
  const saveAIImageToS3 = useAppContext(
    (v) => v.requestHelpers.saveAIImageToS3
  );
  const postAICard = useAppContext((v) => v.requestHelpers.postAICard);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const { userId } = useKeyContext((v) => v.myState);
  const [sellModalShown, setSellModalShown] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const card = useMemo(() => cardObj[cardId], [cardId, cardObj]);
  const { cardCss, promptText } = useAICard(card);

  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>#{card.id}</header>
      <main>
        <div
          style={{
            display: 'grid',
            minHeight: '100%',
            width: '100%',
            gridTemplateColumns: '1fr 1.5fr 1fr',
            gridColumnGap: 'calc(5rem / 1600px * 100vw)',
            gridRowGap: '2rem'
          }}
        >
          <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
            <div className={cardCss}>
              <AICard
                isBurning={isBurning}
                isBurned={!!card.isBurned}
                quality={card.quality}
                imagePath={card.imagePath}
              />
            </div>
          </div>
          <div
            style={{
              gridColumn: 'span 1',
              gridRow: 'span 1',
              minHeight: '100%'
            }}
          >
            <div
              style={{
                gridColumn: 'span 1',
                gridRow: 'span 1',
                height: '100%'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minHeight: '100%',
                  padding: '0 1rem'
                }}
              >
                <div
                  className={`card-quality ${css`
                    font-size: 1.6rem;
                    font-family: Open Sans, sans-serif;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1rem;
                    }
                  `}`}
                >
                  <b
                    style={{
                      ...qualityProps[card.quality]
                    }}
                  >
                    {card.quality}
                  </b>{' '}
                  card
                </div>
                <div
                  className={css`
                    padding: 3rem 5rem 5rem 5rem;
                    text-align: center;
                    @media (max-width: ${mobileMaxWidth}) {
                      padding: 3rem 2rem 4rem 2rem;
                    }
                  `}
                >
                  <span
                    className={css`
                      font-family: Roboto Mono, monospace;
                      font-size: 1.5rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1.1rem;
                      }
                    `}
                  >
                    <SanitizedHTML
                      allowedAttributes={{ b: ['style'] }}
                      html={`"${promptText}"`}
                    />
                  </span>
                </div>
                <div>
                  <b
                    className={css`
                      font-size: 1.3rem;
                      font-family: helvetica, sans-serif;
                      color: ${Color.darkerGray()};
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1rem;
                      }
                    `}
                  >
                    {card.style}
                  </b>
                </div>
              </div>
            </div>
          </div>
          <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
            {!card.imagePath ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column'
                }}
              >
                <GradientButton
                  loading={generatingImage}
                  onClick={handleGenerateImage}
                  fontSize="1.5rem"
                  mobileFontSize="1.1rem"
                >
                  {generatingImage ? 'Generating...' : 'Generate Image'}
                </GradientButton>
              </div>
            ) : card.isListed ? (
              <ListedMenu
                cardId={card.id}
                userIsOwner={card.ownerId === userId}
                askPrice={card.askPrice}
              />
            ) : (
              <UnlistedMenu
                cardId={card.id}
                cardLevel={card.level}
                cardQuality={card.quality}
                userIsOwner={card.ownerId === userId}
                onSetSellModalShown={setSellModalShown}
                owner={card.owner}
                onSetIsBurning={setIsBurning}
              />
            )}
          </div>
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
      {sellModalShown && (
        <SellModal card={card} onHide={() => setSellModalShown(false)} />
      )}
    </Modal>
  );

  async function handleGenerateImage() {
    setGeneratingImage(true);
    try {
      const { imageUrl, style } = await getOpenAiImage(card.prompt);
      const imagePath = await saveAIImageToS3(imageUrl);
      const newCard = await postAICard({ imagePath, cardId: card.id, style });
      onUpdateAICard({ cardId: card.id, newState: newCard });
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingImage(false);
    }
  }
}
