import PropTypes from 'prop-types';
import { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import useAICard from '~/helpers/hooks/useAICard';
import AICard from '~/components/AICard';
import SanitizedHTML from 'react-sanitized-html';
import { Color } from '~/constants/css';
import { qualityProps } from '~/constants/defaultValues';

AICardModal.propTypes = {
  card: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function AICardModal({ card, onHide }) {
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
                  className="card-quality"
                  style={{
                    marginBottom: '1rem',
                    fontSize: '1.6rem',
                    fontFamily: 'Open Sans, sans-serif'
                  }}
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
              <div
                style={{ height: '50%', display: 'flex', alignItems: 'center' }}
              >
                <Button color="oceanBlue" filled style={{ border: 'none' }}>
                  Sell
                </Button>
              </div>
              <div
                style={{ height: '50%', display: 'flex', alignItems: 'center' }}
              >
                <Button
                  onClick={() => setIsBurned(true)}
                  color="oceanGreen"
                  filled
                  style={{ border: 'none' }}
                >
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
