import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import useAICard from '~/helpers/hooks/useAICard';
import AICard from '~/components/AICard';
import SanitizedHTML from 'react-sanitized-html';
import OfferModal from './OfferModal';
import UsernameText from '~/components/Texts/UsernameText';
import FilterBar from '~/components/FilterBar';
import SellModal from './SellModal';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Loading from '~/components/Loading';
import { socket } from '~/constants/io';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { qualityProps, returnCardBurnXP } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import Offers from './Offers';
import UnlistedMenu from './UnlistedMenu';
import ListedMenu from './ListedMenu';

AICardModal.propTypes = {
  cardId: PropTypes.number.isRequired,
  modalOverModal: PropTypes.bool,
  onHide: PropTypes.func.isRequired
};

export default function AICardModal({ cardId, modalOverModal, onHide }) {
  const {
    link: { color: linkColor },
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);
  const { userId, username, twinkleCoins, signinModalShown } = useKeyContext(
    (v) => v.myState
  );
  const deleteAICardOffer = useAppContext(
    (v) => v.requestHelpers.deleteAICardOffer
  );
  const getOpenAiImage = useAppContext((v) => v.requestHelpers.getOpenAiImage);
  const saveAIImageToS3 = useAppContext(
    (v) => v.requestHelpers.saveAIImageToS3
  );
  const postAICard = useAppContext((v) => v.requestHelpers.postAICard);
  const getOffersForCard = useAppContext(
    (v) => v.requestHelpers.getOffersForCard
  );
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const onWithdrawOutgoingOffer = useChatContext(
    (v) => v.actions.onWithdrawOutgoingOffer
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [cardNotFound, setCardNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawOfferModalShown, setWithdrawOfferModalShown] = useState(false);
  const [usermenuShown, setUsermenuShown] = useState(false);
  const [activeTab, setActiveTab] = useState('myMenu');
  const [offerModalShown, setOfferModalShown] = useState(false);
  const [sellModalShown, setSellModalShown] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [prevCardId, setPrevCardId] = useState(null);
  const [nextCardId, setNextCardId] = useState(null);
  const [offers, setOffers] = useState([]);
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [offersLoadMoreShown, setOffersLoadMoreShown] = useState(false);
  const [offerPrice, setOfferPrice] = useState(0);
  const userSwitchedTab = useRef(false);
  const card = cardObj[cardId];

  const burnXP = useMemo(() => {
    return returnCardBurnXP({
      cardLevel: card?.level,
      cardQuality: card?.quality
    });
  }, [card?.level, card?.quality]);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { card, prevCardId, nextCardId } = await loadAICard(cardId);
      setPrevCardId(prevCardId);
      setNextCardId(nextCardId);
      if (card) {
        onUpdateAICard({
          cardId: card.id,
          newState: card
        });
      } else {
        setCardNotFound(true);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, userId]);

  const { promptText } = useAICard(card);

  useEffect(() => {
    loadOffers();
    async function loadOffers() {
      const { offers: loadedOffers, loadMoreShown } = await getOffersForCard({
        cardId
      });
      setOfferPrice(loadedOffers.length ? loadedOffers[0].price : 0);
      if (!userSwitchedTab.current) {
        setActiveTab(
          card?.ownerId === userId && loadedOffers.length ? 'offers' : 'myMenu'
        );
      }
      setOffers(loadedOffers);
      setOffersLoaded(true);
      setOffersLoadMoreShown(loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    socket.on('ai_card_offer_cancelled', handleAICardOfferCancel);
    socket.on('ai_card_sold', handleAICardSold);

    function handleAICardOfferPosted({ card, feed }) {
      const { offer: incomingOffer } = feed;
      if (card.id === cardId) {
        setOffers((prevOffers) => {
          const result = [];
          let found = false;
          for (let offer of prevOffers) {
            const newOffer = { ...offer };
            if (offer.price === incomingOffer.price) {
              found = true;
              newOffer.users = [...offer.users, incomingOffer.user];
            }
            result.push(newOffer);
          }
          if (!found) {
            result.unshift({
              price: incomingOffer.price,
              users: [incomingOffer.user]
            });
          }
          return result;
        });
      }
    }
    function handleAICardOfferCancel({ cardId, price, offererId }) {
      if (card.id === cardId) {
        setOffers((prevOffers) => {
          const result = [];
          for (let offer of prevOffers) {
            const newOffer = { ...offer };
            if (offer.price === price) {
              newOffer.users = offer.users.filter(
                (user) => user.id !== offererId
              );
            }
            if (newOffer.users.length) {
              result.push(newOffer);
            }
          }
          return result;
        });
      }
    }

    function handleAICardSold({ card, feed }) {
      if (card.id === cardId) {
        setOffers((prevOffers) => {
          const result = [];
          for (let offer of prevOffers) {
            const newOffer = { ...offer };
            const { transfer } = feed;
            const { offer: acceptedOffer } = transfer;
            if (offer.price === acceptedOffer.price) {
              newOffer.users = offer.users.filter(
                (user) => user.id !== acceptedOffer.userId
              );
            }
            if (newOffer.users.length) {
              result.push(newOffer);
            }
          }
          return result;
        });
      }
    }

    return function cleanUp() {
      socket.removeListener('ai_card_offer_posted', handleAICardOfferPosted);
      socket.removeListener('ai_card_offer_cancelled', handleAICardOfferCancel);
      socket.removeListener('ai_card_sold', handleAICardSold);
    };
  });

  return (
    <Modal
      closeWhenClickedOutside={!(usermenuShown || signinModalShown)}
      large
      modalOverModal={modalOverModal}
      onHide={onHide}
    >
      <header>
        <div>
          Card #{cardId}{' '}
          {card && !card.isBurned && (
            <div
              style={{
                display: 'inline',
                fontWeight: 'normal',
                fontSize: '1.3rem'
              }}
            >
              (owned by{' '}
              <UsernameText
                color={Color[userLinkColor]()}
                onMenuShownChange={setUsermenuShown}
                displayedName={
                  card.ownerId === userId ? 'you' : card.owner?.username
                }
                user={{
                  username: card.owner?.username,
                  id: card.ownerId
                }}
              />
              )
            </div>
          )}
        </div>
      </header>
      <main>
        {card ? (
          <div
            className={css`
              display: grid;
              height: auto;
              width: 100%;
              grid-template-columns: 1fr 1.5fr 1fr;
              grid-row-gap: 2rem;
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 1fr 2fr 1fr;
              }
            `}
          >
            <div
              style={{
                gridColumn: 'span 1',
                gridRow: 'span 1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <AICard card={card} />
            </div>
            <div
              style={{
                gridColumn: 'span 1',
                gridRow: 'span 1'
              }}
            >
              <div
                style={{
                  gridColumn: 'span 1',
                  gridRow: 'span 1',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  height: '100%',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: '100%',
                    padding: '0 1rem'
                  }}
                >
                  <div
                    className={`card-quality ${css`
                      font-size: 1.6rem;
                      font-family: Open Sans, sans-serif;
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1rem;
                      }
                    `}`}
                  >
                    <b
                      style={{
                        ...qualityProps[card.quality]
                      }}
                    >
                      {card.quality}
                    </b>{' '}
                    card
                  </div>
                  <div
                    className={css`
                      padding: 3rem 5rem 5rem 5rem;
                      text-align: center;
                      @media (max-width: ${mobileMaxWidth}) {
                        padding: 3rem 2rem 4rem 2rem;
                      }
                    `}
                  >
                    <span
                      className={css`
                        font-family: Roboto Mono, monospace;
                        font-size: 1.5rem;
                        @media (max-width: ${mobileMaxWidth}) {
                          font-size: 1.1rem;
                        }
                      `}
                    >
                      <SanitizedHTML
                        allowedAttributes={{ b: ['style'] }}
                        html={`"${promptText}"`}
                      />
                    </span>
                  </div>
                  <div>
                    <b
                      className={css`
                        font-size: 1.3rem;
                        font-family: helvetica, sans-serif;
                        color: ${Color.darkerGray()};
                        @media (max-width: ${mobileMaxWidth}) {
                          font-size: 1rem;
                        }
                      `}
                    >
                      {card.style}
                    </b>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ gridColumn: 'span 1', gridRow: 'span 1' }}>
              {!card.isBurned && card.imagePath ? (
                <FilterBar
                  className={css`
                    font-size: 1.5rem !important;
                    height: 4.5rem !important;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.1rem !important;
                      height: 3rem !important;
                    }
                  `}
                >
                  <nav
                    className={activeTab === 'myMenu' ? 'active' : ''}
                    onClick={() => {
                      userSwitchedTab.current = true;
                      setActiveTab('myMenu');
                    }}
                  >
                    Menu
                  </nav>
                  <nav
                    className={activeTab === 'offers' ? 'active' : ''}
                    onClick={() => {
                      userSwitchedTab.current = true;
                      setActiveTab('offers');
                    }}
                  >
                    Offers
                  </nav>
                </FilterBar>
              ) : null}
              {activeTab === 'offers' ? (
                <Offers
                  cardId={cardId}
                  getOffersForCard={getOffersForCard}
                  offers={offers}
                  onSetOffers={setOffers}
                  onSetLoadMoreShown={setOffersLoadMoreShown}
                  onSetOfferModalShown={setOfferModalShown}
                  ownerId={card.owner?.id}
                  onSetActiveTab={setActiveTab}
                  loaded={offersLoaded}
                  loadMoreShown={offersLoadMoreShown}
                  onUserMenuShownChange={setUsermenuShown}
                  usermenuShown={usermenuShown}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: card.isBurned ? '100%' : 'CALC(100% - 4.5rem)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column'
                  }}
                >
                  {!card.imagePath ? (
                    <GradientButton
                      loading={generatingImage}
                      onClick={handleGenerateImage}
                      fontSize="1.5rem"
                      mobileFontSize="1.1rem"
                    >
                      {generatingImage ? 'Generating...' : 'Generate Image'}
                    </GradientButton>
                  ) : card.isBurned ? (
                    <div
                      style={{
                        fontWeight: 'bold',
                        color: Color.darkerGray()
                      }}
                    >
                      This card was burned
                    </div>
                  ) : card.isListed ? (
                    <ListedMenu
                      burnXP={burnXP}
                      cardId={card.id}
                      myId={userId}
                      myOffer={card.myOffer}
                      userIsOwner={card.ownerId === userId}
                      askPrice={card.askPrice}
                      onSetWithdrawOfferModalShown={setWithdrawOfferModalShown}
                      onSetOfferModalShown={setOfferModalShown}
                    />
                  ) : (
                    <UnlistedMenu
                      burnXP={burnXP}
                      cardId={card.id}
                      cardLevel={card.level}
                      cardQuality={card.quality}
                      userIsOwner={card.ownerId === userId}
                      myId={userId}
                      myOffer={card.myOffer}
                      onSetSellModalShown={setSellModalShown}
                      owner={card.owner}
                      onUserMenuShownChange={setUsermenuShown}
                      onSetWithdrawOfferModalShown={setWithdrawOfferModalShown}
                      onSetOfferModalShown={setOfferModalShown}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : cardNotFound ? (
          <div>
            <h3>This card does not exist</h3>
          </div>
        ) : (
          <Loading />
        )}
      </main>
      <footer>
        <div
          className={css`
            font-size: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
          style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}
        >
          <div>
            {prevCardId && (
              <Link
                style={{
                  opacity: loading ? 0.5 : 1,
                  textDecoration: 'none',
                  marginLeft: '7rem',
                  fontWeight: 'bold',
                  color: Color[linkColor]()
                }}
                to={`./?cardId=${prevCardId}`}
              >
                <Icon style={{ marginRight: '1rem' }} icon="chevron-left" />
                Prev
              </Link>
            )}
            {nextCardId && (
              <Link
                style={{
                  opacity: loading ? 0.5 : 1,
                  marginLeft: '5rem',
                  fontWeight: 'bold',
                  color: Color[linkColor]()
                }}
                to={`./?cardId=${nextCardId}`}
              >
                Next
                <Icon style={{ marginLeft: '1rem' }} icon="chevron-right" />
              </Link>
            )}
          </div>
        </div>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
      {offerModalShown && (
        <OfferModal
          cardId={card.id}
          askPrice={card.askPrice}
          myId={userId}
          myUsername={username}
          twinkleCoins={twinkleCoins}
          onSetOffers={setOffers}
          onHide={() => setOfferModalShown(false)}
        />
      )}
      {sellModalShown && (
        <SellModal
          card={card}
          offerPrice={offerPrice}
          offers={offers}
          offersLoaded={offersLoaded}
          onHide={() => setSellModalShown(false)}
        />
      )}
      {withdrawOfferModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setWithdrawOfferModalShown(false)}
          title={`Withdraw offer for card #${card.id}`}
          onConfirm={handleWithdrawOffer}
        />
      )}
    </Modal>
  );

  async function handleWithdrawOffer() {
    const coins = await deleteAICardOffer({
      offerId: card.myOffer.id,
      cardId: card.id
    });
    // the following three lines are redundant with the websocket but are here in case the websocket fails
    onWithdrawOutgoingOffer(card.myOffer.id);
    setOffers((prevOffers) => {
      return prevOffers.reduce((acc, offer) => {
        if (offer.price === card.myOffer.price) {
          let newUsers = offer.users.filter((user) => user.id !== userId);
          if (newUsers.length > 0) {
            acc.push({ ...offer, users: newUsers });
          }
          return acc;
        } else {
          acc.push(offer);
          return acc;
        }
      }, []);
    });
    onSetUserState({ userId, newState: { twinkleCoins: coins } });
    onUpdateAICard({ cardId, newState: { myOffer: null } });

    setWithdrawOfferModalShown(false);
  }

  async function handleGenerateImage() {
    setGeneratingImage(true);
    try {
      const { imageUrl, style } = await getOpenAiImage(card.prompt);
      const imagePath = await saveAIImageToS3(imageUrl);
      const { card: newState } = await postAICard({
        imagePath,
        cardId: card.id,
        style
      });
      onUpdateAICard({ cardId: card.id, newState: newState });
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingImage(false);
    }
  }
}
