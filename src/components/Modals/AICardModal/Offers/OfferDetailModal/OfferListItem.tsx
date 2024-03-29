import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import moment from 'moment';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function OfferListItem({
  offer,
  onUserMenuShownChange,
  onAcceptClick,
  cardId,
  ownerId,
  userLinkColor,
  userId
}: {
  offer: any;
  onUserMenuShownChange: (v: boolean) => void;
  onAcceptClick: (offer: any) => void;
  cardId: number;
  ownerId: number;
  userLinkColor: string;
  userId: number;
}) {
  const [accepting, setAccepting] = useState(false);
  const deleteAICardOffer = useAppContext(
    (v) => v.requestHelpers.deleteAICardOffer
  );
  const displayedTimeStamp = useMemo(
    () => moment.unix(offer.timeStamp).format('lll'),
    [offer.timeStamp]
  );
  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/Offers/OfferListItem">
      <nav
        className={css`
          height: 7rem;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            height: 3rem;
            font-size: 1rem;
          }
        `}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between '
          }}
        >
          <div
            style={{
              flexGrow: 1,
              display: 'flex',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <div>
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />
              <span style={{ marginLeft: '0.2rem' }}>
                <b style={{ color: Color.darkerGray() }}>
                  {addCommasToNumber(offer.price)}
                </b>
                <span> offer </span> from{' '}
              </span>
              <UsernameText
                onMenuShownChange={onUserMenuShownChange}
                color={Color[userLinkColor]()}
                displayedName={offer.userId === userId ? 'you' : offer.username}
                user={{
                  username: offer.username,
                  id: offer.userId
                }}
              />{' '}
              <span
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.darkGray()};
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 0.7rem;
                  }
                `}
              >
                ({displayedTimeStamp})
              </span>
            </div>
          </div>
          {ownerId === userId && (
            <div>
              <Button
                onClick={handleAcceptClick}
                color="oceanBlue"
                filled
                mobilePadding="0.5rem"
                mobileBorderRadius="3px"
                loading={accepting}
              >
                <span
                  className={css`
                    font-size: 1.5rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 0.8rem;
                    }
                  `}
                >
                  {offer.userId === userId ? 'Take Coins' : 'Accept'}
                </span>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </ErrorBoundary>
  );

  async function handleAcceptClick() {
    if (offer.userId === userId) {
      try {
        setAccepting(true);
        await deleteAICardOffer({
          offerId: offer.id,
          cardId
        });
      } catch (error) {
        console.error(error);
        setAccepting(false);
      }
    } else {
      onAcceptClick(offer);
    }
  }
}
