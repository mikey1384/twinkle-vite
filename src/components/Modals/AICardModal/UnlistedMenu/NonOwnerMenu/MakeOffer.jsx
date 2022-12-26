import PropTypes from 'prop-types';
import Button from '~/components/Button';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

MakeOffer.propTypes = {
  className: PropTypes.string,
  onSetOfferModalShown: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function MakeOffer({ className, onSetOfferModalShown, style }) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      <Button
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0.7rem !important;
          }
        `}
        onClick={() => onSetOfferModalShown(true)}
        color="oceanBlue"
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
