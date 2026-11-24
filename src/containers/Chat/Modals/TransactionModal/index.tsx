import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectAICardModal from '../../../../components/Modals/SelectAICardModal';
import SelectGroupsModal from './SelectGroupsModal';
import SelectBuildsModal from './SelectBuildsModal';
import type { TradeBuild } from '~/components/Build/TradeBuilds';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import TransactionInitiator from './TransactionInitiator';
import Loading from '~/components/Loading';
import TransactionHandler from './TransactionHandler';
import ReviewModal from '../../Trade/ReviewModal';
import BatteryAmountPicker from './BatteryAmountPicker';
import { fullBatteryUnits } from '~/helpers/battery';
import {
  emptyBundle,
  getViewerTradeTerms,
  hasTradeAssets,
  isInterestOnlyTrade,
  parseTradeCoins
} from '../../Trade/helpers/terms';
import {
  bundleBurnValueLabel,
  matchingBurnSummary,
  summarizeBundleWithBurnValue
} from '../../Trade/helpers/burnValue';
import type { TradeReview, TradeTerms } from '../../Trade/types';
import { errorClass, footerActionsClass } from '../../Trade/styles';
import { useNavigate } from 'react-router-dom';
import { socket } from '~/constants/sockets/api';
import { notifyBuildOwnershipChanged } from '~/helpers/buildOwnershipEvents';
import {
  clearPendingTransactionRequest,
  getTransactionClientRequestId
} from './pendingTransactionRequest';
import { applyCanonicalCoinsAndReconcile } from '~/helpers/canonicalUserCoins';

export default function TransactionModal({
  initialBuild,
  initialOption,
  currentTransactionId,
  channelId,
  isAICardModalShown,
  groupObjs,
  onHide,
  onSetAICardModalCardId,
  onSetGroupObjs,
  partner
}: {
  initialBuild?: TradeBuild;
  initialOption?: string;
  currentTransactionId: number;
  channelId: number;
  isAICardModalShown: boolean;
  groupObjs: Record<number, any>;
  onHide: () => any;
  onSetAICardModalCardId: (v: any) => any;
  onSetGroupObjs: (v: any) => any;
  partner: { username: string; id: number };
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!channelId);
  const [loadError, setLoadError] = useState('');
  const [offerUpdateNotice, setOfferUpdateNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [counterTerms, setCounterTerms] = useState<TradeTerms | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  const myId = useKeyContext((v) => v.myState.userId);
  const balance = useKeyContext((v) => v.myState.twinkleCoins);
  const loadPendingTransaction = useAppContext(
    (v) => v.requestHelpers.loadPendingTransaction
  );
  const postTradeRequest = useAppContext(
    (v) => v.requestHelpers.postTradeRequest
  );
  const loadCoins = useAppContext((v) => v.requestHelpers.loadCoins);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [aiCardModalType, setAICardModalType] = useState<
    'offer' | 'want' | null
  >(null);
  const [groupModalType, setGroupModalType] = useState<'offer' | 'want' | null>(
    null
  );
  const [buildModalType, setBuildModalType] = useState<'offer' | 'want' | null>(
    null
  );
  const [selectedOption, setSelectedOption] = useState(initialOption || 'want');
  const [selectedBuilds, setSelectedBuilds] = useState<
    Record<'offer' | 'want', TradeBuild[]>
  >({
    offer:
      initialBuild && Number(initialBuild.userId) === myId
        ? [initialBuild]
        : [],
    want:
      initialBuild && Number(initialBuild.userId) !== myId ? [initialBuild] : []
  });
  const [coinInputs, setCoinInputs] = useState({ offer: '', want: '' });
  const [batteryUnits, setBatteryUnits] = useState({ offer: 0, want: 0 });
  const [batteryPickerSide, setBatteryPickerSide] = useState<
    'offer' | 'want' | null
  >(null);
  // GET /chat/trade/battery: today's giveable battery, the receive room left,
  // the site-day end and whether battery may move between this pair at all.
  // Canonical server values only; the battery UI stays hidden until they load
  // (and while the API switch is off).
  const [batteryInfo, setBatteryInfo] = useState<{
    enabled: boolean;
    giveableUnits?: number;
    receiveRoomUnits?: number;
    dayEndsAt?: number;
    allowed?: boolean;
    message?: string | null;
  } | null>(null);
  const loadBatteryTradeInfo = useAppContext(
    (v) => v.requestHelpers.loadBatteryTradeInfo
  );
  const [review, setReview] = useState<TradeReview | null>(null);
  const [selectedCardIdsObj, setSelectedCardIdsObj] = useState<
    Record<'offer' | 'want', number[]>
  >({ offer: [], want: [] });
  const [selectedGroupIdsObj, setSelectedGroupIdsObj] = useState<
    Record<'offer' | 'want', number[]>
  >({ offer: [], want: [] });

  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    setLoading(true);
    setLoadError('');
    setReview(null);
    void load();
    async function load() {
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        try {
          const { transaction } = await loadPendingTransaction(channelId);
          if (!cancelled) {
            setPendingTransaction(transaction);
            setLoading(false);
          }
          return;
        } catch {
          if (cancelled) return;
          if (attempt === 2) {
            setLoadError(
              'The current offer could not load. Retry before starting a trade.'
            );
            setLoading(false);
          } else
            await new Promise<void>((resolve) => {
              timer = setTimeout(resolve, 1000);
            });
        }
      }
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, currentTransactionId, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setBatteryInfo(null);
    loadBatteryTradeInfo(partner.id)
      .then((info: any) => {
        if (!cancelled) setBatteryInfo(info || { enabled: false });
      })
      .catch(() => {
        if (!cancelled) setBatteryInfo({ enabled: false });
      });
    return () => {
      cancelled = true;
    };
    // a new offer or a refreshed modal reads fresh balances
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner.id, reloadKey]);

  const offerCoins = parseTradeCoins(coinInputs.offer);
  const wantCoins = parseTradeCoins(coinInputs.want);
  const isTrade = selectedOption === 'want';
  const netGiveCoins = isTrade
    ? Math.max(offerCoins.amount - wantCoins.amount, 0)
    : offerCoins.amount;
  const netReceiveCoins = isTrade
    ? Math.max(wantCoins.amount - offerCoins.amount, 0)
    : 0;
  const coinErrors = {
    offer:
      offerCoins.error ||
      (netGiveCoins > Number(balance)
        ? `You need ${netGiveCoins.toLocaleString('en-US')} coins, but your balance is ${Number(balance).toLocaleString('en-US')}. Your amount has not been changed.`
        : ''),
    want: isTrade ? wantCoins.error : ''
  };
  const coinExplanation =
    isTrade && offerCoins.amount > 0 && wantCoins.amount > 0
      ? netGiveCoins
        ? `Coins are entered on both sides. Only the difference moves: you give ${netGiveCoins.toLocaleString('en-US')} coins.`
        : netReceiveCoins
          ? `Coins are entered on both sides. Only the difference moves: you receive ${netReceiveCoins.toLocaleString('en-US')} coins.`
          : 'The coin amounts cancel each other out. No coins will move.'
      : '';
  // Battery entered on both sides is netted like coins: only the difference
  // moves (the server accepts battery going one way only).
  const showcaseOnly = selectedOption === 'offer';
  const offerBattery = showcaseOnly ? 0 : batteryUnits.offer;
  const netGiveBattery = isTrade
    ? Math.max(offerBattery - batteryUnits.want, 0)
    : offerBattery;
  const netReceiveBattery = isTrade
    ? Math.max(batteryUnits.want - offerBattery, 0)
    : 0;
  const batteryEnabled = !!batteryInfo?.enabled;
  const batteryError =
    batteryEnabled &&
    netGiveBattery > Number(batteryInfo?.giveableUnits || 0) &&
    netGiveBattery > 0
      ? "You don't have that much battery left to give today."
      : '';
  const give = {
    coins: netGiveCoins,
    battery: netGiveBattery,
    ...selectedCards('offer', selectedCardIdsObj.offer),
    groupIds: selectedGroupIdsObj.offer,
    builds: selectedBuilds.offer
  };
  const hasGive = hasTradeAssets(give);
  // Anything entered on the receive side, before coins and battery are
  // netted (an invalid coin entry counts: it is still an ask).
  const asksForSomething =
    isTrade &&
    Boolean(
      wantCoins.amount ||
      wantCoins.error ||
      batteryUnits.want ||
      selectedCardIdsObj.want.length ||
      selectedGroupIdsObj.want.length ||
      selectedBuilds.want.length
    );
  // A give side that came prefilled from an explicit trade intent (a
  // counteroffer, or "Sell or trade" on an app) never turns into a gift by
  // itself; the Gift tab is still one press away there.
  const prefilledTrade =
    !!counterTerms || (!!initialBuild && initialOption === 'want');
  // Trade tab with things to give and nothing asked back: send it as a gift
  // (Mikey 11-24, no switching to the Gift tab first). It becomes exactly the
  // gift the Gift tab sends: same terms, review and request (type 'send').
  const giftFromTrade =
    isTrade && hasGive && !asksForSomething && !prefilledTrade;
  const terms: TradeTerms = {
    give,
    receive:
      isTrade && !giftFromTrade
        ? {
            coins: netReceiveCoins,
            battery: netReceiveBattery,
            ...selectedCards('want', selectedCardIdsObj.want),
            groupIds: selectedGroupIdsObj.want,
            builds: selectedBuilds.want
          }
        : emptyBundle()
  };
  const sides = isTrade ? (['offer', 'want'] as const) : (['offer'] as const);
  const unavailableCard = sides.some((side) =>
    selectedCardIdsObj[side].some(
      (id) =>
        cardObj[id]?.isBurned ||
        (cardObj[id]?.ownerId &&
          Number(cardObj[id].ownerId) !==
            (side === 'offer' ? myId : partner.id))
    )
  );
  const unavailableApp = sides.some((side) =>
    selectedBuilds[side].some((app) => app.unavailable)
  );
  const selectionError =
    unavailableCard || unavailableApp
      ? 'An item is no longer available. Remove it or choose it again; it will not be silently left out.'
      : '';
  const validationError =
    coinErrors.offer || coinErrors.want || selectionError || batteryError;
  const hasReceive = hasTradeAssets(terms.receive);
  const canReview =
    !validationError && (isTrade && !giftFromTrade ? hasReceive : hasGive);
  const showHandler =
    !!pendingTransaction &&
    !(
      pendingTransaction.type === 'send' &&
      Number(pendingTransaction.from) === myId
    );
  const childModalShown =
    isAICardModalShown ||
    dropdownShown ||
    !!aiCardModalType ||
    !!groupModalType ||
    !!buildModalType ||
    !!batteryPickerSide ||
    !!review;
  const mode =
    selectedOption === 'send' || giftFromTrade
      ? 'send'
      : selectedOption === 'offer'
        ? 'show'
        : hasGive
          ? 'trade'
          : 'request';

  return (
    <ErrorBoundary componentPath="Chat/Modals/TransactionModal">
      <Modal
        modalKey="TransactionModal"
        isOpen
        size="lg"
        title={
          showHandler
            ? isInterestOnlyTrade(pendingTransaction)
              ? `Interest in ${Number(pendingTransaction.from) === myId ? `${partner.username}'s` : 'your'} items`
              : `Offer with ${partner.username}`
            : selectedOption === 'send'
              ? `Gift to ${partner.username}`
              : selectedOption === 'offer'
                ? `Show items to ${partner.username}`
                : `Trade with ${partner.username}`
        }
        onClose={childModalShown ? () => {} : onHide}
        closeOnBackdropClick={!childModalShown}
        footer={
          <div style={{ width: '100%' }}>
            {!showHandler && !loading && !loadError && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem 2rem',
                  marginBottom: '1rem',
                  fontSize: '1.2rem',
                  lineHeight: 1.5
                }}
              >
                {mode === 'request' ? (
                  <span>
                    <b>Interested in:</b>{' '}
                    {summarizeBundleWithBurnValue(terms.receive)}
                  </span>
                ) : (
                  <>
                    <span>
                      <b>
                        {selectedOption === 'offer' ? 'You show' : 'You give'}:
                      </b>{' '}
                      {summarizeBundleWithBurnValue(terms.give)}
                    </span>
                    {selectedOption !== 'offer' && (
                      <span>
                        <b>You receive:</b>{' '}
                        {mode === 'send'
                          ? 'Nothing in return'
                          : summarizeBundleWithBurnValue(terms.receive)}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
            <div className={footerActionsClass}>
              <Button
                variant="ghost"
                onClick={childModalShown ? () => {} : onHide}
              >
                {showHandler ? 'Close' : 'Cancel'}
              </Button>
              {!showHandler && !loadError && (
                <Button
                  disabled={loading || !canReview}
                  color="logoBlue"
                  onClick={handleReview}
                >
                  {giftFromTrade
                    ? 'Send as a gift'
                    : mode === 'send'
                      ? 'Review gift'
                      : mode === 'show'
                        ? 'Review showcase'
                        : mode === 'request'
                          ? 'Review interest'
                          : 'Review offer'}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div style={{ width: '100%', minWidth: 0 }}>
          {offerUpdateNotice && (
            <p role="alert" className={errorClass}>
              {offerUpdateNotice}
            </p>
          )}
          {loading ? (
            <Loading />
          ) : loadError ? (
            <div>
              <p className={errorClass} role="alert">
                {loadError}
              </p>
              <Button onClick={() => setReloadKey((key) => key + 1)}>
                Retry
              </Button>
            </div>
          ) : showHandler ? (
            <TransactionHandler
              onRefreshTransaction={handlePendingOfferChanged}
              currentTransactionId={currentTransactionId}
              isAICardModalShown={isAICardModalShown}
              myId={myId}
              groupObjs={groupObjs}
              onSetAICardModalCardId={onSetAICardModalCardId}
              onSetGroupObjs={onSetGroupObjs}
              onSetPendingTransaction={setPendingTransaction}
              onAcceptTrade={onHide}
              onCounterPropose={handleCounterPropose}
              partner={partner}
              transactionDetails={pendingTransaction}
              channelId={channelId}
            />
          ) : (
            <>
              <TransactionInitiator
                terms={terms}
                coinInputs={coinInputs}
                coinErrors={coinErrors}
                balance={balance}
                isCounterPropose={!!counterTerms}
                selectedOption={selectedOption}
                sendsAsGift={giftFromTrade}
                partner={partner}
                groupObjs={groupObjs}
                onSetSelectedOption={setSelectedOption}
                onCoinChange={(side, value) =>
                  setCoinInputs((current) => ({ ...current, [side]: value }))
                }
                onChoose={handleChoose}
                onRemove={handleRemove}
                onSetAICardModalCardId={onSetAICardModalCardId}
                coinExplanation={coinExplanation}
                battery={
                  batteryEnabled
                    ? {
                        units: batteryUnits,
                        giveableUnits: Number(batteryInfo?.giveableUnits || 0),
                        expiresAt: Number(batteryInfo?.dayEndsAt || 0),
                        unavailableMessage:
                          batteryInfo?.allowed === false
                            ? batteryInfo?.message ||
                              "Battery can't be sent between these accounts."
                            : ''
                      }
                    : null
                }
                onChooseBattery={setBatteryPickerSide}
                onRemoveBattery={(side) =>
                  setBatteryUnits((current) => ({ ...current, [side]: 0 }))
                }
              />
              {(selectionError || batteryError) && (
                <p role="alert" className={errorClass}>
                  {selectionError || batteryError}
                </p>
              )}
              {isTrade && !hasReceive && hasGive && !giftFromTrade && (
                <p style={{ fontSize: '1.3rem' }}>
                  Add what you want to receive, or choose “Give a gift” if you
                  want nothing back.
                </p>
              )}
            </>
          )}
          {!!aiCardModalType && (
            <SelectAICardModal
              allowEmptySelection
              aiCardModalType={aiCardModalType}
              partner={partner}
              currentlySelectedCardIds={selectedCardIdsObj[aiCardModalType]}
              getSelectionBurnLabel={(ids) =>
                bundleBurnValueLabel(selectedCards(aiCardModalType, ids))
              }
              onDropdownShown={setDropdownShown}
              onSetAICardModalCardId={onSetAICardModalCardId}
              onSelectDone={handleCardSelection}
              onHide={
                isAICardModalShown || dropdownShown
                  ? () => {}
                  : () => setAICardModalType(null)
              }
            />
          )}
          {buildModalType && (
            <SelectBuildsModal
              type={buildModalType}
              partnerId={partner.id}
              selected={selectedBuilds[buildModalType]}
              onHide={() => setBuildModalType(null)}
              onDone={(builds) => {
                setSelectedBuilds((current) => ({
                  ...current,
                  [buildModalType]: builds
                }));
                setBuildModalType(null);
              }}
            />
          )}
          {batteryPickerSide && batteryEnabled && (
            <BatteryAmountPicker
              side={batteryPickerSide === 'offer' ? 'give' : 'receive'}
              partnerName={partner.username}
              maxUnits={
                batteryPickerSide === 'offer'
                  ? Number(batteryInfo?.giveableUnits || 0)
                  : Math.min(
                      Number(batteryInfo?.receiveRoomUnits || 0),
                      fullBatteryUnits()
                    )
              }
              initialUnits={batteryUnits[batteryPickerSide] || undefined}
              expiresAt={Number(batteryInfo?.dayEndsAt || 0)}
              nowMs={Date.now()}
              onHide={() => setBatteryPickerSide(null)}
              onDone={(units) => {
                setBatteryUnits((current) => ({
                  ...current,
                  [batteryPickerSide]: units
                }));
                setBatteryPickerSide(null);
              }}
            />
          )}
          {!!groupModalType && (
            <SelectGroupsModal
              onHide={() => setGroupModalType(null)}
              onSelectDone={handleGroupSelection}
              currentlySelectedGroupIds={selectedGroupIdsObj[groupModalType]}
              type={groupModalType}
              partner={partner}
              groupObjs={groupObjs}
              onSetGroupObjs={onSetGroupObjs}
            />
          )}
          {review && (
            <ReviewModal
              review={review}
              partnerName={partner.username}
              groupObjs={groupObjs}
              onInspectCard={onSetAICardModalCardId}
              isAICardModalShown={isAICardModalShown}
              onHide={() => setReview(null)}
              onConfirm={() => handleConfirm(review)}
            />
          )}
        </div>
      </Modal>
    </ErrorBoundary>
  );

  function selectedCards(side: 'offer' | 'want', ids: number[]) {
    const original = side === 'offer' ? counterTerms?.give : counterTerms?.receive;
    return {
      cardIds: ids,
      cards: ids.map((id) => ({
        ...original?.cards?.find((card) => Number(card?.id) === Number(id)),
        ...cardObj[id],
        id
      })),
      burnSummary: matchingBurnSummary(original, ids)
    };
  }

  function handleReview() {
    if (!canReview) return;
    setOfferUpdateNotice('');
    const frozenTerms = structuredClone(terms);
    for (const bundle of [frozenTerms.give, frozenTerms.receive]) {
      bundle.groups = bundle.groupIds.map((id) => ({ ...groupObjs[id], id }));
    }
    setReview({ terms: frozenTerms, mode, coinExplanation });
  }

  function handleChoose(
    side: 'offer' | 'want',
    kind: 'card' | 'group' | 'app'
  ) {
    if (kind === 'card') setAICardModalType(side);
    if (kind === 'group') setGroupModalType(side);
    if (kind === 'app') setBuildModalType(side);
  }

  function handleRemove(
    side: 'offer' | 'want',
    kind: 'card' | 'group' | 'app',
    id: number
  ) {
    if (kind === 'card')
      setSelectedCardIdsObj((current) => ({
        ...current,
        [side]: current[side].filter((cardId) => cardId !== id)
      }));
    if (kind === 'group')
      setSelectedGroupIdsObj((current) => ({
        ...current,
        [side]: current[side].filter((groupId) => groupId !== id)
      }));
    if (kind === 'app')
      setSelectedBuilds((current) => ({
        ...current,
        [side]: current[side].filter((build) => build.id !== id)
      }));
  }

  function handleCounterPropose() {
    setOfferUpdateNotice('');
    const { give, receive } = getViewerTradeTerms(pendingTransaction, myId);
    setCoinInputs({
      offer: give.coins ? String(give.coins) : '',
      want: receive.coins ? String(receive.coins) : ''
    });
    setSelectedCardIdsObj({ offer: give.cardIds, want: receive.cardIds });
    setSelectedGroupIdsObj({ offer: give.groupIds, want: receive.groupIds });
    setSelectedBuilds({ offer: give.builds, want: receive.builds });
    // the counteroffer belongs to the day it is made (its battery too)
    setBatteryUnits({ offer: give.battery || 0, want: receive.battery || 0 });
    setPendingTransaction(null);
    setReview(null);
    setCounterTerms({ give, receive });
    setSelectedOption('want');
  }

  async function handleConfirm(snapshot: TradeReview) {
    const { give, receive } = snapshot.terms;
    const type =
      snapshot.mode === 'send'
        ? 'send'
        : snapshot.mode === 'show'
          ? 'offer'
          : 'want';
    const requestPayload = {
      type,
      offered: {
        coins: give.coins,
        ...(give.battery ? { battery: give.battery } : {}),
        cardIds: give.cardIds,
        groupIds: give.groupIds,
        buildIds: give.builds.map((app) => app.id)
      },
      wanted: {
        coins: receive.coins,
        ...(receive.battery ? { battery: receive.battery } : {}),
        cardIds: receive.cardIds,
        groupIds: receive.groupIds,
        buildIds: receive.builds.map((app) => app.id)
      },
      targetId: partner.id
    };
    const clientRequestId = await getTransactionClientRequestId({
      userId: myId,
      requestPayload
    });
    const result = await postTradeRequest({
      ...requestPayload,
      clientRequestId
    });
    await clearPendingTransactionRequest({
      userId: myId,
      requestPayload,
      clientRequestId
    });
    void applyCanonicalCoinsAndReconcile({
      coins: result.coins,
      loadCoins,
      onSetUserState,
      userId: myId
    });
    if (type === 'send')
      notifyBuildOwnershipChanged(give.builds.map((app) => app.id));
    const { isNewChannel, newChannelId, pathId } = result;
    if (isNewChannel) socket.emit('join_chat_group', newChannelId);
    if (isNewChannel || initialBuild) navigate(`/chat/${pathId}`);
    onHide();
  }

  function handleCardSelection(cardIds: number[]) {
    if (aiCardModalType)
      setSelectedCardIdsObj((current) => ({
        ...current,
        [aiCardModalType]: cardIds
      }));
    setAICardModalType(null);
  }

  function handleGroupSelection(groupIds: number[]) {
    if (groupModalType)
      setSelectedGroupIdsObj((current) => ({
        ...current,
        [groupModalType]: groupIds
      }));
    setGroupModalType(null);
  }

  function handlePendingOfferChanged(transaction: any) {
    setOfferUpdateNotice(
      'This offer changed or was withdrawn. Review the current offer before accepting.'
    );
    setPendingTransaction(transaction);
  }
}
