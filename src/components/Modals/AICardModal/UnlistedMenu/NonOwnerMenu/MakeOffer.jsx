import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

MakeOffer.propTypes = {
  style: PropTypes.object,
  owner: PropTypes.object.isRequired,
  onSetOfferModalShown: PropTypes.func.isRequired,
  userLinkColor: PropTypes.string.isRequired
};

export default function MakeOffer({
  style,
  owner,
  onSetOfferModalShown,
  userLinkColor
}) {
  return (
    <div style={style}>
      <div>
        Owned by
        <div>
          <UsernameText
            color={Color[userLinkColor]()}
            user={{
              username: owner.username,
              id: owner.id
            }}
          />
        </div>
      </div>
      <div
        className={css`
          margin-top: 1.7rem;
          @media (max-width: ${mobileMaxWidth}) {
            margin-top: 1rem;
          }
        `}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
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
    </div>
  );
}
