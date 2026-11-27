import React, { useId } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';

// A live domain on the app and who owns it. A domain stays its buyer's when
// the app changes hands (twinkle-api domainOwnership.ts, ruling 11-26).
export interface TradeBuildDomain {
  hostname: string;
  ownerUserId?: number;
  ownerUsername?: string | null;
}

export interface TradeBuild {
  id: number;
  userId?: number;
  title: string;
  thumbnailUrl?: string | null;
  isPublic?: boolean | number;
  creatorId?: number;
  creatorUsername?: string;
  unavailable?: boolean;
  domains?: TradeBuildDomain[];
}

export function appDomainNote(domain: TradeBuildDomain, viewerId: number) {
  if (domain.ownerUserId && domain.ownerUserId === viewerId) {
    return `${domain.hostname} stays yours. It keeps pointing to this app until you remove it.`;
  }
  return `This app uses ${domain.hostname}, owned by ${
    domain.ownerUsername ? `@${domain.ownerUsername}` : 'its buyer'
  }, who can remove it at any time.`;
}

const listClass = css`
  display: grid;
  gap: 0.8rem;
  width: 100%;
  font-size: 1.3rem;
  > div {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid var(--ui-border);
    border-radius: 0.8rem;
    padding: 1rem;
    min-width: 0;
  }
  > div[data-selected='true'] {
    border-color: var(--ui-border-strong, #94b7e0);
    background: var(--ui-soft-bg, #f3f7fd);
  }
  &[data-embedded='true'] > div {
    position: static;
    border: 0;
    padding: 0;
  }
  .app-action,
  .app-remove {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }
  .app-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    min-width: 0;
    color: inherit;
    text-decoration: none;
    border-radius: 0.5rem;
  }
  a.app-open-link {
    color: inherit;
    text-decoration: none;
    border-radius: 0.3rem;
  }
  a.app-open-link::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 0.8rem;
  }
  a.app-open-link:hover strong {
    text-decoration: underline;
  }
  a.app-open-link:focus-visible {
    outline: 2px solid var(--ui-border-strong, #315b91);
    outline-offset: 0.3rem;
  }
  img {
    width: 5rem;
    height: 4rem;
    object-fit: cover;
    border-radius: 0.5rem;
    flex-shrink: 0;
  }
  .app-title {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  small {
    display: block;
    font-size: 1.1rem;
    margin-top: 0.3rem;
  }
  .app-domain {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    color: var(--ui-text-muted, #536178);
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  .app-domain svg {
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
`;

export default function TradeBuilds({
  builds,
  onRemove,
  renderAction,
  selectedIds = [],
  embedded = false
}: {
  builds: TradeBuild[];
  onRemove?: (id: number) => void;
  renderAction?: (build: TradeBuild) => React.ReactNode;
  selectedIds?: number[];
  embedded?: boolean;
}) {
  const viewerId = Number(useKeyContext((v) => v.myState.userId) || 0);
  const idPrefix = useId();
  return (
    <div className={listClass} data-embedded={embedded}>
      {builds.map((build) => {
        const canOpen = !build.unavailable && !!build.isPublic;
        const domains = build.domains || [];
        const domainNoteIds = domains
          .map((_, index) => `${idPrefix}-domain-${build.id}-${index}`)
          .join(' ');
        return (
          <div key={build.id} data-selected={selectedIds.includes(build.id)}>
            <div className="app-preview">
              {build.thumbnailUrl ? (
                <img src={build.thumbnailUrl} alt="" />
              ) : (
                <Icon icon="laptop-code" />
              )}
              <div className="app-title">
                {canOpen ? (
                  <a
                    className="app-open-link"
                    href={`/app/${build.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${build.title}`}
                    aria-describedby={domainNoteIds || undefined}
                    onClick={(event: React.MouseEvent) =>
                      event.stopPropagation()
                    }
                  >
                    <strong>{build.title}</strong>
                  </a>
                ) : (
                  <strong>{build.title}</strong>
                )}
                {build.creatorUsername && (
                  <small>Created by {build.creatorUsername}</small>
                )}
                {!build.isPublic && !build.unavailable && (
                  <small>Private app · workspace included</small>
                )}
                {domains.map((domain, index) => (
                  <small
                    className="app-domain"
                    id={`${idPrefix}-domain-${build.id}-${index}`}
                    key={domain.hostname}
                  >
                    <Icon icon="globe" />
                    <span>{appDomainNote(domain, viewerId)}</span>
                  </small>
                ))}
              </div>
            </div>
            {renderAction && (
              <div className="app-action">{renderAction(build)}</div>
            )}
            {onRemove && (
              <Button
                className="app-remove"
                variant="ghost"
                aria-label={`Remove ${build.title}`}
                onClick={() => onRemove(build.id)}
              >
                <Icon icon="xmark" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AppOwnershipNotice() {
  return (
    <details
      style={{
        width: '100%',
        margin: '1.2rem 0',
        fontSize: '1.2rem',
        lineHeight: 1.6,
        color: '#536178'
      }}
    >
      <summary style={{ cursor: 'pointer' }}>
        What comes with app ownership?
      </summary>
      <p style={{ margin: '0.6rem 0 0' }}>
        Apps change owners when sent or when a trade is accepted. The new owner
        gets the workspace, files and Lumine conversation, and can edit and
        publish updates. Creator credit and player progress stay with the app.
        Its current published version keeps working; draft approvals must be
        requested again.
      </p>
    </details>
  );
}
