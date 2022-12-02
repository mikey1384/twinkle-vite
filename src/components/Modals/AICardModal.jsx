import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import useAICard from '~/helpers/hooks/useAICard';
import AICard from '~/components/AICard';
import { Color } from '~/constants/css';
import { qualityProps } from '~/constants/defaultValues';

AICardModal.propTypes = {
  card: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function AICardModal({ card, onHide }) {
  const { cardCss, promptText } = useAICard(card);

  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>#{card.id}</header>
      <main>
        <div
          style={{
            display: 'grid',
            height: '100%',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridColumnGap: 'calc(5rem / 1600px * 100vw)',
            gridRowGap: '2rem'
          }}
        >
          <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
            <div className={cardCss}>
              <AICard
                card={card}
                quality={card.quality}
                imagePath={card.imagePath}
              />
            </div>
          </div>
          <div
            style={{ gridColumn: 'span 1', gridRow: 'span 1', height: '100%' }}
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
                  height: '100%'
                }}
              >
                <div>
                  <span
                    style={{
                      ...qualityProps[card.quality],
                      fontSize: '1.3rem',
                      marginBottom: '1rem'
                    }}
                  >
                    {card.quality}
                  </span>{' '}
                  card
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'Roboto Mono, monospace',
                      fontSize: '1.5rem',
                      marginBottom: '1rem'
                    }}
                    dangerouslySetInnerHTML={{ __html: `"${promptText}"` }}
                  />
                </div>
                <div>
                  <b
                    style={{
                      fontSize: '1.2rem',
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
            <div>
              <div>
                <Button color="oceanBlue" filled style={{ border: 'none' }}>
                  Sell
                </Button>
              </div>
              <div>
                <Button color="oceanGreen" filled style={{ border: 'none' }}>
                  Burn
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
