import type { TradeBuild } from '~/components/Build/TradeBuilds';
import React, { useMemo, useState } from 'react';
import ModalFooter from '~/components/Modal/Footer';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Details from './Details';
import { useKeyContext } from '~/contexts';
import { User } from '~/types';

const cancelLabel = 'Cancel';
const confirmLabel = 'Confirm';

export default function ConfirmTransactionModal({
  isAICardModalShown,
  onHide,
  onConfirm,
  selectedOption,
  coinAmountObj,
  onSetAICardModalCardId,
  offeredBuilds,
  wantedBuilds,
  offeredCardIds,
  wantedCardIds,
  offeredGroupIds,
  wantedGroupIds,
  partner,
  groupObjs
}: {
  isAICardModalShown: boolean;
  onHide: () => void;
  onConfirm: (v: any) => Promise<void>;
  selectedOption: string;
  coinAmountObj: any;
  onSetAICardModalCardId: (v: number) => void;
  offeredBuilds: TradeBuild[];
  wantedBuilds: TradeBuild[];
  offeredCardIds: number[];
  wantedCardIds: number[];
  offeredGroupIds: number[];
  wantedGroupIds: number[];
  partner: User;
  groupObjs: Record<number, any>;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const coinOffered = coinAmountObj.offer;
  const coinWanted = coinAmountObj.want;
  const effectiveCoinOffered = useMemo(() => {
    if (selectedOption === 'want') {
      return Math.max(coinOffered - coinWanted, 0);
    }
    return coinOffered;
  }, [coinOffered, coinWanted, selectedOption]);

  const effectiveCoinWanted = useMemo(() => {
    if (selectedOption === 'want') {
      return Math.max(coinWanted - coinOffered, 0);
    }
    return coinWanted;
  }, [coinOffered, coinWanted, selectedOption]);

  const title = useMemo(() => {
    const offeredItems = [];
    const wantedItems = [];

    if (effectiveCoinOffered > 0) {
      offeredItems.push(
        `${effectiveCoinOffered} coin${effectiveCoinOffered === 1 ? '' : 's'}`
      );
    }
    if (offeredCardIds.length > 0) {
      offeredItems.push(
        `${offeredCardIds.length} card${offeredCardIds.length === 1 ? '' : 's'}`
      );
    }
    if (offeredGroupIds.length > 0) {
      offeredItems.push(
        `${offeredGroupIds.length} group${
          offeredGroupIds.length === 1 ? '' : 's'
        }`
      );
    }

    if (effectiveCoinWanted > 0) {
      wantedItems.push(
        `${effectiveCoinWanted} coin${effectiveCoinWanted === 1 ? '' : 's'}`
      );
    }
    if (wantedCardIds.length > 0) {
      wantedItems.push(
        `${wantedCardIds.length} card${wantedCardIds.length === 1 ? '' : 's'}`
      );
    }
    if (wantedGroupIds.length > 0) {
      wantedItems.push(
        `${wantedGroupIds.length} group${
          wantedGroupIds.length === 1 ? '' : 's'
        }`
      );
    }

    const joinItems = (items: string[]) => {
      if (items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length === 2) return items.join(' and ');
      return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
    };

    if (offeredBuilds.length)
      offeredItems.push(
        `${offeredBuilds.length} app${offeredBuilds.length === 1 ? '' : 's'}`
      );
    if (wantedBuilds.length)
      wantedItems.push(
        `${wantedBuilds.length} app${wantedBuilds.length === 1 ? '' : 's'}`
      );
    const offeredString = joinItems(offeredItems);
    const wantedString = joinItems(wantedItems);

    if (selectedOption === 'want') {
      if (!offeredString && !wantedString) return 'Express Interest';
      if (!wantedString) return `Show ${offeredString}`;
      return 'Propose Trade';
    }

    const action = selectedOption === 'offer' ? 'Show' : 'Send';
    return offeredString ? `${action} ${offeredString}` : action;
  }, [
    effectiveCoinOffered,
    effectiveCoinWanted,
    offeredCardIds?.length,
    wantedCardIds?.length,
    offeredGroupIds?.length,
    wantedGroupIds?.length,
    selectedOption,
    offeredBuilds.length,
    wantedBuilds.length
  ]);

  return (
    <Modal
      modalKey="ConfirmTransactionModal"
      isOpen
      onClose={onHide}
      closeOnBackdropClick={false}
      modalLevel={2}
      hasHeader={false}
      bodyPadding={0}
      allowOverflow
    >
      <LegacyModalLayout wrapped>
        <header>{title}</header>
        <main>
          <Details
            offeredBuilds={offeredBuilds}
            wantedBuilds={wantedBuilds}
            coinsOffered={effectiveCoinOffered}
            coinsWanted={effectiveCoinWanted}
            cardIdsOffered={offeredCardIds}
            cardIdsWanted={wantedCardIds}
            groupIdsOffered={offeredGroupIds}
            groupIdsWanted={wantedGroupIds}
            isAICardModalShown={isAICardModalShown}
            selectedOption={selectedOption}
            partner={partner}
            onSetAICardModalCardId={onSetAICardModalCardId}
            groupObjs={groupObjs}
          />
          {error && <p role="alert">{error}</p>}
        </main>
        <ModalFooter>
          <Button variant="ghost" disabled={submitting} onClick={onHide}>
            {cancelLabel}
          </Button>
          <Button
            loading={submitting}
            color={doneColor}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </LegacyModalLayout>
    </Modal>
  );

  async function handleConfirm() {
    setSubmitting(true);
    setError('');
    try {
      await onConfirm({
        coinsWanted: effectiveCoinWanted,
        coinsOffered: effectiveCoinOffered,
        offeredCardIds,
        wantedCardIds,
        offeredGroupIds,
        wantedGroupIds
      });
    } catch (error: any) {
      setError(
        error?.response?.data?.error ||
          error?.message ||
          'This transaction could not be completed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }
}
