import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import useAICard from '~/helpers/hooks/useAICard';
import AICard from '~/components/AICard';

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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridColumnGap: '16px',
            gridRowGap: '16px'
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
          <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
            <div className="info">
              <div>Level: {card.level}</div>
            </div>
          </div>
          <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
            <div>
              <div>
                <span
                  style={{ fontFamily: 'Roboto Mono, monospace' }}
                  dangerouslySetInnerHTML={{ __html: `"${promptText}"` }}
                />
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
