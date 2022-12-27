import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

NonOwnerMenu.propTypes = {
  onSetOfferModalShown: PropTypes.func.isRequired
};

export default function NonOwnerMenu({ onSetOfferModalShown }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
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
      <Button
        className={css`
          margin-top: 3rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0.7rem !important;
          }
        `}
        onClick={() => onSetOfferModalShown(true)}
        color="green"
        filled
      >
        <span
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
        >
          Make offer
        </span>
      </Button>
    </div>
  );
}
