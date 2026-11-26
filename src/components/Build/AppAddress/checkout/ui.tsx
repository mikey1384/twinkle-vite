import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css, cx, keyframes } from '@emotion/css';
import AssistantFace from '~/components/AssistantFace';
import TwinkleLogo from '~/containers/App/Header/TwinkleLogo';
import { lockBodyScroll } from '~/helpers/bodyScrollLock';
import { trapModalFocus } from '~/components/Modal';
import { COUNTRY_CODES, POPULAR_COUNTRIES, countryName, isKnownCountry } from './countries';
import { CALLING_CODES, callingCode, splitInternational, type PhoneDraft } from './phone';

// The own-web-address checkout's look (Mikey 11-26: friendlier than a form
// wall, more modern than Namecheap, Twinkle's own fun). It borrows the
// newest surfaces' language: the "Sign in with Twinkle" page (the Twinkle
// logo, ink and blue, 28px frames, pill buttons, soft two-layer shadow, no
// gradients), the lite host's ✦ violet and rounded sheets, and the Build
// header chips. Sizes are px so it reads the same on twin-kle.com (10px
// root) and in previews. One question per screen; the price stays in view.

export const T = {
  page: '#eef0f6',
  paper: '#ffffff',
  ink: '#14151c',
  body: '#3a3d4a',
  muted: '#5f6270',
  line: '#e3e5ec',
  field: '#d6d8e2',
  blue: '#2f7be0',
  blueDeep: '#2468c4',
  blueTint: '#eaf2fd',
  violet: '#5b4bff',
  green: '#12a150',
  greenTint: '#e8f7ee',
  warmTint: '#fff4df',
  rose: '#c4314b',
  shadow: '0 1px 2px rgba(20, 20, 40, 0.06), 0 24px 60px rgba(20, 20, 40, 0.12)',
  ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
};

const PHONE = '(max-width: 759px)';
// the visible step's heading, which names the dialog
export const CHECKOUT_TITLE_ID = 'app-address-checkout-title';
// the first field that needs fixing, after Next found a problem
export function focusFirstInvalid() {
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[data-checkout-surface] [aria-invalid="true"]')?.focus();
  });
}
const WIDE = '(min-width: 900px)';

// ---------------------------------------------------------------- icons

export function StarMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5c.7 5.2 3.2 7.8 9.5 9.5-6.3 1.7-8.8 4.3-9.5 9.5-.7-5.2-3.2-7.8-9.5-9.5 6.3-1.7 8.8-4.3 9.5-9.5z" />
    </svg>
  );
}
export function CheckIcon({ size = 16, color = T.blue }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={chevronClass}
      style={{ transform: open ? 'rotate(180deg)' : 'none', flex: 'none' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
export function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  );
}
export function ShieldIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M12 2 4 5v6c0 5 3.4 9.6 8 11 4.6-1.4 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6Z" />
    </svg>
  );
}
export function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
    </svg>
  );
}

// ---------------------------------------------------------------- surface

// The checkout's whole screen: over the Build page (overlay, with "Back to
// your app") or as its own page (the parent's link). It keeps the page
// underneath alive, so the workspace and its unsaved work stay as they were.
export function CheckoutSurface({
  variant,
  label,
  onClose,
  closeLabel,
  topRight,
  children
}: {
  variant: 'overlay' | 'page';
  label: string;
  onClose?: () => void;
  closeLabel?: string;
  topRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [opener] = useState(() => (typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null)));
  useLayoutEffect(() => {
    if (variant !== 'overlay' || typeof document === 'undefined') return;
    return lockBodyScroll(document.body);
  }, [variant]);
  // A dialog over the Build page: Escape closes it and Tab stays inside it
  // (the shared Modal's trap), so the editor underneath can't be reached;
  // Zero and Ciel's floating window keeps its own focus.
  useEffect(() => {
    if (variant !== 'overlay') return;
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape' && onClose) {
        onClose();
        return;
      }
      const fromAgentWindow = (event.target as Element | null)?.closest?.('[data-website-agent-ui]');
      if (event.key === 'Tab' && scrollRef.current && !fromAgentWindow) trapModalFocus(event, scrollRef.current);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [variant, onClose]);
  // Focus moves in on open and back to what opened it (the address chip,
  // or the chip itself after a deep link) on close.
  useEffect(() => {
    if (variant !== 'overlay') return;
    if (!scrollRef.current?.contains(document.activeElement)) scrollRef.current?.focus({ preventScroll: true });
    return () => {
      const target =
        opener && opener.isConnected && opener !== document.body
          ? opener
          : document.querySelector<HTMLElement>('[data-header-chip="address"]');
      target?.focus({ preventScroll: true });
    };
    // the opener is fixed at first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);
  const content = (
    <div
      ref={scrollRef}
      tabIndex={-1}
      role={variant === 'overlay' ? 'dialog' : undefined}
      aria-modal={variant === 'overlay' ? true : undefined}
      aria-label={variant === 'overlay' ? undefined : label}
      aria-labelledby={variant === 'overlay' ? CHECKOUT_TITLE_ID : undefined}
      className={cx(surfaceClass, variant === 'overlay' && overlayClass)}
      data-checkout-surface=""
    >
      <header className={topBarClass}>
        <div className={logoClass}>
          <TwinkleLogo alwaysVisible linkHome={false} />
        </div>
        <div className={topRightClass}>
          {topRight}
          {onClose && (
            <button type="button" className={closeClass} onClick={onClose} aria-label={closeLabel}>
              <span className={closeTextClass}>{closeLabel}</span>
              <CloseIcon />
            </button>
          )}
        </div>
      </header>
      {children}
    </div>
  );
  if (variant === 'overlay' && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}

// ---------------------------------------------------------------- layout

export interface CheckoutProgress {
  labels: string[];
  // 0-based; labels.length means every step is done
  current: number;
  text: string;
}

// One screen of the checkout: the playful progress bar, the step card (the
// companion's line, the question, its fields, Back / Next) and the order
// summary beside it (on phones a compact bar above, with Next pinned to the
// bottom of the screen).
export function CheckoutLayout({
  stepKey,
  progress,
  aside,
  mobileSummary,
  actions,
  children,
  error,
  wide = false
}: {
  stepKey: string;
  // a request that failed, shown above the step
  error?: string;
  progress?: CheckoutProgress | null;
  aside?: React.ReactNode;
  mobileSummary?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  // no summary pane: the card takes the middle (results, celebrations)
  wide?: boolean;
}) {
  const hasAside = Boolean(aside) && !wide;
  // Each new screen starts at its heading (keyboard and screen readers)
  const cardRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const heading = cardRef.current?.querySelector<HTMLElement>(`#${CHECKOUT_TITLE_ID}`);
    heading?.focus({ preventScroll: false });
  }, [stepKey]);
  return (
    <div className={cx(layoutClass, hasAside && layoutWithAsideClass)}>
      {progress && <ProgressBar progress={progress} />}
      {mobileSummary && hasAside && <div className={mobileSummaryWrapClass}>{mobileSummary}</div>}
      <main ref={cardRef} className={cardClass}>
        <div key={stepKey} className={stepEnterClass}>
          {error ? (
            <div className={layoutErrorClass}>
              <Notice tone="error">{error}</Notice>
            </div>
          ) : null}
          {children}
        </div>
        {actions && <div className={actionsClass}>{actions}</div>}
      </main>
      {hasAside && <aside className={asideClass}>{aside}</aside>}
    </div>
  );
}

function ProgressBar({ progress }: { progress: CheckoutProgress }) {
  const { labels, current, text } = progress;
  return (
    <div className={progressClass}>
      <div className={progressTextClass} aria-live="polite">
        {text}
      </div>
      <ol className={progressTrackClass} aria-label={text}>
        {labels.map((label, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'todo';
          return (
            <li key={label} className={progressStepClass} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              <span className={progressBarClass}>
                <span />
              </span>
              <span className={progressLabelClass}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// The member's Home agent (Zero or Ciel) with one short, helpful line.
export function Companion({ assistant, children }: { assistant: 'Zero' | 'Ciel' | null; children: React.ReactNode }) {
  return (
    <div className={companionClass}>
      {assistant ? (
        <span className={companionFaceClass}>
          <AssistantFace assistant={assistant} size="44px" />
        </span>
      ) : (
        <span className={cx(companionFaceClass, companionMarkClass)} aria-hidden="true">
          <StarMark size={20} />
        </span>
      )}
      <p className={bubbleClass}>{children}</p>
    </div>
  );
}

export function StepTitle({ children, lead }: { children: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <>
      <h1 id={CHECKOUT_TITLE_ID} tabIndex={-1} className={titleClass}>
        {children}
      </h1>
      {lead ? <p className={leadClass}>{lead}</p> : null}
    </>
  );
}

// ---------------------------------------------------------------- summary

export function SummaryCard({
  heading,
  domain,
  price,
  period,
  approx,
  checks,
  reveal,
  notes
}: {
  heading: string;
  domain: string;
  price?: string;
  period?: string;
  approx?: string | null;
  checks: string[];
  reveal?: { label: string; body: React.ReactNode } | null;
  notes?: Array<{ icon: 'shield' | 'info'; text: React.ReactNode }>;
}) {
  return (
    <section className={summaryClass} aria-label={heading}>
      <div className={summaryHeadingClass}>{heading}</div>
      <div className={summaryDomainClass}>{domain}</div>
      {price && (
        <div className={summaryPriceRowClass}>
          <span className={summaryPriceClass}>{price}</span>
          {period && <span className={summaryPeriodClass}>{period}</span>}
        </div>
      )}
      {approx && <div className={summaryApproxClass}>{approx}</div>}
      <ul className={checkListClass}>
        {checks.map((line) => (
          <li key={line}>
            <CheckIcon size={15} />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {reveal && <Reveal label={reveal.label}>{reveal.body}</Reveal>}
      {notes && notes.length > 0 && (
        <div className={summaryNotesClass}>
          {notes.map((note, index) => (
            <p key={index}>
              {note.icon === 'shield' ? <ShieldIcon size={14} /> : <InfoIcon />}
              <span>{note.text}</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

// Phones: the order in one tappable line above the step; tap for details.
export function MobileSummary({ domain, price, children }: { domain: string; price?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={mobileSummaryClass}>
      <button type="button" className={mobileSummaryButtonClass} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} disabled={!children}>
        <span className={mobileSummaryDomainClass}>{domain}</span>
        {price && <span className={mobileSummaryPriceClass}>{price}</span>}
        {children ? <ChevronIcon open={open} /> : null}
      </button>
      {children ? (
        <div id={id} className={revealBodyClass} data-reveal-body="" data-open={open || undefined} inert={!open}>
          <div>
            <div className={mobileSummaryBodyClass}>{children}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Reveal({ label, children, defaultOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={revealClass}>
      <button type="button" className={textButtonClass} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {label}
        <ChevronIcon open={open} />
      </button>
      <div id={id} className={revealBodyClass} data-reveal-body="" data-open={open || undefined} inert={!open}>
        <div>
          <div className={revealInnerClass}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- fields

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  autoComplete,
  placeholder,
  inputMode,
  autoFocus,
  name,
  onBlur
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: 'text' | 'email' | 'tel';
  autoComplete?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoFocus?: boolean;
  name?: string;
  onBlur?: () => void;
}) {
  const id = useId();
  return (
    <div className={fieldClass}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={inputClass}
      />
      {error ? (
        <span id={`${id}-note`} className={fieldErrorClass} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-note`} className={fieldHintClass}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function regionName(code: string) {
  try {
    return new Intl.DisplayNames([document.documentElement.lang || 'en', 'en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

// The phone: a calling-code picker (every country) and the number as the
// person types it. A full international number typed or pasted into the
// number box moves its code into the picker. The caller keeps the draft and
// sends toE164(draft) (./phone.ts).
export function PhoneField({
  label,
  dialLabel,
  draft,
  onChange,
  error,
  hint,
  onBlur
}: {
  label: string;
  dialLabel: string;
  draft: PhoneDraft;
  onChange: (draft: PhoneDraft) => void;
  error?: string;
  hint?: string;
  onBlur?: () => void;
}) {
  const id = useId();
  const options = Object.keys(CALLING_CODES)
    .map((code) => ({ code, name: regionName(code), dial: CALLING_CODES[code] }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className={fieldClass}>
      <label htmlFor={id}>{label}</label>
      <div className={phoneRowClass}>
        <span className={dialWrapClass}>
          <span className={dialFaceClass} aria-hidden="true">
            +{callingCode(draft.country) || '…'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
          <select
            aria-label={dialLabel}
            value={draft.country}
            autoComplete="tel-country-code"
            onChange={(event) => onChange({ country: event.target.value, national: draft.national })}
            className={dialSelectClass}
          >
            {options.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name} (+{option.dial})
              </option>
            ))}
          </select>
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={draft.national}
          onChange={(event) => onChange(splitInternational(event.target.value, draft.country) || { country: draft.country, national: event.target.value })}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          placeholder="10 1234 5678"
          className={cx(inputClass, phoneInputClass)}
        />
      </div>
      {error ? (
        <span id={`${id}-note`} className={fieldErrorClass} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-note`} className={fieldHintClass}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export const selectClass = css`
  width: 100%;
  min-height: 54px;
  box-sizing: border-box;
  padding: 0 14px;
  border: 1.5px solid ${T.field};
  border-radius: 14px;
  background: #fff;
  color: ${T.ink};
  font: inherit;
  font-size: 16px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  &:focus {
    outline: none;
    border-color: ${T.blue};
    box-shadow: 0 0 0 4px rgba(47, 123, 224, 0.16);
  }
`;

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={fieldClass}>
      <span className={fieldLabelTextClass}>{label}</span>
      {children}
    </div>
  );
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className={fieldGridClass}>{children}</div>;
}

// The country list: every ISO country (where most Twinkle families live
// first), so only a real country can be chosen; the caller presets it from
// guessCountry().
export function CountrySelect({
  value,
  onChange,
  label,
  className,
  error
}: {
  value: string;
  onChange: (country: string) => void;
  label: string;
  className?: string;
  error?: string;
}) {
  const errorId = useId();
  const code = value.toUpperCase();
  const others = COUNTRY_CODES.filter((item) => !POPULAR_COUNTRIES.includes(item))
    .map((item) => ({ code: item, name: countryName(item) }))
    .sort((left, right) => left.name.localeCompare(right.name));
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minWidth: 0 }}>
      <select
        className={className || selectClass}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        value={isKnownCountry(code) ? code : ''}
        onChange={(event) => onChange(event.target.value)}
        style={{ flex: 1, minWidth: 0 }}
      >
        {!isKnownCountry(code) && <option value="" disabled />}
        {POPULAR_COUNTRIES.map((item) => (
          <option key={item} value={item}>
            {countryName(item)}
          </option>
        ))}
        <option disabled>──────────</option>
        {others.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
      {error ? (
        <span id={errorId} className={fieldErrorClass} role="alert" style={{ flexBasis: '100%' }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}


// ---------------------------------------------------------------- buttons

export function PrimaryButton({
  children,
  onClick,
  disabled,
  busy,
  type = 'button',
  form
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  type?: 'button' | 'submit';
  form?: string;
}) {
  return (
    <button type={type} form={form} className={primaryClass} onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined}>
      {busy ? <span className={spinnerClass} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={secondaryClass} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function TextButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={textButtonClass} onClick={onClick}>
      {children}
    </button>
  );
}

// Back on the left, the one primary action on the right.
export function StepActions({ back, children }: { back?: { label: string; onClick: () => void } | null; children?: React.ReactNode }) {
  return (
    <>
      {back ? (
        <button type="button" className={backButtonClass} onClick={back.onClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {back.label}
        </button>
      ) : (
        <span />
      )}
      <div className={actionsRightClass}>{children}</div>
    </>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warm' | 'error'; children: React.ReactNode }) {
  return (
    <div className={noticeClass} data-tone={tone} role={tone === 'error' ? 'alert' : undefined}>
      {tone === 'error' ? null : <InfoIcon />}
      <div>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------- styles

const chevronClass = css`
  transition: transform 0.2s ${T.ease};
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
const rise = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
`;
const slide = keyframes`
  from { opacity: 0; transform: translateX(18px); }
  to { opacity: 1; transform: none; }
`;
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const surfaceClass = css`
  min-height: 100vh;
  min-height: 100dvh;
  box-sizing: border-box;
  background: ${T.page};
  color: ${T.ink};
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  &:focus {
    outline: none;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;
const overlayClass = css`
  position: fixed;
  inset: 0;
  z-index: 100000;
  overflow-y: auto;
  overscroll-behavior: contain;
  animation: ${rise} 0.28s ${T.ease} both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
const topBarClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 20px;
  @media ${PHONE} {
    padding: 10px 14px;
  }
`;
const logoClass = css`
  font-size: 10px;
  flex: none;
`;
const topRightClass = css`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;
const closeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: ${T.ink};
  font: inherit;
  font-size: 15px;
  font-weight: 650;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(20, 20, 40, 0.08);
  transition: background-color 0.15s ease;
  &:hover {
    background: #f7f8fc;
  }
  &:focus-visible {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
  }
  @media ${PHONE} {
    width: 44px;
    padding: 0;
    justify-content: center;
  }
`;
const closeTextClass = css`
  @media ${PHONE} {
    display: none;
  }
`;
const layoutClass = css`
  max-width: 640px;
  margin: 0 auto;
  padding: 4px 20px 40px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  @media ${PHONE} {
    padding: 0 0 0;
    gap: 0;
  }
`;
const layoutWithAsideClass = css`
  @media ${WIDE} {
    max-width: 1040px;
    grid-template-columns: minmax(0, 1fr) 340px;
    column-gap: 28px;
  }
`;
const progressClass = css`
  grid-column: 1 / -1;
  padding: 6px 4px 10px;
  @media ${PHONE} {
    padding: 4px 16px 12px;
  }
`;
const progressTextClass = css`
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: ${T.muted};
`;
const progressTrackClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 6px;
`;
const progressStepClass = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  &[data-state='done'] > span:first-child > span {
    transform: scaleX(1);
  }
  &[data-state='current'] > span:first-child > span {
    transform: scaleX(0.5);
    background: ${T.violet};
  }
  &[data-state='current'] > span:last-child {
    color: ${T.ink};
  }
`;
const progressBarClass = css`
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: #dde1eb;
  overflow: hidden;
  > span {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: ${T.blue};
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.5s ${T.ease};
  }
  @media (prefers-reduced-motion: reduce) {
    > span {
      transition: none;
    }
  }
`;
const progressLabelClass = css`
  font-size: 13px;
  font-weight: 650;
  color: ${T.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  @media ${PHONE} {
    display: none;
  }
`;
const cardClass = css`
  position: relative;
  min-width: 0;
  background: ${T.paper};
  border-radius: 28px;
  box-shadow: ${T.shadow};
  padding: 32px 36px 28px;
  @media ${PHONE} {
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -1px 0 rgba(20, 20, 40, 0.04);
    padding: 22px 18px 0;
    min-height: calc(100dvh - 150px);
    display: flex;
    flex-direction: column;
  }
`;
const stepEnterClass = css`
  animation: ${slide} 0.32s ${T.ease} both;
  @media ${PHONE} {
    flex: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
const actionsClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 28px;
  @media ${PHONE} {
    position: sticky;
    bottom: 0;
    z-index: 2;
    margin: 20px -18px 0;
    padding: 12px 18px calc(12px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-top: 1px solid ${T.line};
  }
`;
const actionsRightClass = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
  @media ${PHONE} {
    flex: 1;
    > button {
      flex: 1;
    }
  }
`;
const asideClass = css`
  display: none;
  @media ${WIDE} {
    display: block;
    position: sticky;
    top: 16px;
  }
`;
const mobileSummaryWrapClass = css`
  grid-column: 1 / -1;
  @media ${WIDE} {
    display: none;
  }
  @media ${PHONE} {
    padding: 0 12px 12px;
  }
`;
const companionClass = css`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin: 0 0 18px;
`;
const companionFaceClass = css`
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 3px #fff, 0 4px 12px rgba(20, 20, 40, 0.14);
  background: #f1f2f7;
  overflow: hidden;
`;
const companionMarkClass = css`
  background: ${T.violet};
  color: #fff;
`;
const bubbleClass = css`
  position: relative;
  margin: 0;
  padding: 10px 14px;
  border-radius: 18px 18px 18px 6px;
  background: ${T.blueTint};
  color: #1f3f6e;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
  max-width: 440px;
`;
const titleClass = css`
  margin: 0 0 8px;
  font-size: 30px;
  line-height: 1.18;
  font-weight: 760;
  letter-spacing: -0.015em;
  color: ${T.ink};
  overflow-wrap: anywhere;
  @media ${PHONE} {
    font-size: 25px;
  }
`;
const leadClass = css`
  margin: 0 0 22px;
  color: ${T.body};
  font-size: 16px;
  line-height: 1.55;
`;
const summaryClass = css`
  background: ${T.paper};
  border-radius: 24px;
  box-shadow: ${T.shadow};
  padding: 24px;
`;
const summaryHeadingClass = css`
  font-size: 13px;
  font-weight: 700;
  color: ${T.muted};
  margin-bottom: 6px;
`;
const summaryDomainClass = css`
  font-size: 24px;
  line-height: 1.2;
  font-weight: 760;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
`;
const summaryPriceRowClass = css`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 14px;
`;
const summaryPriceClass = css`
  font-size: 32px;
  font-weight: 780;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
`;
const summaryPeriodClass = css`
  font-size: 15px;
  font-weight: 600;
  color: ${T.muted};
`;
const summaryApproxClass = css`
  font-size: 14px;
  color: ${T.muted};
`;
const checkListClass = css`
  list-style: none;
  margin: 18px 0 0;
  padding: 16px 0 0;
  border-top: 1px solid ${T.line};
  display: grid;
  gap: 10px;
  font-size: 14.5px;
  color: ${T.body};
  li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  svg {
    flex: none;
    margin-top: 3px;
  }
`;
const summaryNotesClass = css`
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid ${T.line};
  display: grid;
  gap: 10px;
  p {
    margin: 0;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: 13.5px;
    line-height: 1.5;
    color: ${T.muted};
  }
  svg {
    margin-top: 2px;
  }
`;
const mobileSummaryClass = css`
  background: ${T.paper};
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(20, 20, 40, 0.06), 0 8px 24px rgba(20, 20, 40, 0.08);
  overflow: hidden;
`;
const mobileSummaryButtonClass = css`
  width: 100%;
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border: 0;
  background: none;
  color: ${T.ink};
  font: inherit;
  text-align: left;
  cursor: pointer;
  &:disabled {
    cursor: default;
  }
  &:focus-visible {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: -3px;
  }
`;
const mobileSummaryDomainClass = css`
  flex: 1;
  min-width: 0;
  font-weight: 750;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const mobileSummaryPriceClass = css`
  font-weight: 780;
  font-size: 17px;
  font-variant-numeric: tabular-nums;
`;
const mobileSummaryBodyClass = css`
  padding: 0 16px 16px;
`;
const revealClass = css`
  margin-top: 14px;
`;
const revealBodyClass = css`
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.28s ${T.ease};
  > div {
    overflow: hidden;
    min-height: 0;
  }
  &[data-open] {
    grid-template-rows: 1fr;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
const revealInnerClass = css`
  padding-top: 8px;
  font-size: 13.5px;
  line-height: 1.55;
  color: ${T.muted};
`;
const fieldClass = css`
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  > label,
  > span:first-child {
    font-size: 14.5px;
    font-weight: 700;
    color: ${T.ink};
  }
`;
const fieldLabelTextClass = css``;
const inputClass = css`
  width: 100%;
  min-height: 54px;
  padding: 0 16px;
  border: 1.5px solid ${T.field};
  border-radius: 14px;
  background: #fff;
  color: ${T.ink};
  font: inherit;
  font-size: 17px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  &::placeholder {
    color: #a2a6b4;
  }
  &:focus {
    outline: none;
    border-color: ${T.blue};
    box-shadow: 0 0 0 4px rgba(47, 123, 224, 0.16);
  }
  &[aria-invalid='true'] {
    border-color: ${T.rose};
  }
`;
const phoneRowClass = css`
  display: flex;
  gap: 8px;
`;
const dialWrapClass = css`
  position: relative;
  flex: none;
  min-width: 96px;
  display: flex;
  &:focus-within > span:first-child {
    border-color: ${T.blue};
    box-shadow: 0 0 0 4px rgba(47, 123, 224, 0.16);
  }
`;
const dialFaceClass = css`
  ${selectClass};
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 17px;
  font-weight: 650;
  pointer-events: none;
`;
const dialSelectClass = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  font-size: 16px;
  &:focus-visible {
    opacity: 0;
  }
`;
const phoneInputClass = css`
  flex: 1;
  min-width: 0;
`;
const fieldErrorClass = css`
  font-size: 14px;
  font-weight: 650;
  color: ${T.rose};
`;
const fieldHintClass = css`
  font-size: 14px;
  color: ${T.muted};
`;
const fieldGridClass = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 14px;
  > [data-span='2'] {
    grid-column: 1 / -1;
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;
const buttonBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 26px;
  border-radius: 999px;
  font: inherit;
  font-size: 16.5px;
  font-weight: 720;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
  @media (prefers-reduced-motion: reduce) {
    transition: background-color 0.15s ease, box-shadow 0.15s ease;
    &:active:not(:disabled) {
      transform: none;
    }
  }
  &:focus-visible {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;
const primaryClass = css`
  ${buttonBase}
  border: 0;
  background: ${T.blue};
  color: #fff;
  box-shadow: 0 1px 2px rgba(20, 60, 140, 0.25);
  &:hover:not(:disabled) {
    background: ${T.blueDeep};
    box-shadow: 0 6px 18px rgba(36, 104, 196, 0.3);
  }
`;
const secondaryClass = css`
  ${buttonBase}
  border: 1.5px solid #cfd3de;
  background: #fff;
  color: ${T.ink};
  &:hover:not(:disabled) {
    background: #f6f7fb;
  }
`;
export const textButtonClass = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0;
  border: 0;
  background: none;
  color: ${T.blue};
  font: inherit;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  &:hover {
    color: ${T.blueDeep};
  }
  &:focus-visible {
    outline: 3px solid rgba(47, 123, 224, 0.35);
    outline-offset: 2px;
    border-radius: 6px;
  }
`;
const backButtonClass = css`
  ${buttonBase}
  padding: 0 14px 0 8px;
  gap: 4px;
  border: 0;
  background: none;
  color: ${T.muted};
  &:hover {
    color: ${T.ink};
    background: #f4f5f9;
  }
`;
const noticeClass = css`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 18px 0 0;
  padding: 14px 16px;
  border-radius: 16px;
  background: ${T.blueTint};
  color: #1f3f6e;
  font-size: 14.5px;
  line-height: 1.5;
  svg {
    margin-top: 3px;
  }
  &[data-tone='warm'] {
    background: ${T.warmTint};
    color: #6b4a00;
  }
  &[data-tone='error'] {
    background: #fdecef;
    color: ${T.rose};
    font-weight: 650;
  }
`;
const layoutErrorClass = css`
  margin: -6px 0 16px;
  > div {
    margin: 0;
  }
`;
const spinnerClass = css`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2.5px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  animation: ${spin} 0.8s linear infinite;
`;

export const checkoutCss = { inputClass, cardClass };
