import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { HeaderChip, HeaderMenu, type HeaderMenuItem } from '~/components/Build/HeaderChip';
import type { AddressText } from './text';

// The app-address screens as plain views (data in, callbacks out), so the
// containers own requests and the preview harness renders the same views.

export interface DomainIdeaView {
  domain: string;
  priceCents: number;
  breakdown: { registryCents: number; cardFeeCents: number; twinkleCents: number };
  approxKrw: number | null;
  best?: boolean;
}

export interface DnsRecordView {
  type: string;
  host: string;
  fullName: string;
  value: string;
  note: string | null;
}

export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export const krw = (won: number) => `₩${won.toLocaleString('en-US')}`;

const ink = '#16161f';
const muted = '#5d5d6e';
const line = 'rgba(22,22,31,0.1)';
const accent = '#4b3cf0';
const good = '#118a55';

export const panelClass = css`
  width: 100%;
  max-width: 34rem;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 1.6rem 1.4rem;
  border-radius: 1.4rem;
  background: #fff;
  color: ${ink};
  font-size: 1.1rem;
  line-height: 1.5;
  box-shadow: 0 10px 40px rgba(20, 20, 40, 0.08);
  word-break: keep-all;
  h2 {
    margin: 0 0 0.6rem;
    font-size: 1.5rem;
    line-height: 1.25;
  }
  p {
    margin: 0 0 0.9rem;
  }
  @media (max-width: 600px) {
    padding: 1.3rem 1.1rem;
    border-radius: 1.1rem;
  }
`;

const primary = css`
  appearance: none;
  border: 0;
  border-radius: 999px;
  padding: 0.85rem 1.3rem;
  font: inherit;
  font-size: 1.05rem;
  font-weight: 700;
  background: ${ink};
  color: #fff;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
const secondary = css`
  ${primary};
  background: #f0f0f6;
  color: ${ink};
`;
const quiet = css`
  appearance: none;
  border: 0;
  background: none;
  padding: 0.3rem 0;
  font: inherit;
  font-size: 1rem;
  color: ${accent};
  font-weight: 600;
  cursor: pointer;
  text-align: left;
`;
const row = css`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
`;
const field = css`
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid ${line};
  border-radius: 0.9rem;
  padding: 0.8rem 0.9rem;
  font: inherit;
  font-size: 1.05rem;
  background: #fafafd;
`;
const note = css`
  margin: 1rem 0;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: #f4f3ff;
  color: ${ink};
  font-size: 1rem;
  strong {
    display: block;
    margin-bottom: 0.2rem;
  }
`;
const fine = css`
  color: ${muted};
  font-size: 1rem;
`;

// The app's address as a chip in the Build header's strip; its menu holds
// every address action (open, copy, share, change, remove an own domain,
// get your own .com). A live own domain is the address the chip shows.
// "https://a.example/" -> "a.example" (keeps a dev port); never throws.
export function addressHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^[a-z]+:\/\//i, '').replace(/\/.*$/, '');
  }
}

export function AddressMenuView({
  t,
  primaryUrl,
  freeUrl,
  domains,
  ownerDomains,
  onRemoveDomain,
  removableSources = ['own'],
  canGetOwn,
  copied,
  onCopy,
  onShare,
  onGetOwn,
  onRename
}: {
  t: AddressText;
  // the address to share (the server's choice: a live bought domain, else
  // the free address); the chip shows it and Copy / Share hand it out
  primaryUrl: string;
  // the free lumine.app address
  freeUrl: string;
  // every live own domain (hostnames)
  domains: string[];
  // owner only: every own address with its status, and Remove
  ownerDomains?: Array<{ id: number; hostname: string; status: string; statusLine?: string; source?: string }>;
  onRemoveDomain?: (domainId: number) => void;
  // which kinds can be removed here (a bought address can't, yet)
  removableSources?: string[];
  canGetOwn: boolean;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onGetOwn: () => void;
  // owner only: change the free lumine.app address
  onRename?: () => void;
}) {
  const [confirming, setConfirming] = useState(0);
  // every address once (by hostname), the shared one first
  const links: Array<{ host: string; href: string }> = [];
  for (const href of [primaryUrl, ...domains.map((host) => `https://${host}/`), freeUrl]) {
    const host = addressHost(href);
    if (host && !links.some((link) => link.host === host)) links.push({ host, href });
  }
  const shownHost = links[0]?.host || addressHost(primaryUrl);
  const items: HeaderMenuItem[] = links.map(({ host, href }) => ({
    label: (
      <>
        <Icon icon="external-link-alt" />
        <span>{host}</span>
      </>
    ),
    href
  }));
  for (const domain of ownerDomains || []) {
    if (domain.status === 'live') continue;
    items.push({
      label: (
        <>
          <Icon icon="clock" />
          <span style={{ display: 'grid', gap: '0.2rem' }}>
            <span>{domain.hostname}</span>
            {domain.statusLine ? <small className={fine}>{domain.statusLine}</small> : null}
          </span>
        </>
      )
    });
  }
  items.push(
    { separator: true },
    {
      label: (
        <>
          <Icon icon="copy" />
          <span>{copied ? t.copied : t.copy}</span>
        </>
      ),
      keepOpen: true,
      onClick: onCopy
    },
    {
      label: (
        <>
          <Icon icon="share" />
          <span>{t.share}</span>
        </>
      ),
      onClick: onShare
    }
  );
  if (onRename) {
    items.push({
      label: (
        <>
          <Icon icon="pencil-alt" />
          <span>{t.change}</span>
        </>
      ),
      onClick: onRename
    });
  }
  if (onRemoveDomain) {
    for (const domain of ownerDomains || []) {
      if (!removableSources.includes(String(domain.source || 'own'))) continue;
      const armed = confirming === domain.id;
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span>{armed ? `${domain.hostname}: ${t.removeConfirm}` : `${t.remove} ${domain.hostname}`}</span>
          </>
        ),
        style: { color: armed ? '#b42318' : muted },
        keepOpen: !armed,
        onClick: () => {
          if (armed) {
            setConfirming(0);
            onRemoveDomain(domain.id);
          } else {
            setConfirming(domain.id);
          }
        }
      });
    }
  }
  if (canGetOwn) {
    items.push(
      { separator: true },
      {
        label: (
          <>
            <Icon icon="globe" />
            <span>{t.getOwn}</span>
          </>
        ),
        style: { color: accent, fontWeight: 800 },
        onClick: onGetOwn
      }
    );
  }
  return (
    <HeaderMenu
      items={items}
      label={shownHost}
      renderTrigger={({ onToggle, triggerProps }) => (
        <HeaderChip
          chip="address"
          icon="globe"
          tone="blue"
          label={shownHost}
          title={shownHost}
          caret
          menuTrigger={triggerProps}
          onClick={() => {
            setConfirming(0);
            onToggle();
          }}
        />
      )}
    />
  );
}

export function IntroView({
  t,
  freeHost,
  onFind,
  onHaveOne,
  ask,
  exampleDomain
}: {
  t: AddressText;
  freeHost: string;
  exampleDomain?: string;
  // absent while buying here is closed: connecting your own stays open
  onFind?: () => void;
  // absent while connecting your own is switched off
  onHaveOne?: () => void;
  ask?: React.ReactNode;
}) {
  const example = exampleDomain || `${freeHost.split('.')[0].replace(/-/g, '')}.com`;
  return (
    <div className={panelClass}>
      <h2>{t.introTitle}</h2>
      <div
        className={css`
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
          margin: 0.4rem 0 1.1rem;
          @media (max-width: 420px) {
            grid-template-columns: 1fr;
          }
        `}
        aria-hidden="true"
      >
        <div
          className={css`
            padding: 0.8rem;
            border-radius: 1rem;
            background: #effaf4;
          `}
        >
          <div style={{ fontSize: '0.95rem', color: good, fontWeight: 700 }}>{t.freeTag} ✓</div>
          <div style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{freeHost}</div>
        </div>
        <div
          className={css`
            padding: 0.8rem;
            border-radius: 1rem;
            background: #f4f3ff;
          `}
        >
          <div style={{ fontSize: '0.95rem', color: accent, fontWeight: 700 }}>{t.rentTag}</div>
          <div style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{example}</div>
        </div>
      </div>
      <p>
        <strong>{t.introFree(freeHost)}</strong>
      </p>
      <p>{t.introRent(example)}</p>
      <p>{onFind ? t.introChoice : onHaveOne ? t.introConnectOnly : t.notOpenYet}</p>
      <div className={row} style={{ marginTop: '1.2rem' }}>
        {onFind && (
          <button type="button" className={primary} onClick={onFind}>
            {t.findOne}
          </button>
        )}
        {onHaveOne && (
          <button type="button" className={onFind ? secondary : primary} onClick={onHaveOne}>
            {t.haveOne}
          </button>
        )}
      </div>
      {ask && <div style={{ marginTop: '1rem' }}>{ask}</div>}
    </div>
  );
}

export function PriceBreakdown({ t, idea, open }: { t: AddressText; idea: DomainIdeaView; open?: boolean }) {
  const [shown, setShown] = useState(Boolean(open));
  return (
    <div>
      <button type="button" className={quiet} style={{ fontSize: '0.95rem' }} onClick={() => setShown(!shown)} aria-expanded={shown}>
        {t.whatsInPrice} {shown ? '▴' : '▾'}
      </button>
      {shown && (
        <div className={fine} style={{ marginTop: '0.3rem', fontSize: '0.95rem' }}>
          <div>
            {t.breakdown({
              registry: usd(idea.breakdown.registryCents),
              card: usd(idea.breakdown.cardFeeCents),
              twinkle: usd(idea.breakdown.twinkleCents),
              total: usd(idea.priceCents)
            })}
          </div>
          <div style={{ marginTop: '0.3rem' }}>{t.breakdownNote}</div>
        </div>
      )}
    </div>
  );
}

export function FindView({
  t,
  query,
  ideas,
  loading,
  openBreakdownFor,
  onQuery,
  onSearch,
  onBuy,
  onUseOwn,
  onMoreIdeas,
  ask,
  showAdvanced = false
}: {
  t: AddressText;
  query: string;
  ideas: DomainIdeaView[];
  loading: boolean;
  openBreakdownFor?: string;
  onQuery: (value: string) => void;
  onSearch: () => void;
  onBuy: (idea: DomainIdeaView) => void;
  onUseOwn?: () => void;
  onMoreIdeas: () => void;
  ask?: React.ReactNode;
  showAdvanced?: boolean;
}) {
  const [advanced, setAdvanced] = useState(showAdvanced);
  return (
    <div className={panelClass}>
      <h2>{t.findTitle}</h2>
      <form
        className={row}
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <input className={field} value={query} placeholder={t.findPlaceholder} onChange={(event) => onQuery(event.target.value)} aria-label={t.findPlaceholder} />
        <button type="submit" className={primary} disabled={loading}>
          {t.search}
        </button>
      </form>
      <div style={{ marginTop: '1rem', display: 'grid', gap: '0.6rem' }}>
        {ideas.length === 0 && !loading && <p className={fine}>{t.noResults}</p>}
        {ideas.map((idea, index) => (
          <div
            key={idea.domain}
            className={css`
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 0.2rem 0.8rem;
              align-items: center;
              padding: 0.85rem 1rem;
              border: 1px solid ${index === 0 ? accent : line};
              border-radius: 1rem;
              background: ${index === 0 ? '#faf9ff' : '#fff'};
            `}
          >
            <div style={{ minWidth: 0 }}>
              {index === 0 && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: accent }}>{t.bestMatch}</div>}
              <div style={{ fontWeight: 700, fontSize: '1.15rem', overflowWrap: 'anywhere' }}>{idea.domain}</div>
              <div className={fine}>
                {t.perYear(usd(idea.priceCents))}
                {idea.approxKrw ? ` · ${t.approxKrw(krw(idea.approxKrw))}` : ''}
              </div>
            </div>
            <button type="button" className={primary} onClick={() => onBuy(idea)}>
              {t.buy}
            </button>
            <div style={{ gridColumn: '1 / -1' }}>
              <PriceBreakdown t={t} idea={idea} open={openBreakdownFor === idea.domain} />
            </div>
          </div>
        ))}
      </div>
      <div className={row} style={{ marginTop: '0.9rem', alignItems: 'center' }}>
        {ask}
        <button type="button" className={secondary} style={{ padding: '0.6rem 1.1rem' }} onClick={onMoreIdeas}>
          {t.moreIdeas}
        </button>
      </div>
      <div className={note}>
        <strong>{t.honestTitle}</strong>
        {t.honestBody}
        {onUseOwn && (
          <div style={{ marginTop: '0.6rem' }}>
            <button type="button" className={secondary} style={{ padding: '0.6rem 1.1rem' }} onClick={onUseOwn}>
              {t.useOwnLink}
            </button>
          </div>
        )}
      </div>
      {ideas[0] && <p className={fine} style={{ marginBottom: '0.3rem' }}>{t.oneYearLine}</p>}
      <p className={fine}>{t.privacyLine}</p>
      <button type="button" className={quiet} onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
        {t.advanced} {advanced ? '▴' : '▾'}
      </button>
      {advanced && (
        <ul className={fine} style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem' }}>
          {/* only what exists today: no renewals or transfers yet (one year, no auto-renew) */}
          <li>{t.otherEndings}</li>
        </ul>
      )}
    </div>
  );
}

export function ParentRequestView({
  t,
  idea,
  email,
  sending,
  onEmail,
  onSend,
  onBack
}: {
  t: AddressText;
  idea: DomainIdeaView;
  email: string;
  sending: boolean;
  onEmail: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
}) {
  return (
    <div className={panelClass}>
      <h2>{t.parentTitle}</h2>
      <p>{t.parentBody(idea.domain, usd(idea.priceCents))}</p>
      <PriceBreakdown t={t} idea={idea} />
      <div style={{ marginTop: '1rem' }} className={row}>
        <input className={field} type="email" value={email} placeholder={t.parentEmail} aria-label={t.parentEmail} onChange={(event) => onEmail(event.target.value)} />
      </div>
      <div className={row} style={{ marginTop: '1rem' }}>
        <button type="button" className={primary} disabled={sending || !email.includes('@')} onClick={onSend}>
          {t.sendToParent}
        </button>
        <button type="button" className={secondary} onClick={onBack}>
          {t.back}
        </button>
      </div>
    </div>
  );
}

export function MessageView({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  celebrate
}: {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  celebrate?: boolean;
}) {
  return (
    <div className={panelClass} style={{ textAlign: 'center' }}>
      {celebrate && (
        <div aria-hidden="true" style={{ fontSize: '2.6rem', marginBottom: '0.4rem' }}>
          🎉
        </div>
      )}
      <h2 style={{ overflowWrap: 'anywhere' }}>{title}</h2>
      <p>{body}</p>
      <div className={row} style={{ justifyContent: 'center', marginTop: '1rem' }}>
        <button type="button" className={primary} onClick={onPrimary}>
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button type="button" className={secondary} onClick={onSecondary}>
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function ConnectView({
  t,
  hostname,
  onHostname,
  onConnect,
  stage,
  providerName,
  providerSteps,
  domainConnectUrl,
  records,
  status,
  onCheck,
  ask,
  showRecords = false
}: {
  t: AddressText;
  hostname: string;
  onHostname: (value: string) => void;
  onConnect: () => void;
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
  const [advanced, setAdvanced] = useState(showRecords);
  const [copiedValue, setCopiedValue] = useState('');
  if (stage === 'enter') {
    return (
      <div className={panelClass}>
        <h2>{t.connectTitle}</h2>
        <form
          className={row}
          onSubmit={(event) => {
            event.preventDefault();
            onConnect();
          }}
        >
          <input className={field} value={hostname} placeholder={t.connectPlaceholder} aria-label={t.connectPlaceholder} onChange={(event) => onHostname(event.target.value)} />
          <button type="submit" className={primary}>
            {t.connectGo}
          </button>
        </form>
        {ask && <div style={{ marginTop: '1rem' }}>{ask}</div>}
      </div>
    );
  }
  const statusColor = status === 'connected' ? good : status === 'securing' ? accent : muted;
  const statusText =
    status === 'connected' ? t.connected : status === 'securing' ? t.securing : status === 'checking' ? t.checking : t.waiting;
  // The two records, with the first one's plain value up front.
  return (
    <div className={panelClass}>
      <h2 style={{ overflowWrap: 'anywhere' }}>{hostname}</h2>
      <div
        role="status"
        className={css`
          display: flex;
          gap: 0.6rem;
          align-items: center;
          padding: 0.8rem 1rem;
          border-radius: 1rem;
          background: ${status === 'connected' ? '#effaf4' : '#f6f6fa'};
          color: ${statusColor};
          font-weight: 600;
          margin-bottom: 1rem;
        `}
      >
        <span aria-hidden="true">{status === 'connected' ? '✓' : '●'}</span>
        <span>{statusText}</span>
      </div>
      {status !== 'connected' && domainConnectUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <a href={domainConnectUrl} className={primary} style={{ display: 'inline-block', textDecoration: 'none', background: accent }}>
            {t.connectAuto(providerName || 'your domain company')}
          </a>
          <p className={fine} style={{ marginTop: '0.5rem' }}>
            {t.connectAutoNote}
          </p>
        </div>
      )}
      {status !== 'connected' && !domainConnectUrl && (
        <>
          <p style={{ fontWeight: 700 }}>{providerName ? t.connectSteps(providerName) : t.connectStepsGeneric}</p>
          <ol style={{ margin: '0 0 1rem', paddingLeft: '1.3rem' }}>
            {providerSteps.map((step) => (
              <li key={step} style={{ marginBottom: '0.3rem' }}>
                {step}
              </li>
            ))}
          </ol>
          {records.map((record) => (
            <div
              key={record.type + record.host}
              className={css`
                display: grid;
                grid-template-columns: auto 1fr auto;
                grid-template-areas: 'type host copy' 'value value value';
                gap: 0.35rem 0.6rem;
                align-items: center;
                padding: 0.7rem 0.85rem;
                margin-bottom: 0.5rem;
                border: 1px solid ${line};
                border-radius: 0.9rem;
                font-size: 1rem;
              `}
            >
              <strong style={{ gridArea: 'type', padding: '0.1rem 0.5rem', borderRadius: 6, background: '#f0f0f6', fontSize: '0.9rem' }}>{record.type}</strong>
              <span className={fine} style={{ gridArea: 'host', fontSize: '0.95rem', overflowWrap: 'anywhere' }}>
                {t.recordHost}: <code>{record.host}</code>
              </span>
              <button
                type="button"
                className={secondary}
                style={{ gridArea: 'copy', padding: '0.45rem 0.8rem', fontSize: '0.95rem' }}
                onClick={() => {
                  void navigator.clipboard?.writeText(record.value).catch(() => {});
                  setCopiedValue(record.value);
                }}
              >
                {copiedValue === record.value ? t.copied : t.copyValue}
              </button>
              <code style={{ gridArea: 'value', wordBreak: 'break-all', fontSize: '0.98rem', background: '#fafafd', borderRadius: 8, padding: '0.45rem 0.6rem' }}>{record.value}</code>
            </div>
          ))}
        </>
      )}
      <div className={row} style={{ marginTop: '0.6rem', alignItems: 'center' }}>
        {status !== 'connected' && (
          <button type="button" className={secondary} onClick={onCheck}>
            {t.checkNow}
          </button>
        )}
        {ask}
      </div>
      {domainConnectUrl && status !== 'connected' && (
        <>
          <button type="button" className={quiet} style={{ marginTop: '0.8rem' }} onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
            {t.rawRecords} {advanced ? '▴' : '▾'}
          </button>
          {advanced &&
            records.map((record) => (
              <div key={record.type + record.host} className={fine} style={{ fontSize: '0.95rem' }}>
                {record.type} · {record.fullName} → <code>{record.value}</code>
              </div>
            ))}
        </>
      )}
    </div>
  );
}

export function RenameView({
  t,
  root,
  value,
  status,
  message,
  saving,
  onChange,
  onSave,
  onCancel
}: {
  t: AddressText;
  root: string;
  value: string;
  status: 'idle' | 'checking' | 'available' | 'taken';
  message: string;
  saving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        color: ${ink};
      `}
    >
      <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{t.renameTitle}</h2>
      <label
        className={css`
          display: flex;
          align-items: center;
          border: 1px solid ${line};
          border-radius: 0.8rem;
          padding: 0 0.8rem;
          font-size: 1.15rem;
          &:focus-within {
            border-color: ${ink};
          }
        `}
      >
        <input
          autoFocus
          value={value}
          maxLength={40}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(event) =>
            onChange(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' && status === 'available' && !saving) onSave();
          }}
          className={css`
            flex: 1;
            min-width: 0;
            border: 0;
            outline: none;
            padding: 0.7rem 0;
            font: inherit;
            background: transparent;
          `}
        />
        <span style={{ color: '#6b6b78', whiteSpace: 'nowrap' }}>.{root}</span>
      </label>
      <div className={fine} style={{ minHeight: '1.3em', color: status === 'available' ? good : status === 'taken' ? '#b42318' : undefined }}>
        {status === 'checking'
          ? t.renameChecking
          : status === 'available'
            ? t.renameAvailable
            : status === 'taken'
              ? message
              : t.renameHint}
      </div>
      <div className={fine}>{t.renameOldWorks}</div>
      <div className={row}>
        <button
          type="button"
          className={primary}
          disabled={status !== 'available' || saving}
          style={{ opacity: status !== 'available' || saving ? 0.5 : 1 }}
          onClick={onSave}
        >
          {saving ? t.renameSaving : t.renameSave}
        </button>
        <button type="button" className={secondary} onClick={onCancel}>
          {t.renameCancel}
        </button>
      </div>
    </div>
  );
}

// Countries most Twinkle members live in first; "Other" takes any ISO code.
const COUNTRIES: Array<[string, string]> = [
  ['KR', 'South Korea'],
  ['US', 'United States'],
  ['CA', 'Canada'],
  ['GB', 'United Kingdom'],
  ['AU', 'Australia'],
  ['NZ', 'New Zealand'],
  ['JP', 'Japan'],
  ['CN', 'China'],
  ['TW', 'Taiwan'],
  ['HK', 'Hong Kong'],
  ['SG', 'Singapore'],
  ['PH', 'Philippines'],
  ['VN', 'Vietnam'],
  ['TH', 'Thailand'],
  ['MY', 'Malaysia'],
  ['ID', 'Indonesia'],
  ['IN', 'India'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
  ['NL', 'Netherlands'],
  ['SE', 'Sweden'],
  ['BR', 'Brazil'],
  ['MX', 'Mexico']
];

export function CountrySelect({
  value,
  onChange,
  label,
  otherLabel = 'Other (type the 2-letter code)',
  className
}: {
  value: string;
  onChange: (country: string) => void;
  label: string;
  otherLabel?: string;
  className?: string;
}) {
  const known = COUNTRIES.some(([code]) => code === value.toUpperCase());
  const [other, setOther] = useState(!known && value !== '');
  return (
    <div style={{ display: 'flex', gap: '0.5rem', minWidth: 0 }}>
      <select
        className={className || field}
        aria-label={label}
        value={other ? 'OTHER' : value.toUpperCase()}
        onChange={(event) => {
          if (event.target.value === 'OTHER') {
            setOther(true);
            onChange('');
          } else {
            setOther(false);
            onChange(event.target.value);
          }
        }}
        style={{ flex: 1, minWidth: 0 }}
      >
        {COUNTRIES.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
        <option value="OTHER">{otherLabel}</option>
      </select>
      {other && (
        <input
          className={className || field}
          aria-label={otherLabel}
          value={value}
          maxLength={2}
          placeholder="FR"
          onChange={(event) => onChange(event.target.value.replace(/[^a-z]/gi, '').toUpperCase())}
          style={{ width: '4.5rem', flex: 'none', textTransform: 'uppercase' }}
        />
      )}
    </div>
  );
}

export interface OwnerDetails {
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

export function emptyOwnerDetails(country = 'KR'): OwnerDetails {
  return { firstName: '', lastName: '', email: '', phone: '', address1: '', city: '', state: '', zip: '', country };
}

export function ownerDetailsProblem(t: AddressText, details: OwnerDetails) {
  const required: Array<keyof OwnerDetails> = ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zip', 'country'];
  if (required.some((key) => !details[key].trim())) return t.fillAll;
  if (!/^\+[1-9][\d\s.\-()]{7,20}$/.test(details.phone.trim())) return t.phoneNeedsPlus;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) return t.fillAll;
  if (!/^[A-Za-z]{2}$/.test(details.country)) return t.fillAll;
  return '';
}

const labelled = css`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${muted};
`;

// Adults buying for their own app: they are the legal owner, so they type
// their own details here, then pay on Stripe. One price, its breakdown, the
// honest "cheaper elsewhere", nothing pre-ticked.
export function OwnerDetailsView({
  t,
  idea,
  details,
  agreed,
  renews,
  busy,
  problem,
  onDetails,
  onAgree,
  onPay,
  onBack
}: {
  t: AddressText;
  idea: DomainIdeaView;
  details: OwnerDetails;
  agreed: boolean;
  renews: boolean;
  busy: boolean;
  problem: string;
  onDetails: (details: OwnerDetails) => void;
  onAgree: (agreed: boolean) => void;
  onPay: () => void;
  onBack: () => void;
}) {
  const set = (key: keyof OwnerDetails) => (event: React.ChangeEvent<HTMLInputElement>) =>
    onDetails({ ...details, [key]: event.target.value });
  const input = (key: keyof OwnerDetails, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={labelled}>
      {label}
      <input className={field} value={details[key]} onChange={set(key)} {...props} />
    </label>
  );
  const missing = ownerDetailsProblem(t, details);
  return (
    <div className={panelClass}>
      <h2 style={{ overflowWrap: 'anywhere' }}>{t.ownerTitle(idea.domain)}</h2>
      <div
        className={css`
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 0.2rem 1rem;
          margin: 0.2rem 0 1rem;
          padding: 1rem 1.1rem;
          border: 1px solid ${accent};
          border-radius: 1rem;
          background: #faf9ff;
          @media (max-width: 520px) {
            grid-template-columns: 1fr;
          }
        `}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', overflowWrap: 'break-word' }}>{idea.domain}</div>
          <div className={fine}>{renews ? t.renewsLine(usd(idea.priceCents)) : t.oneYearLine}</div>
        </div>
        <div
          className={css`
            text-align: right;
            @media (max-width: 520px) {
              text-align: left;
              display: flex;
              align-items: baseline;
              gap: 0.5rem;
            }
          `}
        >
          <div style={{ fontWeight: 800, fontSize: '1.35rem' }}>{usd(idea.priceCents)}</div>
          {idea.approxKrw ? (
            <div className={fine} style={{ fontSize: '0.9rem' }}>
              {t.approxKrw(krw(idea.approxKrw))}
            </div>
          ) : null}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <PriceBreakdown t={t} idea={idea} />
        </div>
      </div>
      <p>{t.ownerIntro}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!missing && agreed && !busy) onPay();
        }}
      >
        <div
          className={css`
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.7rem;
            @media (max-width: 520px) {
              grid-template-columns: 1fr;
            }
          `}
        >
          {input('firstName', t.firstName, { autoComplete: 'given-name' })}
          {input('lastName', t.lastName, { autoComplete: 'family-name' })}
          {input('email', t.email, { type: 'email', autoComplete: 'email' })}
          <label className={labelled}>
            {t.phone}
            <input className={field} value={details.phone} onChange={set('phone')} type="tel" autoComplete="tel" placeholder="+82 10 1234 5678" />
            <span style={{ fontWeight: 400, fontSize: '0.88rem' }}>{t.phoneHint}</span>
          </label>
          <div style={{ gridColumn: '1 / -1' }}>{input('address1', t.address1, { autoComplete: 'street-address' })}</div>
          {input('city', t.city, { autoComplete: 'address-level2' })}
          {input('state', t.state, { autoComplete: 'address-level1' })}
          {input('zip', t.zip, { autoComplete: 'postal-code' })}
          <label className={labelled}>
            {t.country}
            <CountrySelect value={details.country} onChange={(country) => onDetails({ ...details, country })} label={t.country} otherLabel={t.countryOther} />
          </label>
        </div>
        <p className={fine} style={{ margin: '0.6rem 0 0' }}>
          {t.ownerPrivate}
        </p>
        <div className={note}>{t.cheaperElsewhere}</div>
        <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', cursor: 'pointer', margin: '0.2rem 0 1rem' }}>
          <input type="checkbox" checked={agreed} onChange={(event) => onAgree(event.target.checked)} style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.2rem', flex: 'none' }} />
          <span>{t.confirmOwner}</span>
        </label>
        {problem && (
          <div role="alert" style={{ color: '#b42318', marginBottom: '0.7rem' }}>
            {problem}
          </div>
        )}
        <div className={row} style={{ alignItems: 'center' }}>
          <button type="submit" className={primary} disabled={Boolean(missing) || !agreed || busy}>
            {busy ? t.opening : t.payButton(usd(idea.priceCents))}
          </button>
          <button type="button" className={secondary} onClick={onBack}>
            {t.back}
          </button>
        </div>
        <p className={fine} style={{ margin: '0.8rem 0 0' }}>
          {t.payNote}
        </p>
      </form>
    </div>
  );
}

export interface DomainOrderView {
  domain: string;
  priceCents: number;
  status: string;
  stage: 'paying' | 'setting_up' | 'support' | 'live' | 'refunding' | 'refunded' | 'stopped';
  failureReason: string | null;
}

// After Stripe: where the order is, in four plain steps.
export function OrderStatusView({
  t,
  order,
  onOpen,
  onTryAgain,
  onClose
}: {
  t: AddressText;
  order: DomainOrderView;
  onOpen: () => void;
  onTryAgain: () => void;
  onClose: () => void;
}) {
  if (order.stage === 'live') {
    return (
      <div className={panelClass} style={{ textAlign: 'center' }}>
        <div aria-hidden="true" style={{ fontSize: '2.6rem', marginBottom: '0.4rem' }}>
          🎉
        </div>
        <h2 style={{ overflowWrap: 'anywhere' }}>{t.liveTitle(order.domain)}</h2>
        <p>{t.liveBody}</p>
        <p className={fine} style={{ textAlign: 'left', background: '#fff8e6', borderRadius: '0.9rem', padding: '0.8rem 0.95rem', color: ink }}>
          {t.confirmEmailNote}
        </p>
        <div className={row} style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <button type="button" className={primary} onClick={onOpen}>
            {t.openIt}
          </button>
          <button type="button" className={secondary} onClick={onClose}>
            {t.done}
          </button>
        </div>
      </div>
    );
  }
  if (order.stage === 'refunded') {
    const why =
      order.failureReason === 'taken'
        ? t.whyTaken(order.domain)
        : order.failureReason === 'registrar_price_changed'
          ? t.whyPrice(order.domain)
          : t.whyOther(order.domain);
    return (
      <MessageView title={t.refundedTitle} body={t.refundedBody(order.domain, usd(order.priceCents), why)} primaryLabel={t.tryAgain} onPrimary={onTryAgain} secondaryLabel={t.close} onSecondary={onClose} />
    );
  }
  if (order.stage === 'refunding') {
    return <MessageView title={t.refundingTitle} body={t.refundingBody(usd(order.priceCents))} primaryLabel={t.close} onPrimary={onClose} />;
  }
  if (order.stage === 'support') {
    return <MessageView title={t.supportTitle(order.domain)} body={t.supportBody} primaryLabel={t.close} onPrimary={onClose} />;
  }
  if (order.stage !== 'setting_up') {
    // paying (Checkout left or cancelled) or stopped: nothing was charged
    return <MessageView title={t.notPaidTitle} body={t.notPaidBody} primaryLabel={t.tryAgain} onPrimary={onTryAgain} secondaryLabel={t.close} onSecondary={onClose} />;
  }
  const reached = order.status === 'registered' ? 2 : 1;
  const steps = [t.stepPaid, t.stepRegistered, t.stepSecure, t.stepLive];
  return (
    <div className={panelClass}>
      <h2 style={{ overflowWrap: 'anywhere' }}>{t.settingUpTitle(order.domain)}</h2>
      <ol
        aria-label={t.settingUpTitle(order.domain)}
        className={css`
          list-style: none;
          margin: 0.6rem 0 1rem;
          padding: 0;
          display: grid;
          gap: 0.55rem;
        `}
      >
        {steps.map((label, index) => {
          const done = index < reached;
          const current = index === reached;
          return (
            <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontWeight: current ? 700 : 500, color: done || current ? ink : muted }}>
              <span
                aria-hidden="true"
                className={css`
                  width: 1.6rem;
                  height: 1.6rem;
                  border-radius: 50%;
                  display: grid;
                  place-items: center;
                  flex: none;
                  font-size: 0.9rem;
                  font-weight: 800;
                  color: #fff;
                  background: ${done ? good : current ? accent : '#d9d9e3'};
                  ${current
                    ? `animation: lumineOrderPulse 1.6s ease-in-out infinite;
                  @keyframes lumineOrderPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(75,60,240,0.35); } 50% { box-shadow: 0 0 0 7px rgba(75,60,240,0); } }
                  @media (prefers-reduced-motion: reduce) { animation: none; }`
                    : ''}
                `}
              >
                {done ? '✓' : index + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
      <p>{t.settingUpBody}</p>
      <p className={fine} style={{ background: '#fff8e6', borderRadius: '0.9rem', padding: '0.8rem 0.95rem', color: ink }}>
        {t.confirmEmailNote}
      </p>
      <button type="button" className={secondary} onClick={onClose}>
        {t.close}
      </button>
    </div>
  );
}
