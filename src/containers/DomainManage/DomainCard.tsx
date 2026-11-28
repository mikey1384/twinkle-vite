import React, { useState } from 'react';
import { css } from '@emotion/css';
import { DomainText, PrimaryButton, SecondaryButton, T, textButtonClass } from '~/components/Build/AppAddress/checkout/ui';
import { renewalDateLabel, renewalPrice } from '~/components/Build/AppAddress/renewalDates';
import type { ManageLang, ManageText } from './text';

export interface ManagedDomain {
  orderId: number;
  domain: string;
  appTitle: string | null;
  childUsername: string | null;
  freeAddress: string | null;
  renewal: {
    autoRenew: boolean;
    status: 'active' | 'off' | 'canceled_price_rise' | 'past_due';
    nextChargeDate: string | null;
    expiresDate: string | null;
    price: number;
    currency: string;
    cardLast4: string | null;
  } | null;
  canUpdateCard: boolean;
}

// One bought domain: what happens next, in one sentence, and the one or two
// things the payer can do about it. Turning auto-renew off asks once, in
// place (no modal), and says nothing changes until the paid year ends.
export default function DomainCard({
  t,
  lang,
  item,
  saving,
  opening,
  busy,
  onAutoRenew,
  onBilling
}: {
  t: ManageText;
  lang: ManageLang;
  item: ManagedDomain;
  saving: boolean;
  opening: boolean;
  // another card is saving or opening Stripe: one action at a time
  busy: boolean;
  onAutoRenew: (autoRenew: boolean) => void;
  onBilling: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const renewal = item.renewal;
  const until = renewalDateLabel(renewal?.expiresDate || null, lang);
  const next = renewalDateLabel(renewal?.nextChargeDate || null, lang) || until;
  const owner = item.appTitle
    ? item.childUsername
      ? t.forChild(item.childUsername, item.appTitle)
      : t.forApp(item.appTitle)
    : null;
  const tone = !renewal
    ? 'ended'
    : renewal.status === 'past_due'
      ? 'warn'
      : renewal.status === 'active' && renewal.autoRenew
        ? 'on'
        : 'off';
  let title = '';
  let line = '';
  if (!renewal) {
    line = t.ended(until);
  } else if (renewal.status === 'past_due') {
    title = t.cardTitle;
    line = t.cardLine(until);
  } else if (renewal.status === 'canceled_price_rise') {
    title = t.priceTitle;
    line = t.priceLine(until);
  } else if (renewal.status === 'active' && renewal.autoRenew) {
    title = t.on;
    line = t.onLine(next, renewalPrice(renewal.price, renewal.currency), renewal.cardLast4);
  } else {
    title = t.off;
    line = t.offLine(until, item.freeAddress);
  }
  const canTurnOff = Boolean(renewal && renewal.autoRenew && (renewal.status === 'active' || renewal.status === 'past_due'));
  const canTurnOn = Boolean(renewal && renewal.status === 'off');
  return (
    <article className={cardClass} data-tone={tone}>
      <header className={headClass}>
        <h2>
          <DomainText domain={item.domain} />
        </h2>
        {owner ? <p>{owner}</p> : null}
      </header>
      <div className={statusClass} data-tone={tone}>
        <span className={dotClass} aria-hidden="true" />
        <div>
          {title ? <strong>{title}</strong> : null}
          <p>{line}</p>
        </div>
      </div>
      {confirming ? (
        <div className={confirmClass} role="group" aria-label={t.turnOff}>
          <p>{t.confirmOff(until)}</p>
          <div className={rowClass}>
            <SecondaryButton onClick={() => setConfirming(false)} disabled={saving}>
              {t.keepOn}
            </SecondaryButton>
            <PrimaryButton
              busy={saving}
              disabled={busy && !saving}
              onClick={() => {
                onAutoRenew(false);
                setConfirming(false);
              }}
            >
              {saving ? t.saving : t.confirmOffYes}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className={rowClass} data-warn={tone === 'warn' || undefined}>
          {canTurnOff && (
            <button type="button" className={textButtonClass} disabled={busy} onClick={() => setConfirming(true)}>
              {saving ? t.saving : t.turnOff}
            </button>
          )}
          {canTurnOn && (
            <PrimaryButton busy={saving} disabled={busy && !saving} onClick={() => onAutoRenew(true)}>
              {saving ? t.saving : t.turnOn}
            </PrimaryButton>
          )}
          {item.canUpdateCard &&
            (tone === 'warn' ? (
              // a declined card: changing it is the one thing to do
              <PrimaryButton busy={opening} disabled={busy && !opening} onClick={onBilling}>
                {opening ? t.opening : t.updateCard}
              </PrimaryButton>
            ) : (
              <button type="button" className={textButtonClass} disabled={busy} aria-busy={opening || undefined} onClick={onBilling}>
                {opening ? t.opening : t.updateCard}
              </button>
            ))}
        </div>
      )}
    </article>
  );
}

const cardClass = css`
  background: #fff;
  border: 1px solid ${T.line};
  border-radius: 20px;
  padding: 22px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 1px 2px rgba(20, 20, 43, 0.04);
  &[data-tone='ended'] {
    background: #fafafc;
  }
  @media (max-width: 480px) {
    padding: 18px 16px 14px;
    border-radius: 16px;
  }
`;
const headClass = css`
  h2 {
    margin: 0;
    font-size: 21px;
    font-weight: 800;
    color: ${T.ink};
    overflow-wrap: anywhere;
    letter-spacing: -0.01em;
  }
  p {
    margin: 4px 0 0;
    color: ${T.muted};
    font-size: 14px;
  }
`;
const statusClass = css`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f5f6fa;
  strong {
    display: block;
    font-size: 15px;
    color: ${T.ink};
    margin-bottom: 2px;
  }
  p {
    margin: 0;
    font-size: 14.5px;
    line-height: 1.55;
    color: ${T.body};
  }
  &[data-tone='on'] {
    background: ${T.greenTint};
  }
  &[data-tone='warn'] {
    background: ${T.warmTint};
  }
`;
const dotClass = css`
  flex: none;
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 50%;
  background: #9aa0b4;
  [data-tone='on'] > & {
    background: ${T.green};
  }
  [data-tone='warn'] > & {
    background: #d97706;
  }
`;
const rowClass = css`
  display: flex;
  &[data-warn] > button:last-child {
    order: -1;
  }
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
`;
const confirmClass = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
  p {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: ${T.ink};
  }
`;
