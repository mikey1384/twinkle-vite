import React, { useState } from 'react';
import { css } from '@emotion/css';
import { PARENT_TEXT } from '~/components/Build/AppAddress/text';
import { usd, krw } from '~/components/Build/AppAddress/checkout/model';
import { firstRenewalLabel } from '~/components/Build/AppAddress/renewalDates';
import { draftFromPhone, toE164, type PhoneDraft } from '~/components/Build/AppAddress/checkout/phone';
import { STATE_OPTIONAL, countryInStateField, isAutofillChange, guessCountry, isKnownCountry, stateOrCity } from '~/components/Build/AppAddress/checkout/countries';
import {
  T,
  CheckIcon,
  CheckoutLayout,
  CountryField,
  FieldGrid,
  MobileSummary,
  Notice,
  PhoneField,
  PrimaryButton,
  Reveal,
  SecondaryButton,
  ShieldIcon,
  StarMark,
  StepActions,
  StepTitle,
  SummaryCard,
  TextField,
  focusFirstInvalid,
  textButtonClass
} from '~/components/Build/AppAddress/checkout/ui';
import Confetti from '~/containers/Build/Editor/ChatPanel/Roadmap/Confetti';
import trio720 from '~/containers/LumineAppSignIn/assets/trio-720.webp';
import trio1200 from '~/containers/LumineAppSignIn/assets/trio-1200.webp';

export interface ParentOrderView {
  domain: string;
  appTitle: string;
  childUsername: string;
  priceCents: number;
  breakdown: { registryCents: number; cardFeeCents: number; twinkleCents: number };
  approxKrw: number | null;
  status: string;
  // yearly auto-renew is on for new purchases
  renews?: boolean;
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
type ParentText = (typeof PARENT_TEXT)['en'];

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

// The 한국어 / English switch in the page's top bar.
export function ParentLangToggle({ mode, onMode }: { mode: ParentLangMode; onMode: (mode: ParentLangMode) => void }) {
  return (
    <div className={langToggleClass} role="group" aria-label="Language">
      {(['ko', 'en'] as const).map((value) => (
        <button key={value} type="button" aria-pressed={mode === value} onClick={() => onMode(value)}>
          {value === 'ko' ? '한국어' : 'English'}
        </button>
      ))}
    </div>
  );
}

type Page = 0 | 1 | 2 | 3 | 4;

// /domain/parent: the parent says yes (or no thanks) one small screen at a
// time: what their child asked for, their name, how to reach them, their
// address, then one check with every promise and the consent. The price and
// what it includes stay beside every step.
export default function ParentConsentView({
  order,
  mode,
  submitting,
  onApprove,
  onDecline,
  initialRegistrant,
  startPage = 0
}: {
  order: ParentOrderView;
  mode: ParentLangMode;
  submitting: '' | 'approve' | 'decline';
  onApprove: (registrant: RegistrantInput) => void;
  onDecline: () => void;
  initialRegistrant?: Partial<RegistrantInput>;
  startPage?: Page;
}) {
  // the country starts at the parent's own (time zone, then browser), not Korea
  const [registrant, setRegistrant] = useState<RegistrantInput>(() => ({ ...EMPTY, country: guessCountry(), ...initialRegistrant }));
  // the phone as typed; registrant.phone is the E.164 number made from it
  const [phoneDraft, setPhoneDraft] = useState<PhoneDraft>(() => draftFromPhone(registrant.phone, registrant.country));
  const [adult, setAdult] = useState(false);
  const [page, setPage] = useState<Page>(startPage);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const langs: Array<'ko' | 'en'> = mode === 'both' ? ['ko', 'en'] : [mode];
  const main: ParentText = PARENT_TEXT[langs[0]];
  const both = (pick: (t: ParentText) => string) => (
    <>
      {langs.map((lang, index) => (
        <span key={lang} lang={lang} className={index ? secondLangClass : undefined}>
          {pick(PARENT_TEXT[lang])}
        </span>
      ))}
    </>
  );
  const set = (key: keyof RegistrantInput) => (value: string) => setRegistrant((prev) => ({ ...prev, [key]: value }));
  // a country's name autofilled into State moves to Country (typing stays)
  const setState = (value: string, event?: Event) => {
    const country = countryInStateField(value, { autofilled: isAutofillChange(event) });
    if (country) setRegistrant((prev) => ({ ...prev, country, state: '' }));
    else set('state')(value);
  };
  const stateOptional = STATE_OPTIONAL.has(registrant.country.toUpperCase());
  const [detectedCountry] = useState(() => guessCountry());
  const required = (key: keyof RegistrantInput) => (registrant[key].trim() ? '' : main.fieldRequired);
  const pageErrors: Record<Page, Partial<Record<keyof RegistrantInput, string>>> = {
    0: {},
    1: { lastName: required('lastName'), firstName: required('firstName') },
    2: {
      email: !registrant.email.trim() ? main.fieldRequired : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrant.email.trim()) ? '' : main.emailInvalid,
      phone: toE164(phoneDraft) ? '' : main.phoneInvalid
    },
    3: {
      country: isKnownCountry(registrant.country) ? '' : main.fieldRequired,
      address1: required('address1'),
      city: required('city'),
      state: stateOptional ? '' : required('state'),
      zip: required('zip')
    },
    4: {}
  };
  const errors = checked[page] ? pageErrors[page] : {};
  const valid = (target: Page) => Object.values(pageErrors[target]).every((value) => !value);
  const complete = adult && valid(1) && valid(2) && valid(3);
  function next() {
    if (!valid(page)) {
      setChecked((prev) => ({ ...prev, [page]: true }));
      focusFirstInvalid();
      return;
    }
    setPage((page + 1) as Page);
  }
  const approx = (lang: 'ko' | 'en') => (order.approxKrw ? (lang === 'ko' ? `약 ${krw(order.approxKrw)}` : `about ${krw(order.approxKrw)}`) : null);
  const summary = (
    <SummaryCard
      heading={main.summaryHeading}
      domain={order.domain}
      price={usd(order.priceCents)}
      period={main.perYearShort}
      approx={approx(langs[0])}
      checks={[order.renews ? main.autoRenewShort : main.noAutoRenew, main.includedSetup, main.includedPrivacy, main.includedOwner, main.includedFree]}
      reveal={{
        label: main.whatsInPrice,
        body: langs.map((lang) => (
          <span key={lang} lang={lang} style={{ display: 'block', marginBottom: 4 }}>
            {breakdownText(lang, order)}
          </span>
        ))
      }}
      notes={[
        { icon: 'info', text: both((t) => t.krwNote) },
        { icon: 'shield', text: both((t) => t.refund) }
      ]}
    />
  );
  const mobileSummary = (
    <MobileSummary domain={order.domain} price={usd(order.priceCents)}>
      <ul className={mobileChecksClass}>
        {[order.renews ? main.autoRenewShort : main.noAutoRenew, main.includedSetup, main.includedPrivacy, main.includedOwner].map((line) => (
          <li key={line}>
            <CheckIcon size={14} />
            {line}
          </li>
        ))}
      </ul>
      <Reveal label={main.whatsInPrice}>{breakdownText(langs[0], order)}</Reveal>
    </MobileSummary>
  );
  const titles = [null, main.nameTitle, main.contactTitle, main.addressTitle, main.reviewTitle];
  return (
    <CheckoutLayout
      stepKey={`parent-${page}`}
      progress={{ labels: main.progressLabels, current: page, text: main.stepOf(page + 1, main.progressLabels.length) }}
      aside={summary}
      mobileSummary={mobileSummary}
      actions={
        <StepActions back={page > 0 && !submitting ? { label: main.back, onClick: () => setPage((page - 1) as Page) } : null}>
          {page === 0 && (
            <SecondaryButton disabled={Boolean(submitting)} onClick={onDecline}>
              {main.decline}
            </SecondaryButton>
          )}
          {page < 4 ? (
            <PrimaryButton type="submit" form="parent-step">
              {page === 0 ? main.start : main.next}
            </PrimaryButton>
          ) : (
            <PrimaryButton busy={submitting === 'approve'} disabled={!complete || Boolean(submitting)} onClick={() => onApprove({ ...registrant, state: stateOrCity(registrant.country, registrant.state, registrant.city) })}>
              {main.approve} · {usd(order.priceCents)}
            </PrimaryButton>
          )}
        </StepActions>
      }
    >
      <form
        id="parent-step"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (page < 4) next();
          else if (complete && !submitting) onApprove({ ...registrant, state: stateOrCity(registrant.country, registrant.state, registrant.city) });
        }}
      >
        {page === 0 && (
          <>
            <figure className={artClass} aria-hidden="true">
              <img src={trio720} srcSet={`${trio720} 720w, ${trio1200} 1200w`} sizes="(min-width: 900px) 600px, 100vw" alt="" decoding="async" />
            </figure>
            <div className={kickerClass}>{main.kicker}</div>
            <StepTitle lead={both((t) => t.intro(order.appTitle, order.domain))}>{both((t) => t.title(order.childUsername))}</StepTitle>
            <div className={explainClass}>
              <h2>{both((t) => t.whatTitle)}</h2>
              <p>{both((t) => t.whatBody)}</p>
            </div>
            <Notice>{both((t) => t.honest)}</Notice>
            <p className={quietClass}>{both((t) => t.noPressure)}</p>
          </>
        )}
        {page === 1 && (
          <>
            <StepTitle lead={both((t) => t.detailsNote)}>{titles[1]}</StepTitle>
            <FieldGrid>
              <TextField label={main.lastName} name="family-name" value={registrant.lastName} onChange={set('lastName')} autoComplete="family-name" error={errors.lastName} autoFocus />
              <TextField label={main.firstName} name="given-name" value={registrant.firstName} onChange={set('firstName')} autoComplete="given-name" error={errors.firstName} />
            </FieldGrid>
          </>
        )}
        {page === 2 && (
          <>
            <StepTitle lead={both((t) => t.detailsNote)}>{titles[2]}</StepTitle>
            <div className={stackClass}>
              <TextField label={main.email} name="email" type="email" inputMode="email" value={registrant.email} onChange={set('email')} autoComplete="email" error={errors.email} placeholder="name@example.com" autoFocus />
              <PhoneField
                label={main.phoneLabel}
                dialLabel={main.dialCode}
                draft={phoneDraft}
                onChange={(draft) => {
                  setPhoneDraft(draft);
                  setRegistrant((prev) => ({ ...prev, phone: toE164(draft) }));
                }}
                error={errors.phone}
                hint={main.phoneWhy}
              />
            </div>
          </>
        )}
        {page === 3 && (
          <>
            <StepTitle lead={both((t) => t.detailsNote)}>{titles[3]}</StepTitle>
            <FieldGrid>
              <div data-span="2">
                <CountryField
                  label={main.country}
                  value={registrant.country}
                  onChange={set('country')}
                  error={errors.country}
                  detected={detectedCountry}
                  searchPlaceholder={main.countrySearch}
                  noMatch={main.countryNoMatch}
                  closeLabel={main.close}
                />
              </div>
              <div data-span="2">
                <TextField label={main.address} name="address-line1" value={registrant.address1} onChange={set('address1')} autoComplete="address-line1" error={errors.address1} />
              </div>
              <TextField
                label={stateOptional ? main.stateOptional : main.state}
                name="address-level1"
                value={registrant.state}
                onChange={setState}
                autoComplete="address-level1"
                error={errors.state}
              />
              <TextField label={main.city} name="address-level2" value={registrant.city} onChange={set('city')} autoComplete="address-level2" error={errors.city} />
              <TextField label={main.zip} name="postal-code" value={registrant.zip} onChange={set('zip')} autoComplete="postal-code" error={errors.zip} />
            </FieldGrid>
          </>
        )}
        {page === 4 && (
          <>
            <StepTitle>{titles[4]}</StepTitle>
            <dl className={reviewListClass}>
              {[
                { label: main.reviewName, value: langs[0] === 'ko' ? `${registrant.lastName}${registrant.firstName}` : `${registrant.firstName} ${registrant.lastName}`, page: 1 as Page },
                { label: main.reviewContact, value: [registrant.email, registrant.phone].filter(Boolean).join('\n'), page: 2 as Page },
                {
                  label: main.reviewAddress,
                  value: [registrant.address1, [registrant.city, registrant.state, registrant.zip].filter(Boolean).join(', '), registrant.country].filter(Boolean).join('\n'),
                  page: 3 as Page
                }
              ].map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                  <button type="button" className={textButtonClass} disabled={Boolean(submitting)} onClick={() => setPage(row.page)}>
                    {main.edit}
                  </button>
                </div>
              ))}
            </dl>
            <ul className={promiseListClass}>
              {[
                (t: ParentText) => (order.renews ? t.renewalAuto(firstRenewalLabel(t === PARENT_TEXT.ko ? 'ko' : 'en'), usd(order.priceCents)) : t.renewal),
                (t: ParentText) => t.ownership,
                (t: ParentText) => t.refund
              ].map((pick, index) => (
                <li key={index}>
                  <CheckIcon size={15} />
                  <span>{both(pick)}</span>
                </li>
              ))}
            </ul>
            <label className={consentClass}>
              <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} />
              <span className={consentBoxClass} aria-hidden="true">
                <CheckIcon size={14} color="#fff" />
              </span>
              <span>{both((t) => t.confirmAdult)}</span>
            </label>
            <p className={payNoteClass}>
              <ShieldIcon size={14} />
              <span>{both((t) => t.krwNote)}</span>
            </p>
            <div className={declineRowClass}>
              <button type="button" className={textButtonClass} disabled={Boolean(submitting)} onClick={onDecline}>
                {main.decline}
              </button>
            </div>
          </>
        )}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </CheckoutLayout>
  );
}

// After the parent's answer (approved, declined, paid, live, refunded,
// expired): one calm card with what happens now.
export function ParentStateView({ title, body, celebrate = false }: { title: string; body: string; celebrate?: boolean }) {
  return (
    <CheckoutLayout stepKey={`state-${title}`}>
      <div className={stateClass}>
        {celebrate && <Confetti />}
        <span className={stateMarkClass} aria-hidden="true">
          {celebrate ? <CheckIcon size={26} color="#fff" /> : <StarMark size={24} />}
        </span>
        <StepTitle>{title}</StepTitle>
        <p>{body}</p>
      </div>
    </CheckoutLayout>
  );
}

const stateClass = css`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px 0 4px;
  p {
    margin: 0;
    max-width: 460px;
    color: ${T.body};
    font-size: 16px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
`;
const stateMarkClass = css`
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: ${T.violet};
  color: #fff;
  box-shadow: 0 10px 24px rgba(91, 75, 255, 0.3);
`;
const secondLangClass = css`
  display: block;
  margin-top: 4px;
  color: ${T.muted};
  font-size: 0.82em;
  font-weight: 500;
`;
const langToggleClass = css`
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(20, 20, 40, 0.08);
  button {
    min-height: 38px;
    padding: 0 14px;
    border: 0;
    border-radius: 999px;
    background: none;
    color: ${T.muted};
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  button[aria-pressed='true'] {
    background: ${T.ink};
    color: #fff;
  }
  button:focus-visible {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
  }
`;
const artClass = css`
  margin: -8px -12px 20px;
  height: 168px;
  border-radius: 20px;
  overflow: hidden;
  background: #241650;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 42%;
    display: block;
  }
  @media (max-width: 759px) {
    margin: -4px -4px 18px;
    height: 140px;
  }
`;
const kickerClass = css`
  margin-bottom: 6px;
  color: ${T.violet};
  font-size: 14px;
  font-weight: 750;
`;
const explainClass = css`
  margin: 4px 0 0;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f6f7fb;
  h2 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 750;
  }
  p {
    margin: 0;
    color: ${T.body};
    font-size: 15px;
    line-height: 1.55;
  }
`;
const quietClass = css`
  margin: 14px 0 0;
  color: ${T.muted};
  font-size: 14px;
`;
const stackClass = css`
  display: grid;
  gap: 18px;
`;
const reviewListClass = css`
  margin: 0;
  display: grid;
  border: 1.5px solid ${T.line};
  border-radius: 18px;
  > div {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr) auto;
    gap: 4px 12px;
    align-items: start;
    padding: 14px 16px;
  }
  > div + div {
    border-top: 1px solid ${T.line};
  }
  dt {
    font-size: 14px;
    font-weight: 700;
    color: ${T.muted};
    padding-top: 2px;
  }
  dd {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  button {
    min-height: 28px;
  }
  @media (pointer: coarse) {
    button {
      min-height: 44px;
      margin: -8px 0;
    }
  }
  @media (max-width: 420px) {
    > div {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    dd {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;
const promiseListClass = css`
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: grid;
  gap: 12px;
  font-size: 15px;
  line-height: 1.55;
  color: ${T.body};
  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  svg {
    flex: none;
    margin-top: 4px;
  }
`;
const consentClass = css`
  position: relative;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 18px 0 0;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f6f7fb;
  font-size: 15.5px;
  font-weight: 600;
  line-height: 1.5;
  cursor: pointer;
  input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  input:focus-visible + span {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
  }
  input:checked + span {
    background: ${T.blue};
    border-color: ${T.blue};
  }
  input:checked + span svg {
    opacity: 1;
    transform: scale(1);
  }
`;
const consentBoxClass = css`
  flex: none;
  width: 24px;
  height: 24px;
  margin-top: 1px;
  border-radius: 8px;
  border: 2px solid #b9bfd0;
  background: #fff;
  display: grid;
  place-items: center;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
  svg {
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity 0.15s ease,
      transform 0.2s ${T.ease};
  }
  @media (prefers-reduced-motion: reduce) {
    svg {
      transform: none;
      transition: opacity 0.15s ease;
    }
  }
`;
const payNoteClass = css`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 14px 0 0;
  color: ${T.muted};
  font-size: 14px;
  line-height: 1.5;
  svg {
    margin-top: 3px;
  }
`;
const declineRowClass = css`
  margin-top: 8px;
  button {
    color: ${T.muted};
    font-weight: 650;
  }
`;
const mobileChecksClass = css`
  list-style: none;
  margin: 0;
  padding: 12px 0 0;
  border-top: 1px solid ${T.line};
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: ${T.body};
  li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  svg {
    flex: none;
    margin-top: 3px;
  }
`;
