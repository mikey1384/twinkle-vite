import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';

NonOwnerMenu.propTypes = {
  burnXP: PropTypes.number.isRequired,
  xpNumberColor: PropTypes.string.isRequired,
  owner: PropTypes.object.isRequired,
  onSetOfferModalShown: PropTypes.func.isRequired
};

export default function NonOwnerMenu({
  burnXP,
  xpNumberColor,
  owner,
  onSetOfferModalShown
}) {
  const {
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);

  return (
    <div
      className={css`
        width: 100%;
        font-size: 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
        }
      `}
    >
      <div style={{ width: '100%', textAlign: 'center' }}>
        <b style={{ color: Color.redOrange() }}>Burn</b> value
        <div style={{ marginTop: '0.5rem' }}>
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>
        </div>
        <p
          className={css`
            margin-top: 0.5rem;
            font-size: 1.1rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 0.3rem;
              font-size: 0.8rem;
            }
          `}
        >
          (Burning this card yields{' '}
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>)
        </p>
      </div>
      <div style={{ width: '100%', marginTop: '3rem', textAlign: 'center' }}>
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
    </div>
  );
}
