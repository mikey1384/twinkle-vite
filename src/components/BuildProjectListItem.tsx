import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { borderRadius } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useThemedCardVars } from '~/theme/useThemedCardVars';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
const buildForkUiEnabled = false;

const buildCardClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 34%);
  gap: 1.2rem;
  align-items: stretch;
  cursor: pointer;
  padding: 1.1rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-left: 4px solid #418ceb;
  border-radius: ${borderRadius};
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    border-color: rgba(65, 140, 235, 0.28);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    text-decoration: none;
  }
  &:focus-visible,
  &:active {
    text-decoration: none;
  }
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const buildCardMainClass = css`
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0.25rem 0.1rem 0.15rem 0.15rem;
`;

const buildCardHeaderClass = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const buildHeaderAsideClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
`;

const buildTitleClass = css`
  margin: 0 0 0.45rem 0;
  color: var(--chat-text);
  font-size: 1.7rem;
  font-weight: 900;
  font-family: ${displayFontFamily};
  line-height: 1.15;
  overflow-wrap: anywhere;
`;

const buildDescriptionClass = css`
  margin: 0;
  color: var(--chat-text);
  opacity: 0.72;
  font-size: 1.35rem;
  line-height: 1.45;
`;

const detailsButtonClass = css`
  border: 0;
  background: transparent;
  padding: 0;
  margin-top: 0.3rem;
  display: inline-flex;
  color: var(--chat-text);
  opacity: 0.7;
  font-size: 1.35rem;
  line-height: 1.45;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dashed;
  &:hover {
    opacity: 1;
  }
`;

const buildUpdatedClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.1rem;
  color: var(--chat-text);
  opacity: 0.65;
  white-space: nowrap;
`;

const buildDeleteButtonClass = css`
  border: 1px solid rgba(220, 38, 38, 0.18);
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  border-radius: 999px;
  padding: 0.52rem 0.9rem;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  &:hover {
    background: rgba(220, 38, 38, 0.12);
    border-color: rgba(220, 38, 38, 0.28);
    transform: translateY(-1px);
  }
`;

const buildTagRowClass = css`
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const buildTagClass = css`
  font-size: 1rem;
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0.02em;
`;

const buildMetaRowClass = css`
  margin-top: auto;
  padding-top: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const buildMetaItemClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 1.1rem;
  color: var(--chat-text);
  opacity: 0.72;
`;

const buildPreviewClass = css`
  position: relative;
  align-self: stretch;
  min-height: 12rem;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid rgba(20, 35, 60, 0.14);
  border-radius: calc(${borderRadius} - 2px);
  background:
    linear-gradient(135deg, rgba(65, 140, 235, 0.12), rgba(41, 171, 135, 0.14)),
    #111827;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 700px) {
    order: -1;
    min-height: 13rem;
  }
`;

const buildPreviewToolbarClass = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.38rem;
  height: 1.9rem;
  padding: 0 0.75rem;
  background: rgba(255, 255, 255, 0.88);

  span {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: rgba(50, 65, 90, 0.42);
  }
`;

const buildPreviewFallbackClass = css`
  height: 100%;
  min-height: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.4rem 1rem 1rem;
  color: rgba(255, 255, 255, 0.88);
  text-align: center;

  svg {
    font-size: 2.4rem;
  }

  span {
    font-size: 1.05rem;
    font-weight: 800;
  }
`;

const buildPreviewLabelClass = css`
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  max-width: calc(100% - 1.5rem);
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.76);
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
`;

interface BuildTone {
  background: string;
  border: string;
  color: string;
}

export interface BuildProjectListItemData {
  id: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: number;
  createdAt: number;
  hasCode?: boolean;
  viewCount?: number;
  publishedAt?: number | null;
  sourceBuildId?: number | null;
  thumbnailUrl?: string | null;
}

export default function BuildProjectListItem({
  build,
  to,
  navigationState,
  isOwner = false,
  themeName,
  onAddDescription,
  onDelete
}: {
  build: BuildProjectListItemData;
  to?: string;
  navigationState?: Record<string, any>;
  isOwner?: boolean;
  themeName?: string;
  onAddDescription?: (build: BuildProjectListItemData) => void;
  onDelete?: (build: BuildProjectListItemData) => void;
}) {
  const navigate = useNavigate();
  const { accentColor: buildAccentColor } = useThemedCardVars({
    role: 'sectionPanel',
    themeName
  });
  const visibilityTone = getVisibilityTone(build.isPublic);
  const description = build.description?.trim() || '';
  const detailsActionLabel = isOwner ? 'Edit Details' : '';
  const targetPath = to || `/build/${build.id}`;
  const thumbnailUrl = String(build.thumbnailUrl || '').trim();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnailShown = Boolean(thumbnailUrl) && !thumbnailFailed;

  useEffect(() => {
    setThumbnailFailed(false);
  }, [thumbnailUrl]);

  return (
    <div
      role="link"
      tabIndex={0}
      className={buildCardClass}
      style={{ borderLeftColor: buildAccentColor }}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
    >
      <div className={buildCardMainClass}>
        <div className={buildCardHeaderClass}>
          <div>
            <h3 className={buildTitleClass}>{build.title}</h3>
            {(description || detailsActionLabel) &&
              (description ? (
                <>
                  <p className={buildDescriptionClass}>{description}</p>
                  {isOwner && onAddDescription && (
                    <button
                      type="button"
                      className={detailsButtonClass}
                      onClick={handleAddDescriptionClick}
                    >
                      {detailsActionLabel}
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className={detailsButtonClass}
                  onClick={handleAddDescriptionClick}
                >
                  {detailsActionLabel}
                </button>
              ))}
          </div>
          <div className={buildHeaderAsideClass}>
            <span className={buildUpdatedClass}>
              <Icon icon="clock" />
              Updated {formatRelativeTime(build.updatedAt)}
            </span>
            {isOwner && onDelete && (
              <button
                type="button"
                className={buildDeleteButtonClass}
                onClick={handleDeleteClick}
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <div className={buildTagRowClass}>
          <span className={buildTagClass} style={toTagStyle(visibilityTone)}>
            {build.isPublic ? 'Public' : 'Private'}
          </span>
          {buildForkUiEnabled && !!build.sourceBuildId && (
            <span
              className={buildTagClass}
              style={toTagStyle({
                background: 'rgba(147, 51, 234, 0.14)',
                border: 'rgba(147, 51, 234, 0.36)',
                color: '#6b21a8'
              })}
            >
              Forked
            </span>
          )}
        </div>
        <div className={buildMetaRowClass}>
          <span className={buildMetaItemClass}>
            <Icon icon="clock-rotate-left" />
            Created {formatRelativeTime(build.createdAt)}
          </span>
          <span className={buildMetaItemClass}>
            <Icon icon="eye" />
            {formatViewLabel(build.viewCount)}
          </span>
          {build.isPublic && build.publishedAt ? (
            <span className={buildMetaItemClass}>
              <Icon icon="globe" />
              Published {formatRelativeTime(build.publishedAt)}
            </span>
          ) : (
            <span className={buildMetaItemClass}>
              <Icon icon="lock" />
              Not published yet
            </span>
          )}
        </div>
      </div>
      <div className={buildPreviewClass} aria-label={`${build.title} preview`}>
        <div className={buildPreviewToolbarClass} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {thumbnailShown ? (
          <img
            src={thumbnailUrl}
            alt={`${build.title} screenshot`}
            onError={() => setThumbnailFailed(true)}
          />
        ) : (
          <div className={buildPreviewFallbackClass}>
            <Icon icon="laptop-code" />
            <span>Preview not captured</span>
          </div>
        )}
        <div className={buildPreviewLabelClass}>
          <Icon icon="external-link-alt" />
          <span>Open app</span>
        </div>
      </div>
    </div>
  );

  function handleNavigate() {
    navigate(
      targetPath,
      navigationState ? { state: navigationState } : undefined
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate();
    }
  }

  function handleAddDescriptionClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (onAddDescription) {
      onAddDescription(build);
      return;
    }
    navigate(
      targetPath,
      navigationState ? { state: navigationState } : undefined
    );
  }

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onDelete?.(build);
  }
}

function formatRelativeTime(timestamp?: number | null) {
  if (!timestamp || Number.isNaN(Number(timestamp))) return 'just now';
  return timeSince(Number(timestamp));
}

function formatViewLabel(viewCount?: number | null) {
  const views = Number.isFinite(Number(viewCount)) ? Number(viewCount) : 0;
  if (views <= 0) return 'No views yet';
  if (views === 1) return '1 view';
  return `${views} views`;
}

function getVisibilityTone(isPublic: boolean): BuildTone {
  if (isPublic) {
    return {
      background: 'rgba(65, 140, 235, 0.14)',
      border: 'rgba(65, 140, 235, 0.34)',
      color: '#1d4ed8'
    };
  }
  return {
    background: 'rgba(100, 116, 139, 0.14)',
    border: 'rgba(100, 116, 139, 0.3)',
    color: '#334155'
  };
}

function toTagStyle(tone: BuildTone): React.CSSProperties {
  return {
    background: tone.background,
    borderColor: tone.border,
    color: tone.color
  };
}
