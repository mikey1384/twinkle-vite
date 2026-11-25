import React, { useState } from 'react';
import { css } from '@emotion/css';
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

export function AddressCardView({
  t,
  url,
  domains,
  isOwner,
  copied,
  onCopy,
  onShare,
  onGetOwn,
  getOwnLabel,
  onRename
}: {
  t: AddressText;
  url: string;
  domains: string[];
  isOwner: boolean;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onGetOwn: () => void;
  getOwnLabel?: string;
  // owner only: change the free lumine.app address
  onRename?: () => void;
}) {
  const host = url.replace(/^https:\/\//, '');
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
        padding: 1rem 1.1rem;
        border: 1px solid ${line};
        border-radius: 1.1rem;
        background: #fff;
        color: ${ink};
        font-size: 1.05rem;
      `}
    >
      <div className={fine}>{t.liveAt}</div>
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        `}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={css`
            font-size: 1.2rem;
            font-weight: 700;
            color: ${ink};
            text-decoration: none;
            overflow-wrap: anywhere;
          `}
        >
          <span style={{ color: good, marginRight: '0.4rem' }}>●</span>
          {host}
        </a>
        <div className={row} style={{ marginLeft: 'auto' }}>
          <button type="button" className={secondary} style={{ padding: '0.55rem 1rem' }} onClick={onCopy}>
            {copied ? t.copied : t.copy}
          </button>
          <button type="button" className={secondary} style={{ padding: '0.55rem 1rem' }} onClick={onShare}>
            {t.share}
          </button>
          {onRename && (
            <button type="button" className={secondary} style={{ padding: '0.55rem 1rem' }} onClick={onRename}>
              {t.change}
            </button>
          )}
        </div>
      </div>
      {domains.length > 0 && (
        <div className={fine}>
          {t.alsoAt}:{' '}
          {domains.map((domain) => (
            <a key={domain} href={`https://${domain}`} target="_blank" rel="noopener noreferrer" style={{ color: ink, fontWeight: 600, marginRight: '0.6rem' }}>
              {domain} ✓
            </a>
          ))}
        </div>
      )}
      {isOwner && (
        <button
          type="button"
          className={css`
            ${primary};
            align-self: flex-start;
            background: ${accent};
          `}
          onClick={onGetOwn}
        >
          {getOwnLabel || t.getOwn}
        </button>
      )}
    </div>
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
  onFind: () => void;
  onHaveOne: () => void;
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
      <p>{t.introChoice}</p>
      <div className={row} style={{ marginTop: '1.2rem' }}>
        <button type="button" className={primary} onClick={onFind}>
          {t.findOne}
        </button>
        <button type="button" className={secondary} onClick={onHaveOne}>
          {t.haveOne}
        </button>
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
  onUseOwn: () => void;
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
        <div style={{ marginTop: '0.6rem' }}>
          <button type="button" className={secondary} style={{ padding: '0.6rem 1.1rem' }} onClick={onUseOwn}>
            {t.useOwnLink}
          </button>
        </div>
      </div>
      {ideas[0] && <p className={fine} style={{ marginBottom: '0.3rem' }}>{t.renewLine(usd(ideas[0].priceCents))}</p>}
      <p className={fine}>{t.privacyLine}</p>
      <button type="button" className={quiet} onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
        {t.advanced} {advanced ? '▴' : '▾'}
      </button>
      {advanced && (
        <ul className={fine} style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem' }}>
          <li>{t.otherEndings}</li>
          <li>{t.autoRenewOff}</li>
          <li>{t.transferOut}</li>
          <li>{t.renewalHistory}</li>
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
