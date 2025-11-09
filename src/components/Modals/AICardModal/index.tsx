import React, { useEffect, useMemo, useRef, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import AICard from '~/components/AICard';
import OfferModal from './OfferModal';
import UsernameText from '~/components/Texts/UsernameText';
import FilterBar from '~/components/FilterBar';
import SellModal from './SellModal';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Loading from '~/components/Loading';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { returnCardBurnXP } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { Link, useLocation } from 'react-router-dom';
import Icon from '~/components/Icon';
import Offers from './Offers';
import UnlistedMenu from './UnlistedMenu';
import ListedMenu from './ListedMenu';
import AICardDetails from '~/components/AICardDetails';

type CardImageStage =
  | 'not_started'
  | 'validating_style'
  | 'prompt_ready'
  | 'calling_openai'
  | 'in_progress'
  | 'generating'
  | 'partial_image'
  | 'downloading'
  | 'uploading'
  | 'completed'
  | 'error';

interface CardImageGenStatus {
  cardId?: number;
  stage: CardImageStage;
  partialImageB64?: string;
  imageUrl?: string;
  message?: string;
}

function labelFromStage(stage: CardImageStage, callingOpenAITime: number) {
  switch (stage) {
    case 'not_started':
      return 'Generate Image';
    case 'validating_style':
      return 'Checking your vibe...';
    case 'prompt_ready':
      return 'Cooking up ideas...';
    case 'calling_openai':
    case 'in_progress':
    case 'generating':
    case 'partial_image':
      if (callingOpenAITime < 20) {
        return `Generating...`;
      } else if (callingOpenAITime < 50) {
        return `Still generating... Hang tight!`;
      } else {
        return `Still working on it...`;
      }
    case 'downloading':
      return 'Rendering pixels...';
    case 'uploading':
      return 'Finalizing...';
    case 'completed':
      return 'Finishing touches...';
    default:
      return 'Sprinkling magic...';
  }
}

export default function AICardModal({
  cardId,
  modalOverModal,
  onHide
}: {
  cardId: number;
  modalOverModal?: boolean;
  onHide: () => any;
}) {
  const location = useLocation();
  const { colorKey: linkColorKey } = useRoleColor('link', {
    fallback: 'logoBlue'
  });
  const { colorKey: userLinkColorKey } = useRoleColor('userLink', {
    fallback: linkColorKey || 'logoBlue'
  });
  const linkColor =
    linkColorKey && linkColorKey in Color ? linkColorKey : 'logoBlue';
  const userLinkColor =
    userLinkColorKey && userLinkColorKey in Color
      ? userLinkColorKey
      : linkColor;
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const signinModalShown = useKeyContext((v) => v.myState.signinModalShown);
  const deleteAICardOffer = useAppContext(
    (v) => v.requestHelpers.deleteAICardOffer
  );
  const generateAICardImage = useAppContext(
    (v) => v.requestHelpers.generateAICardImage
  );
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

  const [callingOpenAITime, setCallingOpenAITime] = useState(0);
  const [prevCardId, setPrevCardId] = useState(null);
  const [nextCardId, setNextCardId] = useState(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [offersLoadMoreShown, setOffersLoadMoreShown] = useState(false);
  const [offerPrice, setOfferPrice] = useState(0);
  const [copied, setCopied] = useState(false);
  const userSwitchedTab = useRef(false);
  const isMountedRef = useRef(true);
  const card = cardObj[cardId];

  const showMenuTabs = useMemo(() => {
    return !!card?.id && !card?.isBurned && card?.isLive !== false;
  }, [card?.id, card?.isBurned, card?.isLive]);
  const generatingImage = useMemo(() => {
    return !!card?.imageGenerationInProgress;
  }, [card?.imageGenerationInProgress]);
  const progressStage: CardImageGenStatus['stage'] = useMemo(() => {
    return (
      (card?.imageGenerationStage as CardImageGenStatus['stage']) ||
      'not_started'
    );
  }, [card?.imageGenerationStage]);
  const previewImageUrl: string = useMemo(() => {
    return card?.imageGenerationPreviewUrl || '';
  }, [card?.imageGenerationPreviewUrl]);

  useEffect(() => {
    // Ensure we are in the notification room to receive stream events
    // This is idempotent and guards cases where the global socket join
    // may not have completed before opening this modal.
    if (userId) {
      try {
        socket.emit('enter_my_notification_channel', userId);
      } catch {
        // no-op
      }
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [userId]);

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
  }, [cardId]);

  useEffect(() => {
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    socket.on('ai_card_offer_cancelled', handleAICardOfferCancel);
    socket.on('ai_card_sold', handleAICardSold);

    function handleAICardOfferPosted({ card, feed }: { card: any; feed: any }) {
      const { offer: incomingOffer } = feed;
      if (card.id === cardId) {
        setOffers((prevOffers) => {
          const result = [];
          let found = false;
          for (const offer of prevOffers) {
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
    function handleAICardOfferCancel({
      cardId,
      price,
      offererId
    }: {
      cardId: number;
      price: number;
      offererId: number;
    }) {
      if (card.id === cardId) {
        setOffers((prevOffers) => {
          const result = [];
          for (const offer of prevOffers) {
            const newOffer = { ...offer };
            if (offer.price === price) {
              newOffer.users = offer.users.filter(
                (user: { id: number }) => user.id !== offererId
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

    function handleAICardSold({ card, feed }: { card: any; feed: any }) {
      if (card.id === cardId) {
        setOffers((prevOffers) => {
          const result = [];
          for (const offer of prevOffers) {
            const newOffer = { ...offer };
            const { transfer } = feed;
            const { offer: acceptedOffer } = transfer;
            if (offer.price === acceptedOffer.price) {
              newOffer.users = offer.users.filter(
                (user: { id: number }) => user.id !== acceptedOffer.userId
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
      socket.off('ai_card_offer_posted', handleAICardOfferPosted);
      socket.off('ai_card_offer_cancelled', handleAICardOfferCancel);
      socket.off('ai_card_sold', handleAICardSold);
    };
  });

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const isActiveStage = [
      'calling_openai',
      'in_progress',
      'generating',
      'partial_image'
    ].includes(progressStage);
    if (isActiveStage) {
      intervalId = setInterval(() => {
        setCallingOpenAITime((time) => time + 1);
      }, 1000);
    } else {
      setCallingOpenAITime(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [progressStage]);

  // Streaming is handled globally in useAPISocket. No local socket listener needed.

  useEffect(() => {
    if (card?.imagePath) {
      setCallingOpenAITime(0);
    }
  }, [card?.imagePath]);

  useEffect(() => {
    setCallingOpenAITime(0);
  }, [cardId]);

  const rootPath = useMemo(() => {
    return location.pathname.replace(/\/$/, '');
  }, [location.pathname]);

  const buttonLabel = useMemo(
    () => labelFromStage(progressStage, callingOpenAITime),
    [progressStage, callingOpenAITime]
  );

  const displayedCard = useMemo(() => {
    if (!card) return card;
    // Only override with preview while there is no final image on the card yet
    if (!card.imagePath && previewImageUrl) {
      return {
        ...card,
        imagePath: previewImageUrl
      };
    }
    return card;
  }, [card, previewImageUrl]);

  return (
    <NewModal
      isOpen
      onClose={onHide}
      size="lg"
      modalLevel={modalOverModal ? 2 : 0}
      closeOnBackdropClick={!(usermenuShown || signinModalShown)}
      header={
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
      }
      footer={
        <>
          <Button
            onClick={() => {
              setCopied(true);
              handleCopyToClipboard();
              setTimeout(() => setCopied(false), 1000);
            }}
            variant="ghost"
          >
            {copied ? null : <Icon icon="copy" />}
            <span style={{ marginLeft: copied ? 0 : '1rem' }}>
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </Button>
          <div
            className={css`
              font-size: 1.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
            style={{
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <div>
              {prevCardId && rootPath.includes('ai-cards') ? (
                <Link
                  style={{
                    opacity: loading ? 0.5 : 1,
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    color: Color[linkColor]()
                  }}
                  to={`./?cardId=${prevCardId}`}
                >
                  <Icon style={{ marginRight: '1rem' }} icon="chevron-left" />
                  Prev
                </Link>
              ) : null}
              {nextCardId && rootPath.includes('ai-cards') ? (
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
              ) : null}
            </div>
          </div>
          <Button variant="ghost" onClick={onHide}>
            Close
          </Button>
        </>
      }
    >
      <div style={{ width: '100%' }}>
        {card ? (
          <div
            className={css`
              display: grid;
              height: auto;
              width: 100%;
              grid-template-columns: 1fr 1.5fr 1fr;
              grid-row-gap: 2rem;
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 1fr 1fr;
                grid-template-rows: auto auto;
              }
            `}
          >
            <div
              className={css`
                grid-column: span 1;
                grid-row: span 1;
                display: flex;
                justify-content: center;
                align-items: center;
                @media (max-width: ${mobileMaxWidth}) {
                  grid-column: 1;
                }
              `}
            >
              <AICard card={displayedCard} />
            </div>
            <div
              className={css`
                grid-column: span 1;
                grid-row: span 1;
                @media (max-width: ${mobileMaxWidth}) {
                  grid-column: 2;
                }
              `}
            >
              <AICardDetails
                style={{
                  gridColumn: 'span 1',
                  gridRow: 'span 1'
                }}
                card={card}
              />
            </div>
            <div
              className={css`
                grid-column: span 1;
                grid-row: span 1;
                @media (max-width: ${mobileMaxWidth}) {
                  margin-top: 2rem;
                  grid-column: 1 / -1;
                  grid-row: 2;
                }
              `}
            >
              {showMenuTabs ? (
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
                    height: showMenuTabs ? 'CALC(100% - 4.5rem)' : '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: card.isBurned ? 0 : '1.5rem'
                  }}
                >
                  {card.isBurned ? (
                    <div
                      style={{
                        fontWeight: 'bold',
                        color: Color.darkerGray()
                      }}
                    >
                      This card was burned
                    </div>
                  ) : (
                    <>
                      {!card.imagePath && (
                        <GradientButton
                          loading={generatingImage}
                          onClick={handleGenerateImage}
                          fontSize="1.5rem"
                          mobileFontSize="1.1rem"
                        >
                          {buttonLabel}
                        </GradientButton>
                      )}
                      {card.isListed ? (
                        <ListedMenu
                          burnXP={burnXP}
                          cardId={card.id}
                          myId={userId}
                          myOffer={card.myOffer}
                          userIsOwner={card.ownerId === userId}
                          askPrice={card.askPrice}
                          onSetWithdrawOfferModalShown={
                            setWithdrawOfferModalShown
                          }
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
                          onSetWithdrawOfferModalShown={
                            setWithdrawOfferModalShown
                          }
                          onSetOfferModalShown={setOfferModalShown}
                        />
                      )}
                    </>
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
      </div>
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
    </NewModal>
  );

  async function handleCopyToClipboard() {
    const contentUrl = `![](https://www.twin-kle.com/ai-cards/?cardId=${cardId})`;
    try {
      await navigator.clipboard.writeText(contentUrl);
    } catch (err) {
      console.error(err);
    }
  }

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
          const newUsers = offer.users.filter(
            (user: { id: number }) => user.id !== userId
          );
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
    if (!card || generatingImage) return;
    // Mark generation as started globally for this card so UI persists across modal open/close
    onUpdateAICard({
      cardId: card.id,
      newState: {
        imageGenerationInProgress: true,
        imageGenerationStage: 'calling_openai',
        imageGenerationPreviewUrl: ''
      }
    });
    try {
      const { card: newState } = await generateAICardImage({
        cardId: card.id
      });
      if (newState) {
        onUpdateAICard({ cardId: card.id, newState });
      }
    } catch (err) {
      console.error(err);
      onUpdateAICard({
        cardId: card.id,
        newState: {
          imageGenerationInProgress: false,
          imageGenerationStage: 'error'
        }
      });
    } finally {
      // Do not flip off global in-progress here; wait for socket event or error
    }
  }
}
