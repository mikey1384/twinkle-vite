import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { AppOwnershipNotice } from '~/components/Build/TradeBuilds';
import Exchange from './Exchange';
import { summarizeBundle } from './helpers/terms';
import { errorClass, noticeClass } from './styles';
import type { TradeReview } from './types';

export default function ReviewModal({
  review,
  partnerName,
  groupObjs,
  onInspectCard,
  isAICardModalShown,
  onHide,
  onConfirm
}: {
  review: TradeReview;
  partnerName: string;
  groupObjs: Record<number, any>;
  onInspectCard: (id: number) => void;
  isAICardModalShown: boolean;
  onHide: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { terms, mode } = review;
  const action =
    mode === 'accept'
      ? 'Accept trade'
      : mode === 'send'
        ? `Give gift to ${partnerName}`
        : mode === 'show'
          ? 'Share showcase'
          : mode === 'request'
            ? 'Send request'
            : 'Send trade offer';
  const explanation =
    mode === 'accept'
      ? 'These items move together when you accept.'
      : mode === 'send'
        ? `Your gift goes to ${partnerName} immediately. Nothing in return.`
        : mode === 'show'
          ? 'You keep everything. This only shows what you have.'
          : mode === 'request'
            ? `${partnerName} can respond with an offer. Nothing moves yet.`
            : `${partnerName} can accept this exact offer. You can withdraw it before they accept.`;

  return (
    <Modal
      modalKey="TradeReview"
      isOpen
      size="lg"
      title={
        mode === 'accept'
          ? 'Review & accept trade'
          : mode === 'send'
            ? 'Review your gift'
            : mode === 'show'
              ? 'Review showcase'
              : 'Review your offer'
      }
      modalLevel={2}
      closeOnBackdropClick={false}
      onClose={submitting || isAICardModalShown ? () => {} : onHide}
      footer={
        <div style={{ width: '100%' }}>
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
            <span>
              <b>{mode === 'show' ? 'You show' : 'You give'}:</b>{' '}
              {summarizeBundle(terms.give)}
            </span>
            {mode !== 'show' && (
              <span>
                <b>You receive:</b> {summarizeBundle(terms.receive)}
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}
          >
            <Button
              variant="ghost"
              disabled={submitting || isAICardModalShown}
              onClick={onHide}
            >
              Back to {mode === 'accept' ? 'offer' : 'edit'}
            </Button>
            <Button
              color={mode === 'send' ? 'orange' : 'logoBlue'}
              loading={submitting}
              disabled={isAICardModalShown}
              onClick={handleConfirm}
            >
              {action}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ width: '100%', minWidth: 0 }}>
        <p
          className={noticeClass}
          data-warning={mode === 'send'}
          style={{ marginTop: 0 }}
        >
          {explanation}
        </p>
        <Exchange
          terms={terms}
          partnerName={partnerName}
          groupObjs={groupObjs}
          onInspectCard={onInspectCard}
          showcase={mode === 'show'}
          gift={mode === 'send'}
        />
        {review.coinExplanation && (
          <p className={noticeClass}>{review.coinExplanation}</p>
        )}
        {mode !== 'show' &&
          (terms.give.builds.length > 0 || terms.receive.builds.length > 0) && (
            <AppOwnershipNotice />
          )}
        {error && (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  );

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await onConfirm();
    } catch (error: any) {
      setError(
        error?.response?.data?.error ||
          error?.message ||
          'This could not be completed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }
}
