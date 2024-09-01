import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Details from './Details';
import { useKeyContext } from '~/contexts';
import { User } from '~/types';

const cancelLabel = localize('cancel');
const confirmLabel = localize('confirm');

export default function ConfirmTransactionModal({
  isAICardModalShown,
  onHide,
  onConfirm,
  selectedOption,
  coinAmountObj,
  onSetAICardModalCardId,
  offeredCardIds,
  wantedCardIds,
  offeredGroupIds,
  wantedGroupIds,
  partner,
  groupObjs
}: {
  isAICardModalShown: boolean;
  onHide: () => void;
  onConfirm: (v: any) => void;
  selectedOption: string;
  coinAmountObj: any;
  onSetAICardModalCardId: (v: number) => void;
  offeredCardIds: number[];
  wantedCardIds: number[];
  offeredGroupIds: number[];
  wantedGroupIds: number[];
  partner: User;
  groupObjs: Record<number, any>;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  const [submitting, setSubmitting] = useState(false);
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
    selectedOption
  ]);

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>{title}</header>
      <main>
        <Details
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
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button loading={submitting} color={doneColor} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );

  function handleConfirm() {
    setSubmitting(true);
    onConfirm({
      coinsWanted: effectiveCoinWanted,
      coinsOffered: effectiveCoinOffered,
      offeredCardIds,
      wantedCardIds,
      offeredGroupIds,
      wantedGroupIds
    });
  }
}
