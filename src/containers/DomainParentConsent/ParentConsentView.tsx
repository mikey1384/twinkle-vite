import React, { useState } from 'react';
import { css } from '@emotion/css';
import { PARENT_TEXT } from '~/components/Build/AppAddress/text';
import { CountrySelect, panelClass, usd, krw } from '~/components/Build/AppAddress/views';

export interface ParentOrderView {
  domain: string;
  appTitle: string;
  childUsername: string;
  priceCents: number;
  breakdown: { registryCents: number; cardFeeCents: number; twinkleCents: number };
  approxKrw: number | null;
  status: string;
}

export interface RegistrantInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const EMPTY: RegistrantInput = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  city: '',
  state: '',
  zip: '',
  country: 'KR'
};

// 'both' when the parent's language is unknown: Korean first, English under it.
export type ParentLangMode = 'ko' | 'en' | 'both';

function breakdownText(lang: 'ko' | 'en', order: ParentOrderView) {
  const parts = {
    registry: usd(order.breakdown.registryCents),
    card: usd(order.breakdown.cardFeeCents),
    twinkle: usd(order.breakdown.twinkleCents),
    total: usd(order.priceCents)
  };
  return lang === 'ko'
    ? `도메인 등록 비용 ${parts.registry} · 카드 결제 수수료 ${parts.card} · 트윈클(환불·지원 대비) ${parts.twinkle} = 1년 ${parts.total}`
    : `Domain registry fee ${parts.registry} · Card payment fee ${parts.card} · Twinkle (refunds and support) ${parts.twinkle} = ${parts.total}/year`;
}

export default function ParentConsentView({
  order,
  mode,
  onMode,
  submitting,
  onApprove,
  onDecline,
  initialRegistrant
}: {
  order: ParentOrderView;
  mode: ParentLangMode;
  onMode: (mode: ParentLangMode) => void;
  submitting: '' | 'approve' | 'decline';
  onApprove: (registrant: RegistrantInput) => void;
  onDecline: () => void;
  initialRegistrant?: Partial<RegistrantInput>;
}) {
  const [registrant, setRegistrant] = useState<RegistrantInput>({ ...EMPTY, ...initialRegistrant });
  const [adult, setAdult] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const langs: Array<'ko' | 'en'> = mode === 'both' ? ['ko', 'en'] : [mode];
  const main = PARENT_TEXT[langs[0]];
  const both = (pick: (t: (typeof PARENT_TEXT)['en']) => string) => (
    <>
      {langs.map((lang, index) => (
        <span key={lang} lang={lang} style={index ? { display: 'block', color: '#5d5d6e', fontSize: '0.95rem', marginTop: '0.2rem' } : undefined}>
          {pick(PARENT_TEXT[lang])}
        </span>
      ))}
    </>
  );
  const input = css`
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(22, 22, 31, 0.12);
    border-radius: 0.8rem;
    padding: 0.7rem 0.8rem;
    font: inherit;
    font-size: 1.05rem;
    background: #fafafd;
  `;
  const set = (key: keyof RegistrantInput) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setRegistrant((prev) => ({ ...prev, [key]: event.target.value }));
  const complete =
    adult &&
    registrant.firstName &&
    registrant.lastName &&
    registrant.email.includes('@') &&
    /^\+[1-9][\d\s.\-()]{7,20}$/.test(registrant.phone.trim()) &&
    registrant.address1 &&
    registrant.city &&
    registrant.state &&
    registrant.zip &&
    /^[A-Za-z]{2}$/.test(registrant.country);
  const section = css`
    margin: 1.1rem 0 0;
    h3 {
      margin: 0 0 0.35rem;
      font-size: 1.15rem;
    }
  `;
  return (
    <div className={panelClass} style={{ maxWidth: '38rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
        <span style={{ color: '#4b3cf0', fontWeight: 700, fontSize: '0.95rem' }}>{main.kicker}</span>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {(['ko', 'en'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => onMode(value)}
              style={{
                border: '1px solid rgba(22,22,31,0.15)',
                borderRadius: 999,
                padding: '0.3rem 0.7rem',
                background: mode === value ? '#16161f' : '#fff',
                color: mode === value ? '#fff' : '#16161f',
                font: 'inherit',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              {value === 'ko' ? '한국어' : 'English'}
            </button>
          ))}
        </div>
      </div>
      <h2>{both((t) => t.title(order.childUsername))}</h2>
      <p>{both((t) => t.intro(order.appTitle, order.domain))}</p>
      <div className={section}>
        <h3>{both((t) => t.whatTitle)}</h3>
        <p>{both((t) => t.whatBody)}</p>
      </div>
      <div className={section}>
        <h3>{both((t) => t.priceTitle)}</h3>
        <p style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.2rem' }}>
          {both((t) => t.priceLine(usd(order.priceCents), order.approxKrw ? krw(order.approxKrw) : null))}
        </p>
        <p style={{ color: '#5d5d6e', fontSize: '0.95rem' }}>{both((t) => t.krwNote)}</p>
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          aria-expanded={showBreakdown}
          style={{ border: 0, background: 'none', padding: 0, color: '#4b3cf0', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
        >
          {main.whatsInPrice} {showBreakdown ? '▴' : '▾'}
        </button>
        {showBreakdown && (
          <p style={{ color: '#5d5d6e', fontSize: '1rem', marginTop: '0.3rem' }}>
            {langs.map((lang) => (
              <span key={lang} lang={lang} style={{ display: 'block' }}>
                {breakdownText(lang, order)}
              </span>
            ))}
          </p>
        )}
      </div>
      <div style={{ margin: '1rem 0', padding: '0.9rem 1rem', borderRadius: '1rem', background: '#f4f3ff' }}>
        {both((t) => t.honest)}
      </div>
      <p>{both((t) => t.renewal)}</p>
      <p>{both((t) => t.ownership)}</p>
      <p>{both((t) => t.refund)}</p>
      <div className={section}>
        <h3>{both((t) => t.detailsTitle)}</h3>
        <p style={{ color: '#5d5d6e', fontSize: '1rem' }}>{both((t) => t.detailsNote)}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '0.6rem' }}>
          <input className={input} placeholder={main.lastName} value={registrant.lastName} onChange={set('lastName')} aria-label={main.lastName} />
          <input className={input} placeholder={main.firstName} value={registrant.firstName} onChange={set('firstName')} aria-label={main.firstName} />
          <input className={input} placeholder={main.email} value={registrant.email} onChange={set('email')} aria-label={main.email} type="email" />
          <input className={input} placeholder={main.phone} value={registrant.phone} onChange={set('phone')} aria-label={main.phone} />
          <input className={input} placeholder={main.address} value={registrant.address1} onChange={set('address1')} aria-label={main.address} style={{ gridColumn: '1 / -1' }} />
          <input className={input} placeholder={main.city} value={registrant.city} onChange={set('city')} aria-label={main.city} />
          <input className={input} placeholder={main.state} value={registrant.state} onChange={set('state')} aria-label={main.state} />
          <input className={input} placeholder={main.zip} value={registrant.zip} onChange={set('zip')} aria-label={main.zip} />
          <CountrySelect className={input} label={main.country} value={registrant.country} onChange={(country) => setRegistrant((prev) => ({ ...prev, country }))} />
        </div>
      </div>
      <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', margin: '1.1rem 0 0.4rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.2rem' }} />
        <span>{both((t) => t.confirmAdult)}</span>
      </label>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button
          type="button"
          disabled={!complete || Boolean(submitting)}
          onClick={() => onApprove(registrant)}
          style={{ border: 0, borderRadius: 999, padding: '0.9rem 1.4rem', background: '#16161f', color: '#fff', font: 'inherit', fontWeight: 700, opacity: !complete || submitting ? 0.5 : 1, cursor: complete ? 'pointer' : 'default' }}
        >
          {main.approve}
        </button>
        <button
          type="button"
          disabled={Boolean(submitting)}
          onClick={onDecline}
          style={{ border: 0, borderRadius: 999, padding: '0.9rem 1.4rem', background: '#f0f0f6', color: '#16161f', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}
        >
          {main.decline}
        </button>
      </div>
      <p style={{ color: '#5d5d6e', fontSize: '0.95rem', marginTop: '0.9rem' }}>{both((t) => t.noPressure)}</p>
    </div>
  );
}
