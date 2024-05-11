import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Details from './Details';
import { useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');
const confirmLabel = localize('confirm');

export default function ConfirmSelectionModal({
  isAICardModalShown,
  onHide,
  onConfirm,
  selectedOption,
  coinAmountObj,
  onSetAICardModalCardId,
  offeredCardIds,
  wantedCardIds,
  partner
}: {
  isAICardModalShown: boolean;
  onHide: () => void;
  onConfirm: (v: any) => void;
  selectedOption: string;
  coinAmountObj: any;
  onSetAICardModalCardId: (v: number) => void;
  offeredCardIds: number[];
  wantedCardIds: number[];
  partner: any;
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
    if (selectedOption === 'want') {
      if (!effectiveCoinOffered && !offeredCardIds.length)
        return 'Express Interest';
      if (!effectiveCoinWanted && !wantedCardIds.length)
        return `Show${
          effectiveCoinOffered === 0
            ? ''
            : ` ${effectiveCoinOffered} coin${
                effectiveCoinOffered === 1 ? '' : 's'
              } ${offeredCardIds.length === 0 ? '' : 'and'}`
        }${
          offeredCardIds.length === 0
            ? ''
            : ` ${offeredCardIds.length} card${
                offeredCardIds.length === 1 ? '' : 's'
              }`
        }`;
      return 'Propose Trade';
    }
    return `${selectedOption === 'offer' ? 'Show' : 'Send'}${
      effectiveCoinOffered === 0
        ? ''
        : ` ${effectiveCoinOffered} coin${
            effectiveCoinOffered === 1 ? '' : 's'
          } ${offeredCardIds.length === 0 ? '' : 'and'}`
    }${
      offeredCardIds.length === 0
        ? ''
        : ` ${offeredCardIds.length} card${
            offeredCardIds.length === 1 ? '' : 's'
          }`
    }`;
  }, [
    effectiveCoinOffered,
    effectiveCoinWanted,
    offeredCardIds.length,
    selectedOption,
    wantedCardIds.length
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
          isAICardModalShown={isAICardModalShown}
          selectedOption={selectedOption}
          partner={partner}
          onSetAICardModalCardId={onSetAICardModalCardId}
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
      wantedCardIds
    });
  }
}
