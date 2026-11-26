import React, { useEffect, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import LumineAtWork from '~/containers/Build/PreviewPanel/LumineAtWork';
import Confetti from '~/containers/Build/Editor/ChatPanel/Roadmap/Confetti';
import type { AddressText } from '../text';
import { toE164, type PhoneDraft } from './phone';
import { isKnownCountry } from './countries';
import {
  usd,
  krw,
  ownerDetailsProblem,
  type DnsRecordView,
  type DomainIdeaView,
  type DomainOrderView,
  type OwnerDetails
} from './model';
import {
  T,
  CheckIcon,
  CHECKOUT_TITLE_ID,
  CheckoutLayout,
  Companion,
  focusFirstInvalid,
  CountrySelect,
  FieldGrid,
  MobileSummary,
  Notice,
  PhoneField,
  PrimaryButton,
  Reveal,
  SearchIcon,
  SecondaryButton,
  ShieldIcon,
  StarMark,
  StepActions,
  StepTitle,
  SummaryCard,
  TextButton,
  TextField,
  selectClass,
  textButtonClass,
  type CheckoutProgress
} from './ui';

// The own-web-address checkout, one friendly question per screen (Mikey
// 11-26). Each screen is a plain view (data in, callbacks out): AppAddress
// owns the requests and the answers, so Back keeps everything typed.

type Assistant = 'Zero' | 'Ciel' | null;

export interface StepBase {
  t: AddressText;
  // the member's Home agent, who says one helpful line per screen
  assistant?: Assistant;
  // the flow's last error (a request that failed), shown above the step
  error?: string;
}

function breakdownText(t: AddressText, idea: DomainIdeaView) {
  return (
    <>
      <span style={{ display: 'block' }}>
        {t.breakdown({
          registry: usd(idea.breakdown.registryCents),
          card: usd(idea.breakdown.cardFeeCents),
          twinkle: usd(idea.breakdown.twinkleCents),
          total: usd(idea.priceCents)
        })}
      </span>
      <span style={{ display: 'block', marginTop: 6 }}>{t.breakdownNote}</span>
    </>
  );
}

// The chosen name's one price and everything it includes, beside each step.
function OrderSummary({ t, idea, renews, honest = true }: { t: AddressText; idea: DomainIdeaView; renews?: boolean; honest?: boolean }) {
  return (
    <SummaryCard
      heading={t.summaryHeading}
      domain={idea.domain}
      price={usd(idea.priceCents)}
      period={t.perYearShort}
      approx={idea.approxKrw ? t.approxKrw(krw(idea.approxKrw)) : null}
      checks={[renews ? t.renewsLine(usd(idea.priceCents)) : t.noAutoRenew, t.includedSetup, t.includedPrivacy, t.includedSecure, t.includedFree]}
      reveal={{ label: t.whatsInPrice, body: breakdownText(t, idea) }}
      notes={honest ? [{ icon: 'info', text: t.cheaperShort }, { icon: 'shield', text: t.refundShort }] : []}
    />
  );
}

function OrderMobileSummary({ t, idea, renews }: { t: AddressText; idea: DomainIdeaView; renews?: boolean }) {
  return (
    <MobileSummary domain={idea.domain} price={usd(idea.priceCents)}>
      <ul className={mobileChecksClass}>
        {[renews ? t.renewsLine(usd(idea.priceCents)) : t.noAutoRenew, t.includedSetup, t.includedPrivacy, t.includedFree].map((line) => (
          <li key={line}>
            <CheckIcon size={14} />
            {line}
          </li>
        ))}
      </ul>
      <p className={mobileNoteClass}>{t.cheaperShort}</p>
      <Reveal label={t.whatsInPrice}>{breakdownText(t, idea)}</Reveal>
    </MobileSummary>
  );
}

// After Stripe: the order as the server recorded it (what was paid).
function ReceiptSummary({ t, domain, priceCents }: { t: AddressText; domain: string; priceCents: number }) {
  return (
    <SummaryCard
      heading={t.receiptTitle}
      domain={domain}
      price={usd(priceCents)}
      period={t.perYearShort}
      checks={[t.noAutoRenew, t.includedPrivacy, t.includedSecure, t.includedFree]}
      notes={[{ icon: 'shield', text: t.refundShort }]}
    />
  );
}

function ReceiptMobileSummary({ t, domain, priceCents }: { t: AddressText; domain: string; priceCents: number }) {
  return (
    <MobileSummary domain={domain} price={usd(priceCents)}>
      <ul className={mobileChecksClass}>
        {[t.noAutoRenew, t.includedPrivacy, t.includedFree].map((line) => (
          <li key={line}>
            <CheckIcon size={14} />
            {line}
          </li>
        ))}
      </ul>
      <p className={mobileNoteClass}>{t.refundShort}</p>
    </MobileSummary>
  );
}

// The member flow's progress (adult buyers: pick, owner, contact, address,
// check; under 18: pick, then a parent).
export function buyProgress(t: AddressText, index: number, forParent = false): CheckoutProgress {
  const labels = forParent ? [t.progressLabels[0], t.parentTitleShort] : t.progressLabels;
  return { labels, current: index, text: t.stepOf(Math.min(index + 1, labels.length), labels.length) };
}

// ---------------------------------------------------------------- intro

// A browser's address bar, the most familiar picture of "a web address".
function AddressBar({ host, tag, tone }: { host: string; tag: string; tone: 'free' | 'rent' }) {
  return (
    <div className={addressBarClass} data-tone={tone}>
      <span className={addressDotsClass} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className={addressFieldClass}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17 9V7A5 5 0 0 0 7 7v2H5v13h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Z" />
        </svg>
        <span className={addressHostClass}>{host}</span>
      </span>
      <span className={addressTagClass}>{tag}</span>
    </div>
  );
}

export function IntroView({
  t,
  assistant,
  error,
  freeHost,
  onFind,
  onHaveOne,
  onClose,
  ask,
  exampleDomain
}: StepBase & {
  freeHost: string;
  exampleDomain?: string;
  // absent while buying here is closed: connecting your own stays open
  onFind?: () => void;
  // absent while connecting your own is switched off
  onHaveOne?: () => void;
  onClose?: () => void;
  ask?: React.ReactNode;
}) {
  const example = exampleDomain || `${freeHost.split('.')[0].replace(/-/g, '')}.com`;
  return (
    <CheckoutLayout
      stepKey="intro"
      error={error}
      actions={
        <StepActions>
          {onHaveOne && (onFind ? <SecondaryButton onClick={onHaveOne}>{t.haveOne}</SecondaryButton> : <PrimaryButton onClick={onHaveOne}>{t.haveOne}</PrimaryButton>)}
          {onFind && <PrimaryButton onClick={onFind}>{t.findOne}</PrimaryButton>}
          {!onFind && !onHaveOne && onClose && <PrimaryButton onClick={onClose}>{t.backToApp}</PrimaryButton>}
        </StepActions>
      }
    >
      <Companion assistant={assistant ?? null}>{onFind || onHaveOne ? t.tipIntro : t.tipOops}</Companion>
      <StepTitle>{t.introTitle}</StepTitle>
      <div className={addressStackClass}>
        <AddressBar host={freeHost} tag={`${t.freeTag} ✓`} tone="free" />
        <AddressBar host={example} tag={t.rentTag} tone="rent" />
      </div>
      <p className={bodyTextClass}>
        <strong>{t.introFree(freeHost)}</strong>
      </p>
      <p className={bodyTextClass}>{t.introRent(example)}</p>
      <p className={bodyTextClass}>{onFind ? t.introChoice : onHaveOne ? t.introConnectOnly : t.notOpenYet}</p>
      {ask && <div className={askRowClass}>{ask}</div>}
    </CheckoutLayout>
  );
}

// ---------------------------------------------------------------- find

export function FindView({
  t,
  assistant,
  error,
  freeHost,
  query,
  ideas,
  loading,
  openBreakdownFor,
  onQuery,
  onSearch,
  onBuy,
  onUseOwn,
  onMoreIdeas,
  onBack,
  forParent = false,
  ask,
  showAdvanced = false
}: StepBase & {
  freeHost: string;
  query: string;
  ideas: DomainIdeaView[];
  loading: boolean;
  openBreakdownFor?: string;
  onQuery: (value: string) => void;
  onSearch: () => void;
  onBuy: (idea: DomainIdeaView) => void;
  onUseOwn?: () => void;
  onMoreIdeas: () => void;
  onBack?: () => void;
  // an under-18 member: the next step asks a parent
  forParent?: boolean;
  ask?: React.ReactNode;
  showAdvanced?: boolean;
}) {
  const [picked, setPicked] = useState('');
  const selected = ideas.find((idea) => idea.domain === picked) || ideas[0] || null;
  useEffect(() => {
    if (picked && !ideas.some((idea) => idea.domain === picked)) setPicked('');
  }, [ideas, picked]);
  return (
    <CheckoutLayout
      stepKey="find"
      error={error}
      progress={buyProgress(t, 0, forParent)}
      aside={
        selected ? (
          <OrderSummary t={t} idea={selected} />
        ) : (
          <SummaryCard heading={t.summaryToday} domain={freeHost} checks={[t.summaryFreeNow]} notes={[{ icon: 'info', text: t.cheaperShort }]} />
        )
      }
      mobileSummary={selected ? <OrderMobileSummary t={t} idea={selected} /> : null}
      actions={
        <StepActions back={onBack ? { label: t.back, onClick: onBack } : null}>
          {selected && <PrimaryButton onClick={() => onBuy(selected)}>{t.next}</PrimaryButton>}
        </StepActions>
      }
    >
      <Companion assistant={assistant ?? null}>{t.tipFind}</Companion>
      <StepTitle>{t.findTitle}</StepTitle>
      <form
        className={searchClass}
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <span className={searchIconClass}>
          <SearchIcon />
        </span>
        <input value={query} placeholder={t.findPlaceholder} aria-label={t.findPlaceholder} onChange={(event) => onQuery(event.target.value)} className={searchInputClass} />
        <button type="submit" className={searchButtonClass} disabled={loading}>
          {t.search}
        </button>
      </form>
      {ideas.length === 0 && !loading && <p className={mutedTextClass}>{t.noResults}</p>}
      {ideas.length > 0 && (
        <div role="radiogroup" aria-labelledby={CHECKOUT_TITLE_ID} className={resultsClass} aria-busy={loading || undefined}>
          {ideas.map((idea, index) => {
            const on = selected?.domain === idea.domain;
            return (
              <div key={idea.domain} className={resultClass} data-on={on || undefined}>
                <label className={resultButtonClass}>
                  <input
                    type="radio"
                    name="checkout-pick"
                    value={idea.domain}
                    checked={on}
                    onChange={() => setPicked(idea.domain)}
                    className={radioInputClass}
                  />
                  <span className={radioClass} aria-hidden="true">
                    {on ? <CheckIcon size={14} color="#fff" /> : null}
                  </span>
                  <span className={resultNameClass}>
                    {index === 0 && (
                      <span className={bestClass}>
                        <StarMark size={11} />
                        {t.bestMatch}
                      </span>
                    )}
                    <span className={resultDomainClass}>{idea.domain}</span>
                  </span>
                  <span className={resultPriceClass}>
                    <b>{usd(idea.priceCents)}</b>
                    <small>{idea.approxKrw ? t.approxKrw(krw(idea.approxKrw)) : t.perYearShort}</small>
                  </span>
                </label>
                {on && (
                  <div className={resultRevealClass}>
                    <Reveal label={t.whatsInPrice} defaultOpen={openBreakdownFor === idea.domain}>
                      {breakdownText(t, idea)}
                    </Reveal>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className={askRowClass}>
        <SecondaryButton onClick={onMoreIdeas}>{t.moreIdeas}</SecondaryButton>
        {ask}
      </div>
      <Notice>
        <strong style={{ display: 'block', marginBottom: 2 }}>{t.honestTitle}</strong>
        {t.honestBody}
        {onUseOwn && (
          <div style={{ marginTop: 6 }}>
            <TextButton onClick={onUseOwn}>{t.useOwnLink}</TextButton>
          </div>
        )}
      </Notice>
      <p className={smallNoteClass}>
        {ideas[0] ? `${t.oneYearLine} ` : ''}
        {t.privacyLine}
      </p>
      <Reveal label={t.advanced} defaultOpen={showAdvanced}>
        {/* only what exists today: no renewals or transfers yet (one year, no auto-renew) */}
        {t.otherEndings}
      </Reveal>
    </CheckoutLayout>
  );
}

// ---------------------------------------------------------------- adult buyer

type OwnerPage = 0 | 1 | 2 | 3;

// Adults buying for their own app: they are the legal owner, so they type
// their own details (name, contact, address: one small screen each), check
// it all once, then pay on Stripe. One price, nothing pre-ticked.
export function OwnerDetailsView({
  t,
  assistant,
  error,
  idea,
  details,
  agreed,
  renews,
  busy,
  problem,
  onDetails,
  onAgree,
  onPay,
  onBack,
  phoneDraft,
  onPhoneDraft,
  startPage = 0,
  saved = 'none',
  onSavedChoice
}: StepBase & {
  idea: DomainIdeaView;
  details: OwnerDetails;
  // the member's saved details: 'saved' (prefilled from their last
  // purchase), 'none' (these will be saved after paying), 'forgotten'
  // (not kept); onSavedChoice: Forget / Don't save
  saved?: 'saved' | 'none' | 'forgotten';
  onSavedChoice?: () => void;
  // the phone as typed (calling code + number); details.phone is its E.164
  phoneDraft: PhoneDraft;
  onPhoneDraft: (draft: PhoneDraft) => void;
  agreed: boolean;
  renews: boolean;
  busy: boolean;
  problem: string;
  onDetails: (details: OwnerDetails) => void;
  onAgree: (agreed: boolean) => void;
  onPay: () => void;
  onBack: () => void;
  startPage?: OwnerPage;
}) {
  const [page, setPage] = useState<OwnerPage>(startPage);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const set = (key: keyof OwnerDetails) => (value: string) => onDetails({ ...details, [key]: value });
  const required = (key: keyof OwnerDetails) => (details[key].trim() ? '' : t.fieldRequired);
  const pageErrors: Record<OwnerPage, Partial<Record<keyof OwnerDetails, string>>> = {
    0: { firstName: required('firstName'), lastName: required('lastName') },
    1: {
      email: !details.email.trim() ? t.fieldRequired : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()) ? '' : t.emailInvalid,
      phone: toE164(phoneDraft) ? '' : t.phoneInvalid
    },
    2: {
      country: isKnownCountry(details.country) ? '' : t.fieldRequired,
      address1: required('address1'),
      city: required('city'),
      state: required('state'),
      zip: required('zip')
    },
    3: {}
  };
  const errorsFor = (target: OwnerPage) => (checked[target] ? pageErrors[target] : {});
  const errors = errorsFor(page);
  const pageValid = (target: OwnerPage) => Object.values(pageErrors[target]).every((value) => !value);
  const missing = ownerDetailsProblem(t, details);
  const canPay = !missing && agreed && !busy;

  function next() {
    if (!pageValid(page)) {
      setChecked((prev) => ({ ...prev, [page]: true }));
      focusFirstInvalid();
      return;
    }
    setPage((page + 1) as OwnerPage);
  }
  function back() {
    if (page === 0) onBack();
    else setPage((page - 1) as OwnerPage);
  }
  const tips = [t.tipOwner, t.tipContact, t.tipAddress, t.tipReview];
  const titles = [t.ownerNameTitle, t.contactTitle, t.addressTitle, t.reviewTitle];
  const leads = [t.nameGroupNote, t.contactGroupNote, t.ownerPrivate, saved === 'saved' ? t.savedLead : t.ownerIntro];
  return (
    <CheckoutLayout
      stepKey={`owner-${page}`}
      error={error}
      progress={buyProgress(t, page + 1)}
      aside={<OrderSummary t={t} idea={idea} renews={renews} />}
      mobileSummary={<OrderMobileSummary t={t} idea={idea} renews={renews} />}
      actions={
        <StepActions back={busy ? null : { label: t.back, onClick: back }}>
          {page < 3 ? (
            <PrimaryButton type="submit" form="owner-step">
              {t.next}
            </PrimaryButton>
          ) : (
            <PrimaryButton busy={busy} disabled={!canPay} onClick={onPay}>
              {busy ? t.opening : t.payButton(usd(idea.priceCents))}
            </PrimaryButton>
          )}
        </StepActions>
      }
    >
      <Companion assistant={assistant ?? null}>{tips[page]}</Companion>
      <StepTitle lead={leads[page]}>{titles[page]}</StepTitle>
      <form
        id="owner-step"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (page < 3) next();
          else if (canPay) onPay();
        }}
      >
        {page === 0 && (
          <FieldGrid>
            <TextField label={t.firstName} value={details.firstName} onChange={set('firstName')} autoComplete="given-name" error={errors.firstName} autoFocus />
            <TextField label={t.lastName} value={details.lastName} onChange={set('lastName')} autoComplete="family-name" error={errors.lastName} />
          </FieldGrid>
        )}
        {page === 1 && (
          <div className={stackClass}>
            <TextField label={t.email} type="email" inputMode="email" value={details.email} onChange={set('email')} autoComplete="email" error={errors.email} placeholder="you@example.com" autoFocus />
            <PhoneField
              label={t.phone}
              dialLabel={t.dialCode}
              draft={phoneDraft}
              onChange={(draft) => {
                onPhoneDraft(draft);
                onDetails({ ...details, phone: toE164(draft) });
              }}
              error={errors.phone}
            />
          </div>
        )}
        {page === 2 && (
          <FieldGrid>
            <div data-span="2" className={countryFieldClass}>
              <span>{t.country}</span>
              <CountrySelect value={details.country} onChange={set('country')} label={t.country} className={selectClass} error={errors.country} />
            </div>
            <div data-span="2">
              <TextField label={t.address1} value={details.address1} onChange={set('address1')} autoComplete="street-address" error={errors.address1} />
            </div>
            <TextField label={t.city} value={details.city} onChange={set('city')} autoComplete="address-level2" error={errors.city} />
            <TextField label={t.state} value={details.state} onChange={set('state')} autoComplete="address-level1" error={errors.state} />
            <TextField label={t.zip} value={details.zip} onChange={set('zip')} autoComplete="postal-code" error={errors.zip} />
          </FieldGrid>
        )}
        {page === 3 && (
          <>
            <dl className={reviewListClass}>
              {[
                { label: t.reviewOwner, value: `${details.firstName} ${details.lastName}`.trim(), page: 0 as OwnerPage },
                { label: t.reviewContact, value: [details.email, details.phone].filter(Boolean).join('\n'), page: 1 as OwnerPage },
                {
                  label: t.reviewAddress,
                  value: [details.address1, [details.city, details.state, details.zip].filter(Boolean).join(', '), details.country].filter(Boolean).join('\n'),
                  page: 2 as OwnerPage
                }
              ].map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                  <button type="button" className={textButtonClass} onClick={() => setPage(row.page)}>
                    {t.edit}
                  </button>
                </div>
              ))}
            </dl>
            <p className={savedNoteClass} data-saved={saved}>
              <span>{saved === 'saved' ? t.savedNote : saved === 'none' ? t.saveNextNote : t.notSavedNote}</span>
              {saved !== 'forgotten' && onSavedChoice && (
                <>
                  <span aria-hidden="true">·</span>
                  <button type="button" className={textButtonClass} onClick={onSavedChoice}>
                    {saved === 'saved' ? t.savedForget : t.dontSave}
                  </button>
                </>
              )}
            </p>
            <Notice>{t.cheaperElsewhere}</Notice>
            <label className={consentClass}>
              <input type="checkbox" checked={agreed} onChange={(event) => onAgree(event.target.checked)} />
              <span className={consentBoxClass} aria-hidden="true">
                <CheckIcon size={14} color="#fff" />
              </span>
              <span>{t.confirmOwner}</span>
            </label>
            {problem && <Notice tone="error">{problem}</Notice>}
            <p className={payNoteClass}>
              <ShieldIcon size={14} />
              <span>{t.payNote}</span>
            </p>
          </>
        )}
        {/* Enter submits the step */}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </CheckoutLayout>
  );
}

// ---------------------------------------------------------------- under 18

export function ParentRequestView({
  t,
  assistant,
  error,
  idea,
  email,
  sending,
  onEmail,
  onSend,
  onBack
}: StepBase & {
  idea: DomainIdeaView;
  email: string;
  sending: boolean;
  onEmail: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
}) {
  const ready = !sending && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <CheckoutLayout
      stepKey="parent"
      error={error}
      progress={buyProgress(t, 1, true)}
      aside={<OrderSummary t={t} idea={idea} />}
      mobileSummary={<OrderMobileSummary t={t} idea={idea} />}
      actions={
        <StepActions back={{ label: t.back, onClick: onBack }}>
          <PrimaryButton busy={sending} disabled={!ready} onClick={onSend}>
            {t.sendToParent}
          </PrimaryButton>
        </StepActions>
      }
    >
      <Companion assistant={assistant ?? null}>{t.tipParent}</Companion>
      <StepTitle lead={t.parentBody(idea.domain, usd(idea.priceCents))}>{t.parentTitle}</StepTitle>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) onSend();
        }}
      >
        <TextField label={t.parentEmail} type="email" inputMode="email" autoComplete="off" value={email} onChange={onEmail} placeholder="parent@example.com" autoFocus />
      </form>
    </CheckoutLayout>
  );
}

// ---------------------------------------------------------------- results

// A stop in the flow (sent, refunded, nothing charged...): what happened and
// the one next step.
export function MessageView({
  assistant,
  title,
  tip,
  body,
  note,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  noteTone = 'warm',
  stepKey = 'message'
}: StepBase & {
  title: string;
  tip?: string;
  body: string;
  note?: string;
  noteTone?: 'warm' | 'error';
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  stepKey?: string;
}) {
  return (
    <CheckoutLayout
      stepKey={stepKey}
      actions={
        <StepActions>
          {secondaryLabel && onSecondary && <SecondaryButton onClick={onSecondary}>{secondaryLabel}</SecondaryButton>}
          <PrimaryButton onClick={onPrimary}>{primaryLabel}</PrimaryButton>
        </StepActions>
      }
    >
      {tip && <Companion assistant={assistant ?? null}>{tip}</Companion>}
      <StepTitle>{title}</StepTitle>
      {body ? <p className={bodyTextClass}>{body}</p> : null}
      {note && <Notice tone={noteTone}>{note}</Notice>}
    </CheckoutLayout>
  );
}

// The go-live moment, after the celebration in the Build page's own style:
// Lumine at her desk (the "Lumine at work" pixel scene) doing the setup,
// the four real steps beside her, then confetti and the new address.
export function GoingLiveView({
  t,
  assistant,
  error,
  domain,
  reached,
  title,
  body,
  priceCents,
  onClose
}: StepBase & {
  domain: string;
  // the order's price (the receipt beside the steps)
  priceCents?: number;
  // how many of Paid, Registered, Secure, Live are done (from the order)
  reached: number;
  title?: string;
  body?: string;
  onClose: () => void;
}) {
  const steps = [t.stepPaid, t.stepRegistered, t.stepSecure, t.stepLive];
  return (
    <CheckoutLayout
      stepKey={`going-live-${reached}`}
      error={error}
      aside={priceCents ? <ReceiptSummary t={t} domain={domain} priceCents={priceCents} /> : null}
      mobileSummary={priceCents ? <ReceiptMobileSummary t={t} domain={domain} priceCents={priceCents} /> : null}
      actions={
        <StepActions>
          <SecondaryButton onClick={onClose}>{t.backToApp}</SecondaryButton>
        </StepActions>
      }
    >
      <Companion assistant={assistant ?? null}>{t.tipWorking}</Companion>
      <StepTitle>{title || t.settingUpTitle(domain)}</StepTitle>
      <div className={stageClass}>
        <div className={stageSceneClass}>
          <LumineAtWork variant="toast" mode="working" />
        </div>
        <p className={srOnlyClass} role="status">
          {steps[Math.min(reached, steps.length - 1)]}
        </p>
        <ol className={liveStepsClass} aria-label={title || t.settingUpTitle(domain)}>
          {steps.map((label, index) => {
            const state = index < reached ? 'done' : index === reached ? 'current' : 'todo';
            return (
              <li key={label} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
                <span className={liveDotClass} aria-hidden="true">
                  {state === 'done' ? <CheckIcon size={14} color="#fff" /> : state === 'current' ? <StarMark size={12} /> : index + 1}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className={bodyTextClass}>{body || t.settingUpBody}</p>
      <Notice tone="warm">{t.confirmEmailNote}</Notice>
    </CheckoutLayout>
  );
}

export function LiveView({
  t,
  assistant,
  domain,
  note,
  priceCents,
  onOpen,
  onShare,
  onDone
}: StepBase & {
  domain: string;
  note?: string;
  priceCents?: number;
  onOpen: () => void;
  // resolves true when the link was copied (no share sheet on this device)
  onShare?: () => Promise<boolean> | boolean | void;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <CheckoutLayout
      stepKey="live"
      aside={priceCents ? <ReceiptSummary t={t} domain={domain} priceCents={priceCents} /> : null}
      mobileSummary={priceCents ? <ReceiptMobileSummary t={t} domain={domain} priceCents={priceCents} /> : null}
      actions={
        <StepActions>
          <SecondaryButton onClick={onDone}>{t.done}</SecondaryButton>
          {onShare && (
            <SecondaryButton
              onClick={() => {
                void Promise.resolve(onShare()).then((didCopy) => setCopied(Boolean(didCopy)));
              }}
            >
              {copied ? t.linkCopied : t.shareLink}
            </SecondaryButton>
          )}
          <PrimaryButton onClick={onOpen}>{t.openIt}</PrimaryButton>
        </StepActions>
      }
    >
      <div className={celebrateClass}>
        <Confetti />
        <div className={celebrateSceneClass}>
          <LumineAtWork variant="toast" mode="idle" startPose="celebrate" />
        </div>
        <Companion assistant={assistant ?? null}>{t.tipLive}</Companion>
        <h1 id={CHECKOUT_TITLE_ID} tabIndex={-1} className={liveTitleClass}>
          {t.liveCaption(domain)}
        </h1>
        <p className={bodyTextClass} style={{ textAlign: 'center' }}>
          {t.liveBody}
        </p>
        <p className={srOnlyClass} role="status">
          {copied ? t.linkCopied : ''}
        </p>
      </div>
      {note && <Notice tone="warm">{note}</Notice>}
    </CheckoutLayout>
  );
}

// The Modal-free title for an order's current stage (the dialog's name).
export function orderStatusTitle(t: AddressText, order: DomainOrderView) {
  if (order.stage === 'live') return t.liveTitle(order.domain);
  if (order.stage === 'refunded') return t.refundedTitle;
  if (order.stage === 'refunding') return t.refundingTitle;
  if (order.stage === 'support') return t.supportTitle(order.domain);
  if (order.stage !== 'setting_up') return t.notPaidTitle;
  return t.settingUpTitle(order.domain);
}

// After Stripe: where the order is.
export function OrderStatusView({
  t,
  assistant,
  order,
  cancelledReturn = false,
  refreshError = '',
  onOpen,
  onShare,
  onTryAgain,
  onClose
}: StepBase & {
  order: DomainOrderView;
  // back from Stripe's cancel link: the member left without paying
  cancelledReturn?: boolean;
  // the last refresh failed (the screen keeps the order's last known stage)
  refreshError?: string;
  onOpen: () => void;
  onShare?: () => Promise<boolean> | boolean | void;
  onTryAgain: () => void;
  onClose: () => void;
}) {
  if (order.stage === 'live') {
    return <LiveView t={t} assistant={assistant} domain={order.domain} priceCents={order.priceCents} note={t.confirmEmailNote} onOpen={onOpen} onShare={onShare} onDone={onClose} />;
  }
  if (order.stage === 'refunded') {
    const why =
      order.failureReason === 'taken'
        ? t.whyTaken(order.domain)
        : order.failureReason === 'registrar_price_changed'
          ? t.whyPrice(order.domain)
          : t.whyOther(order.domain);
    return (
      <MessageView
        t={t}
        assistant={assistant}
        stepKey="refunded"
        title={t.refundedTitle}
        tip={t.tipOops}
        body={t.refundedBody(order.domain, usd(order.priceCents), why)}
        primaryLabel={t.tryAgain}
        onPrimary={onTryAgain}
        secondaryLabel={t.close}
        onSecondary={onClose}
      />
    );
  }
  if (order.stage === 'refunding') {
    return <MessageView t={t} assistant={assistant} stepKey="refunding" title={t.refundingTitle} tip={t.tipOops} body={t.refundingBody(usd(order.priceCents))} primaryLabel={t.close} onPrimary={onClose} />;
  }
  if (order.stage === 'support') {
    return <MessageView t={t} assistant={assistant} stepKey="support" title={t.supportTitle(order.domain)} body={t.supportBody} primaryLabel={t.close} onPrimary={onClose} />;
  }
  if (order.stage === 'paying' && !cancelledReturn) {
    // back from Stripe before its confirmation reached us: wait for it
    return (
      <GoingLiveView
        t={t}
        assistant={assistant}
        error={refreshError}
        domain={order.domain}
        reached={0}
        title={t.paymentCheckingTitle}
        body={t.paymentCheckingBody}
        priceCents={order.priceCents}
        onClose={onClose}
      />
    );
  }
  if (order.stage !== 'setting_up') {
    // stopped, or Stripe's cancel link: nothing was charged
    return (
      <MessageView
        t={t}
        assistant={assistant}
        stepKey="not-paid"
        title={t.notPaidTitle}
        tip={t.tipOops}
        body={t.notPaidBody}
        primaryLabel={t.tryAgain}
        onPrimary={onTryAgain}
        secondaryLabel={t.close}
        onSecondary={onClose}
      />
    );
  }
  return (
    <GoingLiveView
      t={t}
      assistant={assistant}
      error={refreshError}
      domain={order.domain}
      priceCents={order.priceCents}
      reached={order.status === 'registered' ? 2 : 1}
      onClose={onClose}
    />
  );
}

// ---------------------------------------------------------------- connect your own

export function ConnectView({
  t,
  assistant,
  error,
  hostname,
  onHostname,
  onConnect,
  onClose,
  stage,
  providerName,
  providerSteps,
  domainConnectUrl,
  records,
  status,
  onCheck,
  ask,
  showRecords = false
}: StepBase & {
  hostname: string;
  onHostname: (value: string) => void;
  onConnect: () => void;
  onClose?: () => void;
  stage: 'enter' | 'setup';
  providerName: string | null;
  providerSteps: string[];
  domainConnectUrl: string | null;
  records: DnsRecordView[];
  status: 'waiting' | 'checking' | 'securing' | 'connected';
  onCheck: () => void;
  ask?: React.ReactNode;
  showRecords?: boolean;
}) {
  const [copiedValue, setCopiedValue] = useState('');
  if (stage === 'enter') {
    return (
      <CheckoutLayout
        stepKey="connect-enter"
        error={error}
        actions={
          <StepActions back={onClose ? { label: t.back, onClick: onClose } : null}>
            <PrimaryButton disabled={!hostname.trim()} onClick={onConnect}>
              {t.connectGo}
            </PrimaryButton>
          </StepActions>
        }
      >
        <Companion assistant={assistant ?? null}>{t.tipConnect}</Companion>
        <StepTitle>{t.connectTitle}</StepTitle>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (hostname.trim()) onConnect();
          }}
        >
          <TextField label={t.connectTitle} value={hostname} onChange={onHostname} placeholder={t.connectPlaceholder} autoComplete="off" inputMode="url" autoFocus />
        </form>
        {ask && <div className={askRowClass}>{ask}</div>}
      </CheckoutLayout>
    );
  }
  const connected = status === 'connected';
  const statusText = connected ? t.connected : status === 'securing' ? t.securing : status === 'checking' ? t.checking : t.waiting;
  return (
    <CheckoutLayout
      stepKey="connect-setup"
      error={error}
      actions={
        <StepActions>
          {onClose && (connected ? <PrimaryButton onClick={onClose}>{t.done}</PrimaryButton> : <SecondaryButton onClick={onClose}>{t.close}</SecondaryButton>)}
          {!connected && (
            <PrimaryButton busy={status === 'checking'} onClick={onCheck}>
              {t.checkNow}
            </PrimaryButton>
          )}
        </StepActions>
      }
    >
      <Companion assistant={assistant ?? null}>{t.tipConnect}</Companion>
      <StepTitle>{hostname}</StepTitle>
      <div className={statusPillClass} data-state={status} role="status">
        <span aria-hidden="true">{connected ? <CheckIcon size={14} color="#fff" /> : null}</span>
        {statusText}
      </div>
      {!connected && domainConnectUrl && (
        <>
          <PrimaryButton onClick={() => window.location.assign(domainConnectUrl)}>{t.connectAuto(providerName || 'your domain company')}</PrimaryButton>
          <p className={smallNoteClass}>{t.connectAutoNote}</p>
        </>
      )}
      {!connected && !domainConnectUrl && (
        <>
          <h2 className={subheadClass}>{providerName ? t.connectSteps(providerName) : t.connectStepsGeneric}</h2>
          <ol className={providerStepsClass}>
            {providerSteps.map((step, index) => (
              <li key={step}>
                <span aria-hidden="true">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <div className={recordsClass}>
            {records.map((record) => (
              <div key={record.type + record.host} className={recordClass}>
                <div className={recordHeadClass}>
                  <b>{record.type}</b>
                  <span>
                    {t.recordHost}: <code>{record.host}</code>
                  </span>
                  <button
                    type="button"
                    className={textButtonClass}
                    onClick={() => {
                      void navigator.clipboard?.writeText(record.value).catch(() => {});
                      setCopiedValue(record.value);
                    }}
                  >
                    {copiedValue === record.value ? t.copied : t.copyValue}
                  </button>
                </div>
                <code className={recordValueClass}>{record.value}</code>
              </div>
            ))}
          </div>
        </>
      )}
      {ask && <div className={askRowClass}>{ask}</div>}
      {domainConnectUrl && !connected && (
        <Reveal label={t.rawRecords} defaultOpen={showRecords}>
          {records.map((record) => (
            <div key={record.type + record.host} style={{ overflowWrap: 'anywhere' }}>
              {record.type} · {record.fullName} → <code>{record.value}</code>
            </div>
          ))}
        </Reveal>
      )}
    </CheckoutLayout>
  );
}

// ---------------------------------------------------------------- styles

const pop = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); }
`;
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(91, 75, 255, 0.45); }
  50% { box-shadow: 0 0 0 8px rgba(91, 75, 255, 0); }
`;

const bodyTextClass = css`
  margin: 0 0 14px;
  color: ${T.body};
  font-size: 16px;
  line-height: 1.6;
`;
const mutedTextClass = css`
  margin: 0 0 16px;
  color: ${T.muted};
  font-size: 15px;
`;
const smallNoteClass = css`
  margin: 14px 0 4px;
  color: ${T.muted};
  font-size: 14px;
  line-height: 1.5;
`;
const askRowClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 18px 0 0;
`;
const stackClass = css`
  display: grid;
  gap: 18px;
`;
const addressStackClass = css`
  display: grid;
  gap: 10px;
  margin: 4px 0 22px;
`;
const addressBarClass = css`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 16px;
  background: #f4f5f9;
  &[data-tone='free'] {
    background: ${T.greenTint};
  }
  &[data-tone='rent'] {
    background: ${T.blueTint};
  }
`;
const addressDotsClass = css`
  display: inline-flex;
  gap: 4px;
  flex: none;
  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(20, 21, 28, 0.16);
  }
`;
const addressFieldClass = css`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #fff;
  color: ${T.muted};
  box-shadow: 0 1px 2px rgba(20, 20, 40, 0.06);
`;
const addressHostClass = css`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${T.ink};
  font-weight: 700;
  font-size: 16px;
`;
const addressTagClass = css`
  flex: none;
  font-size: 13px;
  font-weight: 750;
  [data-tone='free'] > & {
    color: ${T.green};
  }
  [data-tone='rent'] > & {
    color: ${T.blue};
  }
  @media (max-width: 420px) {
    display: none;
  }
`;
const searchClass = css`
  position: relative;
  display: flex;
  align-items: center;
  margin: 4px 0 18px;
`;
const searchIconClass = css`
  position: absolute;
  left: 18px;
  color: ${T.muted};
  display: grid;
  pointer-events: none;
`;
const searchInputClass = css`
  width: 100%;
  min-height: 60px;
  padding: 0 112px 0 50px;
  border: 1.5px solid ${T.field};
  border-radius: 18px;
  background: #fff;
  color: ${T.ink};
  font: inherit;
  font-size: 18px;
  font-weight: 600;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  &:focus {
    outline: none;
    border-color: ${T.blue};
    box-shadow: 0 0 0 4px rgba(47, 123, 224, 0.16);
  }
`;
const searchButtonClass = css`
  position: absolute;
  right: 7px;
  min-height: 46px;
  padding: 0 18px;
  border: 0;
  border-radius: 13px;
  background: ${T.ink};
  color: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
  }
  &:focus-visible {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
  }
`;
const resultsClass = css`
  display: grid;
  gap: 10px;
  margin: 0 0 4px;
  &[aria-busy] {
    opacity: 0.6;
  }
`;
const resultClass = css`
  border: 1.5px solid ${T.line};
  border-radius: 18px;
  background: #fff;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
  &:hover {
    border-color: #c5cbe0;
  }
  &[data-on] {
    border-color: ${T.blue};
    background: #f7faff;
    box-shadow: 0 0 0 3px rgba(47, 123, 224, 0.12);
  }
`;
const resultButtonClass = css`
  position: relative;
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border: 0;
  background: none;
  color: ${T.ink};
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 18px;
  &:focus-visible {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
  }
`;
const radioInputClass = css`
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  &:focus-visible + span {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
  }
`;
const srOnlyClass = css`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;
const radioClass = css`
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #c5cbe0;
  display: grid;
  place-items: center;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
  [data-on] & {
    border-color: ${T.blue};
    background: ${T.blue};
    animation: ${pop} 0.3s ${T.ease};
  }
  @media (prefers-reduced-motion: reduce) {
    [data-on] & {
      animation: none;
    }
  }
`;
const resultNameClass = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const bestClass = css`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 2px 9px;
  border-radius: 999px;
  background: ${T.violet};
  color: #fff;
  font-size: 12px;
  font-weight: 750;
`;
const resultDomainClass = css`
  font-size: 18px;
  font-weight: 760;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
`;
const resultPriceClass = css`
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  b {
    font-size: 18px;
    font-weight: 780;
    font-variant-numeric: tabular-nums;
  }
  small {
    font-size: 13px;
    color: ${T.muted};
  }
`;
const resultRevealClass = css`
  padding: 0 16px 12px 54px;
  margin-top: -10px;
`;
const countryFieldClass = css`
  display: flex;
  flex-direction: column;
  gap: 7px;
  > span:first-child {
    font-size: 14.5px;
    font-weight: 700;
  }
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
const savedNoteClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin: 2px 0 14px;
  color: ${T.muted};
  font-size: 14px;
  line-height: 1.5;
  button {
    min-height: 32px;
    font-size: 14px;
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
const mobileNoteClass = css`
  margin: 10px 0 0;
  font-size: 13.5px;
  color: ${T.muted};
`;
const stageClass = css`
  display: flex;
  align-items: center;
  gap: 24px;
  margin: 6px 0 22px;
  padding: 20px;
  border-radius: 22px;
  background: #110d22;
  color: #fff;
  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
  }
`;
const stageSceneClass = css`
  flex: none;
  display: grid;
  place-items: center;
  padding: 8px;
  border: 3px solid #2c2442;
  border-radius: 12px;
  box-shadow: 0 0 0 3px #0a0716;
  canvas {
    width: 224px !important;
    height: 200px !important;
  }
  @media (max-width: 560px) {
    align-self: center;
    canvas {
      width: 168px !important;
      height: 150px !important;
    }
  }
`;
const liveStepsClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
  min-width: 0;
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 650;
    color: #8e86ad;
  }
  li[data-state='done'] {
    color: #ffffff;
  }
  li[data-state='current'] {
    color: #fff3c4;
  }
`;
const liveDotClass = css`
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
  background: #2c2442;
  color: #8e86ad;
  [data-state='done'] > & {
    background: ${T.green};
    color: #fff;
  }
  [data-state='current'] > & {
    background: ${T.violet};
    color: #fff3c4;
    animation: ${pulse} 1.6s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    [data-state='current'] > & {
      animation: none;
    }
  }
`;
const celebrateClass = css`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;
const celebrateSceneClass = css`
  margin: 4px 0 18px;
  padding: 10px;
  border-radius: 20px;
  background: #110d22;
  border: 3px solid #2c2442;
  box-shadow: 0 0 0 3px #0a0716;
  animation: ${pop} 0.5s ${T.ease} both;
  canvas {
    width: 168px !important;
    height: 150px !important;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
const liveTitleClass = css`
  /* focused by code when a screen opens (the start point for keyboards
     and screen readers), not a control: no focus ring */
  &:focus {
    outline: none;
  }
  margin: 4px 0 12px;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 780;
  letter-spacing: -0.015em;
  overflow-wrap: anywhere;
  @media (max-width: 759px) {
    font-size: 25px;
  }
`;
const statusPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  padding: 10px 14px;
  border-radius: 16px;
  background: #f4f5f9;
  color: ${T.body};
  font-size: 15px;
  font-weight: 650;
  line-height: 1.45;
  > span {
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: ${T.violet};
    animation: ${pulse} 1.6s ease-in-out infinite;
  }
  &[data-state='connected'] {
    background: ${T.greenTint};
    color: #0c6b36;
  }
  &[data-state='connected'] > span {
    background: ${T.green};
    animation: none;
  }
  @media (prefers-reduced-motion: reduce) {
    > span {
      animation: none;
    }
  }
`;
const subheadClass = css`
  margin: 4px 0 10px;
  font-size: 17px;
  font-weight: 750;
`;
const providerStepsClass = css`
  list-style: none;
  margin: 0 0 18px;
  padding: 0;
  display: grid;
  gap: 10px;
  font-size: 15.5px;
  color: ${T.body};
  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  li > span {
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: ${T.blueTint};
    color: ${T.blue};
    font-size: 13px;
    font-weight: 800;
  }
`;
const recordsClass = css`
  display: grid;
  gap: 10px;
`;
const recordClass = css`
  padding: 12px 14px;
  border: 1.5px solid ${T.line};
  border-radius: 16px;
`;
const recordHeadClass = css`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  b {
    padding: 2px 8px;
    border-radius: 8px;
    background: ${T.blueTint};
    color: ${T.blue};
    font-size: 13px;
  }
  span {
    flex: 1;
    min-width: 0;
    color: ${T.muted};
    font-size: 14px;
    overflow-wrap: anywhere;
  }
`;
const recordValueClass = css`
  display: block;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f4f5f9;
  font-size: 14px;
  word-break: break-all;
`;
