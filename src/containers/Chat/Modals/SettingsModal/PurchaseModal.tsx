import React, { useEffect, useRef, useState } from 'react';
import ModalFooter from '~/components/Modal/Footer';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import useChatDialogRequest from '../useChatDialogRequest';
import { chatFormClass, chatFormModalClass } from '../chatFormStyles';

export interface ChatPurchaseReceipt {
  coins: number;
  topic?: { id: number; [key: string]: any };
  unlockedThemes?: string[];
}

export default function PurchaseModal({
  scope, title, description, price, balance, onPurchase, validateReceipt, onApply, onHide
}: {
  scope: string;
  title: string;
  description: React.ReactNode;
  price: number;
  balance: number;
  onPurchase: () => Promise<ChatPurchaseReceipt>;
  validateReceipt: (receipt: ChatPurchaseReceipt) => boolean;
  onApply: (receipt: ChatPurchaseReceipt) => void | Promise<void>;
  onHide: () => void;
}) {
  const request = useChatDialogRequest(scope);
  const receiptRef = useRef<ChatPurchaseReceipt | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    receiptRef.current = null;
    setConfirmed(false);
  }, [scope]);
  const insufficientFunds = !confirmed && balance < price;

  function close() {
    if (!request.pending.current) onHide();
  }

  async function purchase() {
    if (insufficientFunds) return;
    await request.run('Couldn’t confirm this purchase. Please try again.', async isCurrent => {
      if (!receiptRef.current) {
        const receipt = await onPurchase();
        if (!isCurrent()) return;
        if (!receipt || !Number.isSafeInteger(receipt.coins) || receipt.coins < 0 || !validateReceipt(receipt)) {
          throw new Error('Invalid channel purchase receipt');
        }
        receiptRef.current = receipt;
        setConfirmed(true);
      }
      if (!isCurrent()) return;
      // Retain an acknowledged receipt if local hydration fails. Retrying that
      // step must not submit another purchase or invent a new coin balance.
      await onApply(receiptRef.current);
      if (isCurrent()) onHide();
    });
  }

  return <Modal modalKey="ChatPurchaseModal" isOpen modalLevel={2}
    aria-label={title} onClose={close} size="sm" hasHeader={false}
    bodyPadding={0} className={chatFormModalClass}
    closeOnBackdropClick={false} closeOnEscape={!request.busy} showCloseButton={!request.busy}>
    <section className={chatFormClass}>
      <header><h2>{title}</h2><p className="description">{description}</p></header>
      <main>
        <div className="setting">
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}><Icon icon="coins" /> {price.toLocaleString()} Twinkle Coins</p>
          <p className="field-hint">{confirmed ? 'Purchase confirmed.' : `Your balance: ${balance.toLocaleString()} coins`}</p>
        </div>
        {insufficientFunds && <p role="status" className="field-hint">You need {(price - balance).toLocaleString()} more coins.</p>}
        {request.error && <p ref={request.errorRef} id={request.errorId} role="alert" className="error">
          {confirmed ? 'Your purchase was confirmed, but this view couldn’t update. Retry updating without purchasing again.' : request.error}
        </p>}
      </main>
      <ModalFooter>
        <Button variant="ghost"
          disabled={request.busy} onClick={close}>{confirmed ? 'Close' : 'Cancel'}</Button>
        <Button color="logoBlue"
          disabled={insufficientFunds} aria-busy={request.busy}
          aria-describedby={request.error ? request.errorId : undefined} onClick={purchase}>
          {request.busy ? confirmed ? 'Updating…' : 'Purchasing…' : confirmed ? 'Retry updating' : `Buy for ${price.toLocaleString()} coins`}
        </Button>
      </ModalFooter>
    </section>
  </Modal>;
}
