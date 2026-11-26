import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css, cx, keyframes } from '@emotion/css';
import AssistantFace from '~/components/AssistantFace';
import TwinkleLogo from '~/containers/App/Header/TwinkleLogo';
import { COUNTRY_CODES, POPULAR_COUNTRIES, countryName, isKnownCountry, matchCountry, searchCountries } from './countries';
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

// The checkout's whole screen as a page of its own (the app's checkout at
// /build/<id>/domain, with "Back to your app"; the parent's link page with
// its language switch). Nothing is layered over another page, so there is
// no scroll lock, focus trap or hidden page behind it.
export function CheckoutSurface({
  label,
  onClose,
  closeLabel,
  topRight,
  children
}: {
  // kept for the call sites (both are pages now)
  variant?: 'page';
  label: string;
  onClose?: () => void;
  closeLabel?: string;
  topRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const previous = document.title;
    document.title = label ? `${label} · Twinkle` : previous;
    return () => {
      document.title = previous;
    };
  }, [label]);
  return (
    <div className={surfaceClass} data-checkout-surface="" aria-label={label}>
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

// A domain that may wrap only after its dots and hyphens, never inside a
// label ("the-adventure-of-a-" / "red-square.com", not "redsq" / "uare").
export function DomainText({ domain }: { domain: string }) {
  // (no look-behind: older Safari can't parse it)
  const parts = String(domain || '')
    .replace(/([.-])/g, '$1\u0000')
    .split('\u0000')
    .filter(Boolean);
  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index < parts.length - 1 ? <wbr /> : null}
        </React.Fragment>
      ))}
    </>
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
      <div className={summaryDomainClass}>
        <DomainText domain={domain} />
      </div>
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
          name="tel-national"
          inputMode="tel"
          autoComplete="tel-national"
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

// The country: a searchable combobox (ARIA combobox + listbox) instead of a
// long native list. Type to filter by English or Korean name or a common
// alias (Korea, 대한민국, USA, UK...); arrows, Enter and Escape work; on a
// phone it opens a full-height sheet with its own search box. The value is
// always an ISO code. Autofill (Chrome writes a country name or code into
// it) lands on the right country through the same aliases.
export function CountryField({
  label,
  value,
  onChange,
  error,
  detected,
  searchPlaceholder,
  noMatch,
  closeLabel
}: {
  label: string;
  value: string;
  onChange: (country: string) => void;
  error?: string;
  // the country guessed for this person, offered first
  detected?: string;
  searchPlaceholder: string;
  noMatch: string;
  closeLabel: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 759px)').matches);
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 759px)');
    if (!media) return;
    const onChangeMedia = () => setPhone(media.matches);
    media.addEventListener?.('change', onChangeMedia);
    return () => media.removeEventListener?.('change', onChangeMedia);
  }, []);
  const code = String(value || '').toUpperCase();
  const selectedName = isKnownCountry(code) ? countryName(code) : '';
  const top = Array.from(new Set([detected, code, ...POPULAR_COUNTRIES].filter((item): item is string => Boolean(item) && isKnownCountry(String(item)))));
  const options: Array<{ code: string; divider?: boolean }> = query
    ? searchCountries(query).map((item) => ({ code: item }))
    : [
        ...top.map((item) => ({ code: item })),
        ...COUNTRY_CODES.filter((item) => !top.includes(item))
          .sort((left, right) => countryName(left).localeCompare(countryName(right)))
          .map((item, index) => ({ code: item, divider: index === 0 }))
      ];
  const activeCode = options[Math.min(active, options.length - 1)]?.code;

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery('');
    window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }
  function openList() {
    setQuery('');
    setActive(Math.max(0, options.findIndex((item) => item.code === code)));
    setOpen(true);
    if (phone) window.requestAnimationFrame(() => sheetInputRef.current?.focus());
  }
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => Math.max(0, Math.min(options.length - 1, current + step)));
      return;
    }
    if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (activeCode) choose(activeCode);
      return;
    }
    if (event.key === 'Escape' && open) {
      // closes the list, not the checkout
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery('');
    }
  }
  function onType(text: string, fromSheet = false, nativeEvent?: Event) {
    // Autofill writes the whole name (or code) at once without typing
    const inputType = (nativeEvent as InputEvent | undefined)?.inputType;
    const typed = inputType && inputType !== 'insertReplacementText';
    const exact = matchCountry(text);
    if (exact && !typed && !fromSheet) {
      onChange(exact);
      setQuery('');
      setOpen(false);
      return;
    }
    setQuery(text);
    setActive(0);
    if (!open) setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    document.getElementById(`${id}-opt-${activeCode}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeCode, id]);

  const list = (
    <ul id={listId} role="listbox" aria-label={label} className={phone ? sheetListClass : popoverClass}>
      {options.length === 0 && <li className={noMatchClass}>{noMatch}</li>}
      {options.map((item, index) => (
        <li
          key={item.code}
          id={`${id}-opt-${item.code}`}
          role="option"
          aria-selected={item.code === code}
          data-active={item.code === activeCode || undefined}
          data-divider={item.divider || undefined}
          className={optionClass}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setActive(index)}
          onClick={() => choose(item.code)}
        >
          <span>{countryName(item.code)}</span>
          {item.code === code ? <CheckIcon size={15} /> : null}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={fieldClass}>
      <label htmlFor={id}>{label}</label>
      <div className={comboWrapClass}>
        <input
          ref={inputRef}
          id={id}
          name="country"
          type="text"
          role="combobox"
          autoComplete="country-name"
          aria-autocomplete="list"
          aria-expanded={open && !phone}
          aria-controls={listId}
          aria-activedescendant={open && !phone && activeCode ? `${id}-opt-${activeCode}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={open && !phone ? query : selectedName}
          placeholder={selectedName || searchPlaceholder}
          onFocus={() => {
            if (!phone) openList();
          }}
          onClick={() => {
            if (!open) openList();
          }}
          onChange={(event) => onType(event.target.value, false, event.nativeEvent)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (!phone) window.setTimeout(() => setOpen(false), 120);
          }}
          className={cx(inputClass, comboInputClass)}
        />
        <span className={comboChevronClass} aria-hidden="true">
          <ChevronIcon open={open} />
        </span>
        {open && !phone && list}
      </div>
      {open &&
        phone &&
        createPortal(
        <div className={sheetClass} role="dialog" aria-modal="true" aria-label={label}>
          <div className={sheetHeadClass}>
            <strong>{label}</strong>
            <button type="button" className={sheetCloseClass} onClick={() => setOpen(false)} aria-label={closeLabel}>
              <CloseIcon />
            </button>
          </div>
          <div className={sheetSearchClass}>
            <SearchIcon />
            <input
              ref={sheetInputRef}
              type="search"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeCode ? `${id}-opt-${activeCode}` : undefined}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => onType(event.target.value, true)}
              onKeyDown={onKeyDown}
              className={inputClass}
            />
          </div>
          {list}
        </div>,
          document.body
        )}
      {error ? (
        <span id={errorId} className={fieldErrorClass} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

const sheetRise = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
`;
const comboWrapClass = css`
  position: relative;
`;
const comboInputClass = css`
  padding-right: 44px;
  cursor: pointer;
  &::placeholder {
    color: ${T.ink};
  }
  &:focus::placeholder {
    color: #a2a6b4;
  }
`;
const comboChevronClass = css`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${T.muted};
  pointer-events: none;
  display: grid;
`;
const popoverClass = css`
  position: absolute;
  z-index: 5;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: #fff;
  border: 1px solid ${T.line};
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(20, 20, 40, 0.06), 0 18px 40px rgba(20, 20, 40, 0.16);
`;
const optionClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 16px;
  color: ${T.ink};
  cursor: pointer;
  &[data-active] {
    background: ${T.blueTint};
  }
  &[aria-selected='true'] {
    font-weight: 700;
  }
  &[data-divider] {
    margin-top: 6px;
    border-top: 1px solid ${T.line};
    border-radius: 0 0 10px 10px;
  }
`;
const noMatchClass = css`
  padding: 12px;
  color: ${T.muted};
  font-size: 15px;
`;
const sheetClass = css`
  position: fixed;
  inset: 0;
  z-index: 100001;
  display: flex;
  flex-direction: column;
  background: #fff;
  animation: ${sheetRise} 0.22s ${T.ease} both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
const sheetHeadClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 6px 18px;
  strong {
    font-size: 18px;
  }
`;
const sheetCloseClass = css`
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #f4f5f9;
  color: ${T.ink};
  cursor: pointer;
`;
const sheetSearchClass = css`
  position: relative;
  padding: 6px 14px 10px;
  > svg {
    position: absolute;
    left: 30px;
    top: 50%;
    transform: translateY(-60%);
    color: ${T.muted};
  }
  input {
    padding-left: 46px;
  }
`;
const sheetListClass = css`
  flex: 1;
  overflow-y: auto;
  margin: 0;
  padding: 0 8px calc(16px + env(safe-area-inset-bottom));
  list-style: none;
`;


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
  /* focused by code when a screen opens (the start point for keyboards
     and screen readers), not a control: no focus ring */
  &:focus {
    outline: none;
  }
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
  overflow-wrap: normal;
  word-break: normal;
  hyphens: none;
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
