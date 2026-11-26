import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import ModalFooter from '~/components/Modal/Footer';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { HeaderChip, HeaderMenu, type HeaderMenuItem } from '~/components/Build/HeaderChip';
import type { AddressText } from './text';

// The app address's own views: the header chip with its menu, and the
// small rename dialog (a standard Modal). The own-web-address checkout lives
// in ./checkout (re-exported here for the existing imports).
export * from './checkout/model';
export {
  ConnectView,
  FindView,
  IntroView,
  LiveView,
  MessageView,
  OrderStatusView,
  OwnerDetailsView,
  ParentRequestView,
  orderStatusTitle
} from './checkout/steps';

const muted = '#5d5d6e';
const accent = '#4b3cf0';

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
function FlowFooter({ children }: { children: React.ReactNode }) {
  return <ModalFooter>{children}</ModalFooter>;
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
