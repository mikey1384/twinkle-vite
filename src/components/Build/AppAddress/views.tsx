import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import ModalFooter from '~/components/Modal/Footer';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { HeaderChip, HeaderMenu, type HeaderMenuItem } from '~/components/Build/HeaderChip';
import type { AddressText } from './text';

// The app-address screens as plain views (data in, callbacks out), so the
// containers own requests and the preview harness renders the same views.
// The flow's steps are bodies of the site's standard Modal (see below); the
// card styles here (panelClass) are for the parent's consent page.

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

// ---------------------------------------------------------------------------
// The "own web address" flow. Each step is the body of the site's standard
// Modal (AppAddress gives it the step's title) with its actions in the
// standard ModalFooter: readable modal type, no card inside the modal.

const flowClass = css`
  width: 100%;
  color: ${Color.black()};
  font-size: 1.5rem;
  line-height: 1.6;
  word-break: keep-all;
  overflow-wrap: break-word;
  p {
    margin: 0 0 1.2rem;
  }
  > :last-child {
    margin-bottom: 0;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.45rem;
  }
`;
const quietText = css`
  color: ${Color.darkGray()};
  font-size: 1.35rem;
  line-height: 1.55;
`;
const calloutClass = css`
  margin: 1.4rem 0;
  padding: 1.1rem 1.3rem;
  border-radius: ${borderRadius};
  background: ${Color.logoBlue(0.07)};
  font-size: 1.4rem;
  line-height: 1.55;
  strong {
    display: block;
    margin-bottom: 0.2rem;
  }
`;
const noticeClass = css`
  ${calloutClass};
  background: ${Color.orange(0.12)};
`;
const errorClass = css`
  margin: 0 0 1.2rem;
  color: ${Color.rose()};
  font-weight: 700;
`;
// rows separated by lines (results, addresses, records): a list, not cards
const rowsClass = css`
  margin: 0 0 1.4rem;
  border-top: 1px solid var(--ui-border);
  > * {
    padding: 1.2rem 0;
    border-bottom: 1px solid var(--ui-border);
  }
`;
const linkButtonClass = css`
  appearance: none;
  border: 0;
  background: none;
  padding: 0.3rem 0;
  font: inherit;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${Color.logoBlue()};
  cursor: pointer;
  text-align: left;
  &:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
  }
`;
const fieldLabelClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${Color.darkGray()};
`;
const inlineFormClass = css`
  display: flex;
  gap: 0.8rem;
  align-items: stretch;
  margin: 0 0 1.4rem;
  > :first-child {
    flex: 1;
    min-width: 0;
  }
`;
const domainNameClass = css`
  font-weight: 800;
  font-size: 1.65rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
`;
const selectClass = css`
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 1rem;
  line-height: 2rem;
  font: inherit;
  font-size: 1.6rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: calc(16 * var(--px));
  }
`;

function FlowFooter({ children }: { children: React.ReactNode }) {
  return <ModalFooter>{children}</ModalFooter>;
}

export function IntroView({
  t,
  freeHost,
  onFind,
  onHaveOne,
  onClose,
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
  onClose?: () => void;
  ask?: React.ReactNode;
}) {
  const example = exampleDomain || `${freeHost.split('.')[0].replace(/-/g, '')}.com`;
  const option = (tag: string, tagColor: string, host: string, line: string) => (
    <div
      className={css`
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.2rem 1rem;
        align-items: baseline;
      `}
    >
      <div className={domainNameClass}>{host}</div>
      <div style={{ color: tagColor, fontWeight: 800, fontSize: '1.3rem', whiteSpace: 'nowrap' }}>{tag}</div>
      <div className={quietText} style={{ gridColumn: '1 / -1' }}>
        {line}
      </div>
    </div>
  );
  return (
    <div className={flowClass}>
      <div className={rowsClass}>
        {option(`${t.freeTag} ✓`, Color.green(), freeHost, t.introFree(freeHost))}
        {option(t.rentTag, Color.logoBlue(), example, t.introRent(example))}
      </div>
      <p>{onFind ? t.introChoice : onHaveOne ? t.introConnectOnly : t.notOpenYet}</p>
      {ask}
      <FlowFooter>
        {onHaveOne && (
          <Button variant={onFind ? 'ghost' : 'solid'} color="logoBlue" onClick={onHaveOne}>
            {t.haveOne}
          </Button>
        )}
        {onFind && (
          <Button color="logoBlue" onClick={onFind}>
            {t.findOne}
          </Button>
        )}
        {!onFind && !onHaveOne && onClose && (
          <Button color="logoBlue" onClick={onClose}>
            {t.close}
          </Button>
        )}
      </FlowFooter>
    </div>
  );
}

export function PriceBreakdown({ t, idea, open }: { t: AddressText; idea: DomainIdeaView; open?: boolean }) {
  const [shown, setShown] = useState(Boolean(open));
  return (
    <div>
      <button type="button" className={linkButtonClass} onClick={() => setShown(!shown)} aria-expanded={shown}>
        {t.whatsInPrice} {shown ? '▴' : '▾'}
      </button>
      {shown && (
        <div className={quietText} style={{ marginTop: '0.4rem' }}>
          <div>
            {t.breakdown({
              registry: usd(idea.breakdown.registryCents),
              card: usd(idea.breakdown.cardFeeCents),
              twinkle: usd(idea.breakdown.twinkleCents),
              total: usd(idea.priceCents)
            })}
          </div>
          <div style={{ marginTop: '0.4rem' }}>{t.breakdownNote}</div>
        </div>
      )}
    </div>
  );
}

function priceLine(t: AddressText, idea: DomainIdeaView) {
  return `${t.perYear(usd(idea.priceCents))}${idea.approxKrw ? ` · ${t.approxKrw(krw(idea.approxKrw))}` : ''}`;
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
  onClose,
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
  onClose?: () => void;
  ask?: React.ReactNode;
  showAdvanced?: boolean;
}) {
  const [advanced, setAdvanced] = useState(showAdvanced);
  return (
    <div className={flowClass}>
      <form
        className={inlineFormClass}
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <Input value={query} placeholder={t.findPlaceholder} onChange={onQuery} aria-label={t.findPlaceholder} />
        <Button color="logoBlue" loading={loading} onClick={onSearch}>
          {t.search}
        </Button>
      </form>
      {ideas.length === 0 && !loading && <p className={quietText}>{t.noResults}</p>}
      {ideas.length > 0 && (
        <div className={rowsClass}>
          {ideas.map((idea, index) => (
            <div
              key={idea.domain}
              className={css`
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 0.3rem 1.2rem;
                align-items: center;
              `}
            >
              <div style={{ minWidth: 0 }}>
                {index === 0 && (
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: Color.logoBlue(), textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t.bestMatch}
                  </div>
                )}
                <div className={domainNameClass}>{idea.domain}</div>
                <div className={quietText}>{priceLine(t, idea)}</div>
              </div>
              <Button color="logoBlue" variant={index === 0 ? 'solid' : 'soft'} onClick={() => onBuy(idea)}>
                {t.buy}
              </Button>
              <div style={{ gridColumn: '1 / -1' }}>
                <PriceBreakdown t={t} idea={idea} open={openBreakdownFor === idea.domain} />
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
        <Button variant="soft" color="logoBlue" onClick={onMoreIdeas}>
          {t.moreIdeas}
        </Button>
        {ask}
      </div>
      <div className={calloutClass}>
        <strong>{t.honestTitle}</strong>
        {t.honestBody}
        {onUseOwn && (
          <div style={{ marginTop: '0.5rem' }}>
            <button type="button" className={linkButtonClass} onClick={onUseOwn}>
              {t.useOwnLink} →
            </button>
          </div>
        )}
      </div>
      {ideas[0] && <p className={quietText} style={{ marginBottom: '0.4rem' }}>{t.oneYearLine}</p>}
      <p className={quietText} style={{ marginBottom: '0.6rem' }}>
        {t.privacyLine}
      </p>
      <button type="button" className={linkButtonClass} onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
        {t.advanced} {advanced ? '▴' : '▾'}
      </button>
      {advanced && (
        <ul className={quietText} style={{ margin: '0.4rem 0 0', paddingLeft: '1.4rem' }}>
          {/* only what exists today: no renewals or transfers yet (one year, no auto-renew) */}
          <li>{t.otherEndings}</li>
        </ul>
      )}
      {onClose && (
        <FlowFooter>
          <Button variant="ghost" onClick={onClose}>
            {t.close}
          </Button>
        </FlowFooter>
      )}
    </div>
  );
}

// The chosen name and its one price, at the top of the buy steps.
function ChosenName({ t, idea, renews }: { t: AddressText; idea: DomainIdeaView; renews?: boolean }) {
  return (
    <div className={rowsClass}>
      <div
        className={css`
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.2rem 1.2rem;
          align-items: baseline;
        `}
      >
        <div className={domainNameClass}>{idea.domain}</div>
        <div style={{ fontWeight: 800, fontSize: '1.8rem', whiteSpace: 'nowrap' }}>{usd(idea.priceCents)}</div>
        <div className={quietText}>{renews ? t.renewsLine(usd(idea.priceCents)) : t.oneYearLine}</div>
        <div className={quietText} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          {idea.approxKrw ? t.approxKrw(krw(idea.approxKrw)) : ''}
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <PriceBreakdown t={t} idea={idea} />
        </div>
      </div>
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
  const ready = !sending && email.includes('@');
  return (
    <div className={flowClass}>
      <ChosenName t={t} idea={idea} />
      <p>{t.parentBody(idea.domain, usd(idea.priceCents))}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) onSend();
        }}
      >
        <label className={fieldLabelClass}>
          {t.parentEmail}
          <Input type="email" value={email} placeholder={t.parentEmail} onChange={onEmail} />
        </label>
      </form>
      <FlowFooter>
        <Button variant="ghost" onClick={onBack}>
          {t.back}
        </Button>
        <Button color="logoBlue" loading={sending} disabled={!ready} onClick={onSend}>
          {t.sendToParent}
        </Button>
      </FlowFooter>
    </div>
  );
}

// A result or a stop in the flow (live, sent, refunded, nothing charged...).
// The Modal's header carries the title.
export function MessageView({
  body,
  note,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  celebrate
}: {
  body: string;
  // an extra line under the body (e.g. "check your email")
  note?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  celebrate?: boolean;
}) {
  return (
    <div className={flowClass}>
      {celebrate && (
        <div aria-hidden="true" style={{ fontSize: '4rem', lineHeight: 1, margin: '0.4rem 0 1.2rem', textAlign: 'center' }}>
          🎉
        </div>
      )}
      <p style={celebrate ? { textAlign: 'center' } : undefined}>{body}</p>
      {note && <div className={noticeClass}>{note}</div>}
      <FlowFooter>
        {secondaryLabel && onSecondary && (
          <Button variant="ghost" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
        <Button color="logoBlue" onClick={onPrimary}>
          {primaryLabel}
        </Button>
      </FlowFooter>
    </div>
  );
}

export function connectViewTitle(t: AddressText, stage: 'enter' | 'setup', hostname: string) {
  return stage === 'enter' ? t.connectTitle : hostname;
}

export function ConnectView({
  t,
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
}: {
  t: AddressText;
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
  const [advanced, setAdvanced] = useState(showRecords);
  const [copiedValue, setCopiedValue] = useState('');
  if (stage === 'enter') {
    return (
      <div className={flowClass}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onConnect();
          }}
        >
          <label className={fieldLabelClass}>
            {t.connectPlaceholder}
            <Input value={hostname} placeholder={t.connectPlaceholder} onChange={onHostname} autoFocus />
          </label>
        </form>
        {ask && <div style={{ marginTop: '1.4rem' }}>{ask}</div>}
        <FlowFooter>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              {t.close}
            </Button>
          )}
          <Button color="logoBlue" disabled={!hostname.trim()} onClick={onConnect}>
            {t.connectGo}
          </Button>
        </FlowFooter>
      </div>
    );
  }
  const connected = status === 'connected';
  const statusColor = connected ? Color.green() : status === 'securing' ? Color.logoBlue() : Color.darkGray();
  const statusText = connected ? t.connected : status === 'securing' ? t.securing : status === 'checking' ? t.checking : t.waiting;
  return (
    <div className={flowClass}>
      <div
        role="status"
        style={{ display: 'flex', gap: '0.7rem', alignItems: 'baseline', color: statusColor, fontWeight: 700, fontSize: '1.4rem', margin: '0 0 1.4rem' }}
      >
        <span aria-hidden="true" style={{ flex: 'none' }}>
          {connected ? '✓' : '●'}
        </span>
        <span>{statusText}</span>
      </div>
      {!connected && domainConnectUrl && (
        <>
          <p style={{ marginBottom: '0.6rem' }}>
            <Button color="logoBlue" onClick={() => window.location.assign(domainConnectUrl)}>
              {t.connectAuto(providerName || 'your domain company')}
            </Button>
          </p>
          <p className={quietText}>{t.connectAutoNote}</p>
        </>
      )}
      {!connected && !domainConnectUrl && (
        <>
          <p style={{ fontWeight: 700, marginBottom: '0.6rem' }}>{providerName ? t.connectSteps(providerName) : t.connectStepsGeneric}</p>
          <ol style={{ margin: '0 0 1.4rem', paddingLeft: '1.6rem' }}>
            {providerSteps.map((step) => (
              <li key={step} style={{ marginBottom: '0.4rem' }}>
                {step}
              </li>
            ))}
          </ol>
          <div className={rowsClass}>
            {records.map((record) => (
              <div
                key={record.type + record.host}
                className={css`
                  display: grid;
                  grid-template-columns: auto minmax(0, 1fr) auto;
                  grid-template-areas: 'type host copy' 'value value value';
                  gap: 0.5rem 0.8rem;
                  align-items: center;
                `}
              >
                <strong style={{ gridArea: 'type', padding: '0.1rem 0.6rem', borderRadius: 6, background: Color.logoBlue(0.1), color: Color.logoBlue(), fontSize: '1.25rem' }}>
                  {record.type}
                </strong>
                <span className={quietText} style={{ gridArea: 'host', overflowWrap: 'anywhere' }}>
                  {t.recordHost}: <code>{record.host}</code>
                </span>
                <span style={{ gridArea: 'copy' }}>
                  <Button
                    variant="soft"
                    color="logoBlue"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard?.writeText(record.value).catch(() => {});
                      setCopiedValue(record.value);
                    }}
                  >
                    {copiedValue === record.value ? t.copied : t.copyValue}
                  </Button>
                </span>
                <code style={{ gridArea: 'value', wordBreak: 'break-all', fontSize: '1.35rem', background: Color.wellGray(0.5), borderRadius: 6, padding: '0.5rem 0.7rem' }}>
                  {record.value}
                </code>
              </div>
            ))}
          </div>
        </>
      )}
      {ask}
      {domainConnectUrl && !connected && (
        <div style={{ marginTop: '1rem' }}>
          <button type="button" className={linkButtonClass} onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
            {t.rawRecords} {advanced ? '▴' : '▾'}
          </button>
          {advanced &&
            records.map((record) => (
              <div key={record.type + record.host} className={quietText} style={{ overflowWrap: 'anywhere' }}>
                {record.type} · {record.fullName} → <code>{record.value}</code>
              </div>
            ))}
        </div>
      )}
      <FlowFooter>
        {onClose && (
          <Button variant={connected ? 'solid' : 'ghost'} color="logoBlue" onClick={onClose}>
            {connected ? t.done : t.close}
          </Button>
        )}
        {!connected && (
          <Button color="logoBlue" loading={status === 'checking'} onClick={onCheck}>
            {t.checkNow}
          </Button>
        )}
      </FlowFooter>
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
  const canSave = status === 'available' && !saving;
  return (
    <div className={flowClass}>
      <label
        className={css`
          display: flex;
          align-items: center;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          padding: 0 1rem;
          font-size: 1.7rem;
          background: #fff;
          &:focus-within {
            border-color: var(--ui-border-strong);
          }
          @media (max-width: ${mobileMaxWidth}) {
            font-size: calc(16 * var(--px));
          }
        `}
      >
        <input
          autoFocus
          aria-label={t.renameTitle}
          value={value}
          maxLength={40}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(event) => onChange(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canSave) onSave();
          }}
          className={css`
            flex: 1;
            min-width: 0;
            border: 0;
            outline: none;
            padding: 1rem 0;
            line-height: 2rem;
            font: inherit;
            background: transparent;
          `}
        />
        <span style={{ color: Color.darkGray(), whiteSpace: 'nowrap' }}>.{root}</span>
      </label>
      <p
        className={quietText}
        style={{
          minHeight: '1.5em',
          margin: '0.6rem 0 1rem',
          fontWeight: status === 'available' || status === 'taken' ? 700 : undefined,
          color: status === 'available' ? Color.green() : status === 'taken' ? Color.rose() : undefined
        }}
      >
        {status === 'checking' ? t.renameChecking : status === 'available' ? t.renameAvailable : status === 'taken' ? message : t.renameHint}
      </p>
      <p className={quietText}>{t.renameOldWorks}</p>
      <FlowFooter>
        <Button variant="ghost" onClick={onCancel}>
          {t.renameCancel}
        </Button>
        <Button color="logoBlue" loading={saving} disabled={!canSave} onClick={onSave}>
          {t.renameSave}
        </Button>
      </FlowFooter>
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
  const input = (
    key: keyof OwnerDetails,
    label: string,
    props: { type?: 'text' | 'email' | 'tel'; autoComplete?: string; placeholder?: string } = {}
  ) => (
    <label className={fieldLabelClass}>
      {label}
      <Input value={details[key]} onChange={(value: string) => onDetails({ ...details, [key]: value })} {...props} />
    </label>
  );
  const missing = ownerDetailsProblem(t, details);
  const canPay = !missing && agreed && !busy;
  return (
    <div className={flowClass}>
      <ChosenName t={t} idea={idea} renews={renews} />
      <p>{t.ownerIntro}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canPay) onPay();
        }}
      >
        <div
          className={css`
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.2rem 1.2rem;
            @media (max-width: ${mobileMaxWidth}) {
              grid-template-columns: 1fr;
            }
          `}
        >
          {input('firstName', t.firstName, { autoComplete: 'given-name' })}
          {input('lastName', t.lastName, { autoComplete: 'family-name' })}
          {input('email', t.email, { type: 'email', autoComplete: 'email' })}
          <label className={fieldLabelClass}>
            {t.phone}
            <Input value={details.phone} onChange={(phone: string) => onDetails({ ...details, phone })} type="tel" autoComplete="tel" placeholder="+82 10 1234 5678" />
            <span className={quietText} style={{ fontWeight: 400, fontSize: '1.25rem' }}>
              {t.phoneHint}
            </span>
          </label>
          <div style={{ gridColumn: '1 / -1' }}>{input('address1', t.address1, { autoComplete: 'street-address' })}</div>
          {input('city', t.city, { autoComplete: 'address-level2' })}
          {input('state', t.state, { autoComplete: 'address-level1' })}
          {input('zip', t.zip, { autoComplete: 'postal-code' })}
          <label className={fieldLabelClass}>
            {t.country}
            <CountrySelect
              value={details.country}
              onChange={(country) => onDetails({ ...details, country })}
              label={t.country}
              otherLabel={t.countryOther}
              className={selectClass}
            />
          </label>
        </div>
        <p className={quietText} style={{ margin: '1rem 0 0' }}>
          {t.ownerPrivate}
        </p>
        <div className={calloutClass}>{t.cheaperElsewhere}</div>
        <label style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', cursor: 'pointer', margin: '0 0 1.2rem' }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => onAgree(event.target.checked)}
            style={{ width: '1.8rem', height: '1.8rem', marginTop: '0.2rem', flex: 'none' }}
          />
          <span>{t.confirmOwner}</span>
        </label>
        {problem && (
          <div role="alert" className={errorClass}>
            {problem}
          </div>
        )}
        <p className={quietText}>{t.payNote}</p>
      </form>
      <FlowFooter>
        <Button variant="ghost" onClick={onBack}>
          {t.back}
        </Button>
        <Button color="logoBlue" loading={busy} disabled={!canPay} onClick={onPay}>
          {busy ? t.opening : t.payButton(usd(idea.priceCents))}
        </Button>
      </FlowFooter>
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

// The Modal title for an order's current stage.
export function orderStatusTitle(t: AddressText, order: DomainOrderView) {
  if (order.stage === 'live') return t.liveTitle(order.domain);
  if (order.stage === 'refunded') return t.refundedTitle;
  if (order.stage === 'refunding') return t.refundingTitle;
  if (order.stage === 'support') return t.supportTitle(order.domain);
  if (order.stage !== 'setting_up') return t.notPaidTitle;
  return t.settingUpTitle(order.domain);
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
      <MessageView
        celebrate
        body={t.liveBody}
        note={t.confirmEmailNote}
        primaryLabel={t.openIt}
        onPrimary={onOpen}
        secondaryLabel={t.done}
        onSecondary={onClose}
      />
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
      <MessageView body={t.refundedBody(order.domain, usd(order.priceCents), why)} primaryLabel={t.tryAgain} onPrimary={onTryAgain} secondaryLabel={t.close} onSecondary={onClose} />
    );
  }
  if (order.stage === 'refunding') {
    return <MessageView body={t.refundingBody(usd(order.priceCents))} primaryLabel={t.close} onPrimary={onClose} />;
  }
  if (order.stage === 'support') {
    return <MessageView body={t.supportBody} primaryLabel={t.close} onPrimary={onClose} />;
  }
  if (order.stage !== 'setting_up') {
    // paying (Checkout left or cancelled) or stopped: nothing was charged
    return <MessageView body={t.notPaidBody} primaryLabel={t.tryAgain} onPrimary={onTryAgain} secondaryLabel={t.close} onSecondary={onClose} />;
  }
  const reached = order.status === 'registered' ? 2 : 1;
  const steps = [t.stepPaid, t.stepRegistered, t.stepSecure, t.stepLive];
  return (
    <div className={flowClass}>
      <ol
        aria-label={t.settingUpTitle(order.domain)}
        className={css`
          list-style: none;
          margin: 0 0 1.6rem;
          padding: 0;
          display: grid;
          gap: 1rem;
        `}
      >
        {steps.map((label, index) => {
          const done = index < reached;
          const current = index === reached;
          return (
            <li
              key={label}
              aria-current={current ? 'step' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: current ? 800 : 600, color: done || current ? Color.black() : Color.gray() }}
            >
              <span
                aria-hidden="true"
                className={css`
                  width: 2.4rem;
                  height: 2.4rem;
                  border-radius: 50%;
                  display: grid;
                  place-items: center;
                  flex: none;
                  font-size: 1.25rem;
                  font-weight: 800;
                  color: #fff;
                  background: ${done ? Color.green() : current ? Color.logoBlue() : Color.borderGray()};
                  ${current
                    ? `animation: lumineOrderPulse 1.6s ease-in-out infinite;
                  @keyframes lumineOrderPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(65,140,235,0.4); } 50% { box-shadow: 0 0 0 8px rgba(65,140,235,0); } }
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
      <div className={noticeClass}>{t.confirmEmailNote}</div>
      <FlowFooter>
        <Button color="logoBlue" onClick={onClose}>
          {t.close}
        </Button>
      </FlowFooter>
    </div>
  );
}
