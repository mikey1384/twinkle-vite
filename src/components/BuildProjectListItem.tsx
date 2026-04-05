import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { borderRadius } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
const buildForkUiEnabled = false;

const buildCardClass = css`
  display: block;
  cursor: pointer;
  padding: 1.4rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-left: 4px solid #418CEB;
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
  margin-top: 0.85rem;
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
}

export default function BuildProjectListItem({
  build,
  to,
  navigationState,
  isOwner = false,
  onAddDescription,
  onDelete
}: {
  build: BuildProjectListItemData;
  to?: string;
  navigationState?: Record<string, any>;
  isOwner?: boolean;
  onAddDescription?: (build: BuildProjectListItemData) => void;
  onDelete?: (build: BuildProjectListItemData) => void;
}) {
  const navigate = useNavigate();
  const visibilityTone = getVisibilityTone(build.isPublic);
  const description = build.description?.trim() || '';
  const detailsActionLabel = isOwner ? 'Edit Details' : '';
  const targetPath = to || `/build/${build.id}`;

  return (
    <div
      role="link"
      tabIndex={0}
      className={buildCardClass}
      style={{ borderLeftColor: visibilityTone.border }}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
    >
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
  );

  function handleNavigate() {
    navigate(targetPath, navigationState ? { state: navigationState } : undefined);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNavigate();
    }
  }

  function handleAddDescriptionClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (onAddDescription) {
      onAddDescription(build);
      return;
    }
    navigate(targetPath, navigationState ? { state: navigationState } : undefined);
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
