import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useChatContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';

ListedMenu.propTypes = {
  askPrice: PropTypes.number.isRequired,
  cardId: PropTypes.number.isRequired,
  userIsOwner: PropTypes.bool.isRequired
};

export default function ListedMenu({ cardId, userIsOwner, askPrice }) {
  const delistAICard = useAppContext((v) => v.requestHelpers.delistAICard);
  const onDelistAICard = useChatContext((v) => v.actions.onDelistAICard);
  return (
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
        style={{
          height: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexDirection: 'column'
        }}
        className={css`
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        `}
      >
        <div style={{ marginBottom: '2rem' }}>
          {userIsOwner ? (
            <div style={{ textAlign: 'center' }}>
              You listed this card for
              <div style={{ marginTop: '0.5rem' }}>
                <Icon
                  style={{ color: Color.brownOrange() }}
                  icon={['far', 'badge-dollar']}
                />
                <span
                  style={{
                    marginLeft: '0.3rem',
                    fontWeight: 'bold',
                    color: Color.darkerGray()
                  }}
                >
                  {addCommasToNumber(askPrice)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              Buy this card for
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon
                  style={{ color: Color.brownOrange() }}
                  icon={['far', 'badge-dollar']}
                />
                <span
                  style={{
                    marginLeft: '0.2rem',
                    color: Color.darkerGray(),
                    fontWeight: 'bold'
                  }}
                >
                  {askPrice}
                </span>
              </div>
            </div>
          )}
        </div>
        {userIsOwner ? (
          <Button
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                padding: 0.7rem !important;
              }
            `}
            onClick={handleCancelListing}
            color="rose"
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
              className={css`
                font-size: 1.6rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1rem;
                }
              `}
              style={{ marginLeft: '0.7rem' }}
            >
              Cancel Listing
            </span>
          </Button>
        ) : (
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
        )}
      </div>
    </div>
  );

  async function handleCancelListing() {
    const success = await delistAICard(cardId);
    if (success) {
      onDelistAICard(cardId);
    }
  }
}
