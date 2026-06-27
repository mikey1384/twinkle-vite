import React, { useEffect, useMemo, useRef, useState } from 'react';
import GradientButton from '~/components/Buttons/GradientButton';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import AICard from '~/components/AICard';
import OfferModal from './OfferModal';
import UsernameText from '~/components/Texts/UsernameText';
import FilterBar from '~/components/FilterBar';
import SellModal from './SellModal';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Loading from '~/components/Loading';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useNotiContext
} from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { returnCardBurnXP } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { Link, useLocation } from 'react-router-dom';
import Icon from '~/components/Icon';
import Offers from './Offers';
import { getVisibleOfferGroups } from './Offers/helpers';
import UnlistedMenu from './UnlistedMenu';
import ListedMenu from './ListedMenu';
import AICardDetails from '~/components/AICardDetails';
import ShareButton from '~/components/Buttons/ShareButton';

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
    case 'error':
      return 'Try Again';
    default:
      return 'Generating...';
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
  const hideAICardOffer = useAppContext(
    (v) => v.requestHelpers.hideAICardOffer
  );
  const generateAICardImage = useAppContext(
    (v) => v.requestHelpers.generateAICardImage
  );
  const getOffersForCard = useAppContext(
    (v) => v.requestHelpers.getOffersForCard
  );
  const getIncomingCardOffers = useAppContext(
    (v) => v.requestHelpers.getIncomingCardOffers
  );
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const onLoadIncomingOffers = useChatContext(
    (v) => v.actions.onLoadIncomingOffers
  );
  const onUpdateMostRecentAICardOfferTimeStamp = useChatContext(
    (v) => v.actions.onUpdateMostRecentAICardOfferTimeStamp
  );
  const onWithdrawOutgoingOffer = useChatContext(
    (v) => v.actions.onWithdrawOutgoingOffer
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateAICardOfferCheckTimeStamp = useAppContext(
    (v) => v.user.actions.onUpdateAICardOfferCheckTimeStamp
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [cardNotFound, setCardNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawOfferModalShown, setWithdrawOfferModalShown] = useState(false);
  const [usermenuShown, setUsermenuShown] = useState(false);
  const [activeTab, setActiveTab] = useState('myMenu');
  const [offerModalShown, setOfferModalShown] = useState(false);
  const [sellModalShown, setSellModalShown] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState('');

  const [callingOpenAITime, setCallingOpenAITime] = useState(0);
  const [prevCardId, setPrevCardId] = useState(null);
  const [nextCardId, setNextCardId] = useState(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [hiddenOfferIds, setHiddenOfferIds] = useState<number[]>([]);
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [offersLoadMoreShown, setOffersLoadMoreShown] = useState(false);
  const userSwitchedTab = useRef(false);
  const isMountedRef = useRef(true);
  const cardIdRef = useRef(cardId);
  const offerReloadRequestIdRef = useRef(0);
  const card = cardObj[cardId];
  const cardOwnerId = Number(card?.ownerId || card?.owner?.id || 0) || null;
  const userIsOwner = !!userId && cardOwnerId === userId;
  cardIdRef.current = cardId;
  const visibleOfferGroups = useMemo(
    () => getVisibleOfferGroups(offers, userIsOwner ? hiddenOfferIds : []),
    [hiddenOfferIds, offers, userIsOwner]
  );
  const highestActiveOfferPrice = useMemo(
    () =>
      offers.reduce(
        (highestPrice, offer) =>
          Math.max(highestPrice, Number(offer.price || 0)),
        0
      ),
    [offers]
  );
  const visibleSellOfferPrice = useMemo(
    () => (visibleOfferGroups.length ? visibleOfferGroups[0].price : 0),
    [visibleOfferGroups]
  );
  const cardIsLive = useMemo(() => {
    return Number(card?.isLive) === 1;
  }, [card?.isLive]);

  const showMenuTabs = useMemo(() => {
    return !!card?.id && !card?.isBurned && cardIsLive;
  }, [card?.id, card?.isBurned, cardIsLive]);
  const generatingImage = useMemo(() => {
    return !!card?.imageGenerationInProgress || !!card?.isImageGenerating;
  }, [card?.imageGenerationInProgress, card?.isImageGenerating]);
  const progressStage: CardImageGenStatus['stage'] = useMemo(() => {
    if (card?.isImageGenerating) {
      return 'generating';
    }
    return (
      (card?.imageGenerationStage as CardImageGenStatus['stage']) ||
      'not_started'
    );
  }, [card?.imageGenerationStage, card?.isImageGenerating]);

  useEffect(() => {
    // Ensure we are in the notification room to receive stream events
    // This is idempotent and guards cases where the global socket join
    // may not have completed before opening this modal.
    isMountedRef.current = true;
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
    reloadCardOffers({ showLoading: true, updateActiveTab: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, cardOwnerId, userId]);

  useEffect(() => {
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    socket.on('ai_card_offer_cancelled', handleAICardOfferCancel);
    socket.on('ai_card_sold', handleAICardSold);
    socket.on('ai_card_offer_hidden', handleAICardOfferHidden);

    function handleAICardOfferPosted({ card }: { card: any }) {
      if (card?.id === cardId) {
        reloadCardOffers({ fromWriter: true });
      }
    }
    function handleAICardOfferCancel({
      cardId: eventCardId
    }: {
      cardId: number;
    }) {
      if (eventCardId === cardId) {
        reloadCardOffers({ fromWriter: true });
      }
    }
    function handleAICardOfferHidden({
      ownerId,
      cardId: eventCardId
    }: {
      ownerId: number;
      cardId: number;
    }) {
      if (ownerId === userId && eventCardId === cardId) {
        reloadCardOffers({ fromWriter: true });
      }
    }

    function handleAICardSold({ card }: { card: any }) {
      if (card?.id === cardId) {
        reloadCardOffers({ fromWriter: true });
      }
    }

    return function cleanUp() {
      socket.off('ai_card_offer_posted', handleAICardOfferPosted);
      socket.off('ai_card_offer_cancelled', handleAICardOfferCancel);
      socket.off('ai_card_sold', handleAICardSold);
      socket.off('ai_card_offer_hidden', handleAICardOfferHidden);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, userId, userIsOwner]);

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
    setImageGenerationError('');
  }, [cardId]);

  const rootPath = useMemo(() => {
    return location.pathname.replace(/\/$/, '');
  }, [location.pathname]);

  const buttonLabel = useMemo(
    () => labelFromStage(progressStage, callingOpenAITime),
    [progressStage, callingOpenAITime]
  );

  return (
    <Modal
      modalKey="AICardModal"
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
          <ShareButton
            variant="full"
            buttonVariant="ghost"
            linkPath={`/ai-cards/?cardId=${cardId}`}
          />
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
              <AICard card={card} />
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
                      && > .nav-section > nav {
                        padding: 0.7rem 1rem;
                      }
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
                  hiddenOfferIds={hiddenOfferIds}
                  onHideOffer={handleHideOffer}
                  onSetOffers={setOffers}
                  onSetLoadMoreShown={setOffersLoadMoreShown}
                  onSetOfferModalShown={setOfferModalShown}
                  ownerId={cardOwnerId || 0}
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
                      {!card.imagePath && userIsOwner && (
                        <>
                          <GradientButton
                            loading={generatingImage}
                            onClick={handleGenerateImage}
                            fontSize="1.5rem"
                            mobileFontSize="1.1rem"
                          >
                            {buttonLabel}
                          </GradientButton>
                          {imageGenerationError && (
                            <div
                              className={css`
                                max-width: 32rem;
                                color: ${Color.rose()};
                                font-weight: bold;
                                text-align: center;
                                font-size: 1.25rem;
                              `}
                            >
                              {imageGenerationError}
                            </div>
                          )}
                        </>
                      )}
                      {cardIsLive &&
                        (card.isListed ? (
                          <ListedMenu
                            burnXP={burnXP}
                            cardId={card.id}
                            myId={userId}
                            myOffer={card.myOffer}
                            userIsOwner={userIsOwner}
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
                            userIsOwner={userIsOwner}
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
                        ))}
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
          displayOfferPrice={visibleSellOfferPrice}
          minimumOfferPrice={highestActiveOfferPrice}
          offers={visibleOfferGroups}
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

  // Hidden state is server-owned (ai_card_offer_hides). Wait for the write to
  // confirm, then reflect it in local view state; no optimistic toggling.
  async function handleHideOffer(offerId: number) {
    const result = await hideAICardOffer({ cardId, offerId });
    if (result?.success) {
      setHiddenOfferIds(result.hiddenOfferIds || []);
      await refreshSharedIncomingOffers();
    }
  }

  async function reloadCardOffers({
    fromWriter = false,
    showLoading = false,
    updateActiveTab = false
  }: {
    fromWriter?: boolean;
    showLoading?: boolean;
    updateActiveTab?: boolean;
  } = {}) {
    const requestId = ++offerReloadRequestIdRef.current;
    if (showLoading) {
      setOffersLoaded(false);
    }
    try {
      const result = await getOffersForCard({ cardId, fromWriter });
      if (
        !result ||
        !isMountedRef.current ||
        requestId !== offerReloadRequestIdRef.current ||
        cardIdRef.current !== cardId
      ) {
        return;
      }
      const loadedOffers = result.offers || [];
      const loadedHidden = result.hiddenOfferIds || [];
      const activeHidden = userIsOwner ? loadedHidden : [];
      if (updateActiveTab && !userSwitchedTab.current) {
        const visibleOffers = getVisibleOfferGroups(
          loadedOffers,
          activeHidden
        );
        // Only auto-open the Offers tab for the owner when there are offers they
        // haven't hidden - an all-hidden card stays on the Menu tab.
        setActiveTab(userIsOwner && visibleOffers.length ? 'offers' : 'myMenu');
      }
      setOffers(loadedOffers);
      setHiddenOfferIds(activeHidden);
      setOffersLoadMoreShown(result.loadMoreShown);
    } catch (error) {
      console.error('Error fetching card offers:', error);
    } finally {
      if (
        isMountedRef.current &&
        requestId === offerReloadRequestIdRef.current &&
        cardIdRef.current === cardId
      ) {
        setOffersLoaded(true);
      }
    }
  }

  async function refreshSharedIncomingOffers() {
    const result = await getIncomingCardOffers(undefined, false);
    if (!result) return;
    const {
      offers,
      loadMoreShown,
      mostRecentOfferTimeStamp,
      recentAICardOfferCheckTimeStamp
    } = result;
    onLoadIncomingOffers({ offers, loadMoreShown });
    onUpdateAICardOfferCheckTimeStamp(recentAICardOfferCheckTimeStamp);
    onUpdateMostRecentAICardOfferTimeStamp(mostRecentOfferTimeStamp || 0);
  }

  async function handleWithdrawOffer() {
    const coins = await deleteAICardOffer({
      offerId: card.myOffer.id,
      cardId: card.id
    });
    onWithdrawOutgoingOffer(card.myOffer.id);
    setOffers((prevOffers) => {
      return prevOffers.reduce((acc, offer) => {
        if (offer.price === card.myOffer.price) {
          const newUsers = offer.users.filter(
            (user: { id: number }) => user.id !== userId
          );
          if (newUsers?.length > 0) {
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
    setImageGenerationError('');
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
      const { card: newState, aiUsagePolicy } = await generateAICardImage({
        cardId: card.id
      });
      if (aiUsagePolicy) {
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy
          }
        });
      }
      if (newState) {
        onUpdateAICard({ cardId: card.id, newState });
      }
    } catch (error: any) {
      console.error(error);
      if (error?.aiUsagePolicy) {
        onUpdateTodayStats({
          newStats: {
            aiUsagePolicy: error.aiUsagePolicy
          }
        });
        setImageGenerationError('Recharge Energy to generate this image.');
      } else {
        setImageGenerationError(
          error?.message || 'Image generation failed. Please try again.'
        );
      }
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
