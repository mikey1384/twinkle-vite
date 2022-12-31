import { useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';

OfferDetailModal.propTypes = {
  cardId: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired,
  price: PropTypes.number.isRequired
};

export default function OfferDetailModal({ onHide, cardId, price }) {
  const getOffersForCardByPrice = useAppContext(
    (v) => v.requestHelpers.getOffersForCardByPrice
  );
  useEffect(() => {
    init();
    async function init() {
      const data = await getOffersForCardByPrice({ cardId, price });
      console.log(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>
        <div>
          <Icon
            style={{ color: Color.brownOrange() }}
            icon={['far', 'badge-dollar']}
          />{' '}
          {addCommasToNumber(price)} Offers
        </div>
      </header>
      <main>
        <div
          style={{
            height: '30rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <Button
            filled
            color="oceanBlue"
            onClick={() => console.log('clicked')}
            style={{
              fontSize: '1.4rem',
              marginTop: '2rem'
            }}
          >
            Accept
          </Button>
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
