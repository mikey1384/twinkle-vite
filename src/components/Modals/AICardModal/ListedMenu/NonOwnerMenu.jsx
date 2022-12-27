import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import MyOffer from '../MyOffer';
import MakeOffer from '../MakeOffer';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

NonOwnerMenu.propTypes = {
  myOffer: PropTypes.object,
  onSetWithdrawOfferModalShown: PropTypes.func.isRequired,
  onSetOfferModalShown: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function NonOwnerMenu({
  myOffer,
  onSetWithdrawOfferModalShown,
  onSetOfferModalShown,
  style
}) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        ...style
      }}
    >
      <div>
        <Button
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem !important;
            }
          `}
          onClick={() => console.log('buy')}
          color="oceanBlue"
          filled
        >
          <Icon
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
            icon="shopping-cart"
          />
          <span
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
            style={{ marginLeft: '0.7rem' }}
          >
            Buy
          </span>
        </Button>
      </div>
      <div>
        {myOffer ? (
          <MyOffer
            className={css`
              margin-top: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 1.5rem;
              }
            `}
            onSetWithdrawOfferModalShown={onSetWithdrawOfferModalShown}
            myOffer={myOffer}
          />
        ) : (
          <MakeOffer
            className={css`
              margin-top: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 1rem;
              }
            `}
            onSetOfferModalShown={onSetOfferModalShown}
          />
        )}
      </div>
    </div>
  );
}
