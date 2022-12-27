import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

MyOffer.propTypes = {
  className: PropTypes.string,
  myOffer: PropTypes.object,
  onSetWithdrawOfferModalShown: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function MyOffer({
  myOffer,
  style,
  className,
  onSetWithdrawOfferModalShown
}) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p>You offered</p>
        <p>
          <Icon
            style={{ color: Color.brownOrange() }}
            icon={['far', 'badge-dollar']}
          />
          <span
            style={{
              marginLeft: '0.3rem',
              color: Color.darkerGray(),
              fontWeight: 'bold'
            }}
          >
            {addCommasToNumber(myOffer.offerPrice)}
          </span>
        </p>
      </div>
      <div style={{ marginTop: '1.3rem' }}>
        <Button
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem !important;
            }
          `}
          onClick={() => onSetWithdrawOfferModalShown(true)}
          color="orange"
          filled
        >
          <Icon
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
            icon="redo"
          />
          <span
            style={{ marginLeft: '0.7rem' }}
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
          >
            Withdraw Offer
          </span>
        </Button>
      </div>
    </div>
  );
}
