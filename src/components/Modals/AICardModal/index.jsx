import PropTypes from 'prop-types';
import { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import useAICard from '~/helpers/hooks/useAICard';
import AICard from '~/components/AICard';
import SanitizedHTML from 'react-sanitized-html';
import SellModal from './SellModal';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { qualityProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import UnlistedMenu from './UnlistedMenu';
import ListedMenu from './ListedMenu';

AICardModal.propTypes = {
  card: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function AICardModal({ card, onHide }) {
  const { userId } = useKeyContext((v) => v.myState);
  const [sellModalShown, setSellModalShown] = useState(false);
  const [isBurned, setIsBurned] = useState(false);
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
            gridTemplateColumns: '1fr 1fr 1fr',
            gridColumnGap: 'calc(5rem / 1600px * 100vw)',
            gridRowGap: '2rem'
          }}
        >
          <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
            <div className={cardCss}>
              <AICard
                isBurned={isBurned}
                card={card}
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
                    margin-bottom: 1rem;
                    font-size: 1.6rem;
                    font-family: Open Sans, sans-serif;
                  `}`}
                >
                  <b
                    style={{
                      ...qualityProps[card.quality],
                      marginBottom: '1rem'
                    }}
                  >
                    {card.quality}
                  </b>{' '}
                  card
                </div>
                <div style={{ marginBottom: '3rem' }}>
                  <span
                    style={{
                      fontFamily: 'Roboto Mono, monospace',
                      fontSize: '1.5rem'
                    }}
                  >
                    <SanitizedHTML
                      allowedAttributes={{ b: ['style'] }}
                      html={`"${promptText}"`}
                    />
                  </span>
                </div>
                <div>
                  <b
                    style={{
                      fontSize: '1.3rem',
                      fontFamily: 'helvetica, sans-serif',
                      color: Color.darkerGray()
                    }}
                  >
                    {card.style}
                  </b>
                </div>
              </div>
            </div>
          </div>
          <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
            {card.isListed ? (
              <ListedMenu
                userIsOwner={card.ownerId === userId}
                askPrice={card.askPrice}
              />
            ) : (
              <UnlistedMenu
                onSetSellModalShown={setSellModalShown}
                onSetIsBurned={setIsBurned}
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
      {sellModalShown && <SellModal onHide={() => setSellModalShown(false)} />}
    </Modal>
  );
}
