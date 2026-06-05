import React from 'react';
import { css, cx } from '@emotion/css';
import FavoriteButton, {
  type BuildFavoriteChange
} from '~/components/Build/FavoriteButton';
import PreviewFrame from '~/components/Build/PreviewFrame';
import Icon from '~/components/Icon';
import ViewCount from '~/components/ViewCount';
import { BuildForkersTrigger } from '~/components/Modals/BuildForkersModal';
import { BuildTeamMembersTrigger } from '~/components/Modals/BuildTeamMembersModal';
import {
  formatBuildCollaboratorCount,
  formatBuildForkCount,
  normalizeBuildCollaborationMode
} from '~/helpers/buildProjectHelpers';
import {
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from '~/helpers/buildRelationshipHelpers';
import { useBuildCardData } from './useBuildCardData';

const miniCardClass = css`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8rem, 14rem);
  gap: 0.85rem;
  align-items: stretch;
  width: 100%;

  &.no-preview {
    grid-template-columns: minmax(0, 1fr);
  }

  &.compact-embed {
    position: relative;
    box-sizing: border-box;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    border-radius: inherit;
    height: 100%;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
    padding: 0.58rem 0.62rem;
    background: #fff;
    container-type: inline-size;
  }

  &.compact-embed.has-thumbnail-background {
    background: transparent;
  }

  &.compact-embed.clickable-embed {
    cursor: pointer;
  }

  &.compact-embed.clickable-embed:focus-visible {
    outline: 2px solid #418ceb;
    outline-offset: 3px;
  }

  &.thumb-embed {
    place-items: center;
    padding: 0;
  }

  &.compact-embed .build-mini-card__copy {
    height: 100%;
    gap: 0.35rem;
  }

  &.compact-embed .build-mini-card__main {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    flex-direction: column;
    justify-content: center;
    gap: 0.34rem;
  }

  &.compact-embed .build-mini-card__badge {
    gap: 0.36rem;
    padding: 0.22rem 0.58rem;
    border-color: rgba(65, 140, 235, 0.46);
    background: #fff;
    font-size: 1rem;
    line-height: 1.05;
  }

  &.compact-embed .build-mini-card__title {
    display: -webkit-box;
    overflow: hidden;
    font-size: 1.35rem;
    line-height: 1.12;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  &.compact-embed .build-mini-card__title-text {
    display: inline;
    padding: 0.02rem 0.24rem;
    border-radius: 0.35rem;
    background: #fff;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }

  &.compact-embed .build-mini-card__description {
    width: fit-content;
    max-width: 100%;
    padding: 0.06rem 0.24rem;
    border-radius: 0.35rem;
    background: rgba(255, 255, 255, 0.94);
    color: #1f2937;
    font-size: 1.1rem;
    line-height: 1.12;
    -webkit-line-clamp: 1;
  }

  &.compact-embed .build-mini-card__status-row.compact {
    gap: 0.22rem;
    margin-top: auto;
    overflow: hidden;
  }

  &.compact-embed .build-mini-card__status.compact {
    gap: 0.22rem;
    min-width: 0;
    padding: 0.12rem 0.36rem;
    border-color: rgba(100, 116, 139, 0.34);
    background: #fff;
    font-size: 1rem;
    line-height: 1.05;
  }

  @container (max-width: 19rem) {
    &.compact-embed .build-mini-card__main {
      gap: 0.3rem;
    }

    &.compact-embed .build-mini-card__badge {
      gap: 0.28rem;
      padding: 0.16rem 0.48rem;
    }

    &.compact-embed .build-mini-card__title {
      font-size: 1.12rem;
      line-height: 1.08;
    }
  }
`;

const copyClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const compactBackgroundClass = css`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  border: 0;
  border-radius: inherit;
  pointer-events: none;

  img {
    opacity: 0.8;
  }
`;

const compactCopyClass = css`
  position: relative;
  z-index: 3;
`;

const thumbIconClass = css`
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.55rem;
  height: 2.55rem;
  border: 1px solid rgba(65, 140, 235, 0.36);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #1d4ed8;
  font-size: 1.28rem;
  box-shadow: 0 0.08rem 0.25rem rgba(15, 23, 42, 0.12);
`;

const badgeClass = css`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  padding: 0.28rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(65, 140, 235, 0.3);
  background: rgba(65, 140, 235, 0.12);
  color: #1d4ed8;
  font-size: 1rem;
  font-weight: 900;
`;

const titleClass = css`
  margin: 0;
  min-width: 0;
  color: #050505;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1.12;
  overflow-wrap: anywhere;
`;

const descriptionClass = css`
  margin: 0;
  color: rgba(31, 41, 55, 0.76);
  font-size: 1.1rem;
  line-height: 1.3;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const statusRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const statusClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.22rem 0.48rem;
  border-radius: 999px;
  border: 1px solid rgba(100, 116, 139, 0.24);
  background: rgba(100, 116, 139, 0.1);
  color: #334155;
  font-size: 1rem;
  font-weight: 900;
  white-space: nowrap;
`;

const actionRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: auto;
`;

const actionButtonClass = css`
  appearance: none;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0 0.72rem;
  border: 1px solid rgba(65, 140, 235, 0.32);
  border-radius: 7px;
  background: #050505;
  color: #fff;
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;

  &.secondary {
    background: rgba(65, 140, 235, 0.12);
    color: #1d4ed8;
  }
`;

const previewClass = css`
  width: 100%;
  min-height: 7rem;
  aspect-ratio: 16 / 10;
`;

const previewButtonClass = css`
  appearance: none;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #418ceb;
    outline-offset: 3px;
    border-radius: 0.65rem;
  }
`;

const clickablePreviewClass = css`
  height: 100%;
`;

export default function BuildMiniCard({
  build: buildInput,
  cacheInput = true,
  className,
  interactiveBadges = true,
  showActions = false,
  showFavoriteAction = false,
  style,
  variant = 'default',
  onBuild,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onOpen
}: {
  build: Record<string, any>;
  cacheInput?: boolean;
  className?: string;
  interactiveBadges?: boolean;
  showActions?: boolean;
  showFavoriteAction?: boolean;
  style?: React.CSSProperties;
  variant?: 'compactEmbed' | 'default' | 'thumbEmbed';
  onBuild?: (build: any) => void;
  onFavoriteChange?: (build: any, change: BuildFavoriteChange) => void;
  onFavoriteError?: (
    build: any,
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onFavoriteStart?: (
    build: any,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onOpen?: (build: any) => void;
}) {
  const build = useBuildCardData(buildInput, { cacheInput });
  if (!build) return null;
  const buildId = build.id;
  const viewCount = build.viewCount;
  const isThumbEmbed = variant === 'thumbEmbed';
  const isCompactEmbed = variant === 'compactEmbed' || isThumbEmbed;
  const displayTitle = getBuildDisplayTitle(build) || 'Lumine App';
  const thumbnailUrl = String(build.thumbnailUrl || '').trim();
  const showCompactBackground = Boolean(isCompactEmbed && thumbnailUrl);
  const relationshipLabels = getBuildRelationshipLabels(build);
  const collaborationMode = normalizeBuildCollaborationMode(
    build.collaborationMode
  );
  const showOpenSource = collaborationMode === 'open_source';
  const forkCount = Math.max(0, Math.floor(Number(build.forkCount) || 0));
  const collaboratorCount = Math.max(
    0,
    Math.floor(Number(build.collaboratorCount) || 0)
  );
  const serverCountFields = Array.isArray(build.serverCountFields)
    ? build.serverCountFields.map((field) => String(field))
    : [];
  const showVisitBadge = serverCountFields.includes('viewCount');
  const hasStatusBadges = Boolean(
    relationshipLabels.length > 0 ||
      showOpenSource ||
      showVisitBadge ||
      collaboratorCount > 0
  );
  const shouldShowCompactStatusBadges = Boolean(
    isCompactEmbed && !isThumbEmbed && hasStatusBadges
  );
  const compactOpenEnabled = Boolean(isCompactEmbed && !showActions && onOpen);

  return (
    <div
      className={cx(
        miniCardClass,
        (!thumbnailUrl || isCompactEmbed) && 'no-preview',
        isCompactEmbed && 'compact-embed',
        showCompactBackground && 'has-thumbnail-background',
        compactOpenEnabled && 'clickable-embed',
        isThumbEmbed && 'thumb-embed',
        className
      )}
      style={style}
      role={compactOpenEnabled ? 'button' : undefined}
      tabIndex={compactOpenEnabled ? 0 : undefined}
      aria-label={compactOpenEnabled ? `Open ${displayTitle}` : undefined}
      onClick={compactOpenEnabled ? handleCompactOpenClick : undefined}
      onKeyDown={compactOpenEnabled ? handleCompactOpenKeyDown : undefined}
    >
      {showCompactBackground ? (
        <PreviewFrame
          className={compactBackgroundClass}
          thumbnailUrl={thumbnailUrl}
          alt=""
          fallbackLabel=""
        />
      ) : null}
      {isThumbEmbed ? (
        <span className={thumbIconClass} aria-label="Lumine App">
          <Icon icon="rocket" />
        </span>
      ) : (
        <div
          className={cx(
            copyClass,
            'build-mini-card__copy',
            isCompactEmbed && compactCopyClass
          )}
        >
          <div className="build-mini-card__main">
            <div className={cx(badgeClass, 'build-mini-card__badge')}>
              <Icon icon="rocket" />
              <span>Lumine App</span>
            </div>
            <h3 className={cx(titleClass, 'build-mini-card__title')}>
              <span className="build-mini-card__title-text">
                {displayTitle}
              </span>
            </h3>
            {build.description ? (
              <p
                className={cx(descriptionClass, 'build-mini-card__description')}
              >
                {String(build.description)}
              </p>
            ) : null}
          </div>
          {isCompactEmbed ? null : renderStatusBadges()}
          {shouldShowCompactStatusBadges ? renderStatusBadges(true) : null}
          {showActions ? (
            <div className={actionRowClass}>
              {onBuild ? (
                <button
                  type="button"
                  className={cx(actionButtonClass, 'secondary')}
                  onClick={handleBuildClick}
                >
                  <Icon icon="wrench" />
                  Build
                </button>
              ) : null}
              <button
                type="button"
                className={actionButtonClass}
                onClick={handleOpenClick}
              >
                <Icon icon="external-link-alt" />
                Open app
              </button>
              {showFavoriteAction ? (
                <FavoriteButton
                  buildId={build.id}
                  favorited={Boolean(build.isFavorited)}
                  size="sm"
                  onChange={(change) => onFavoriteChange?.(build, change)}
                  onError={(error, params) =>
                    onFavoriteError?.(build, error, params)
                  }
                  onStart={(params) => onFavoriteStart?.(build, params)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      {thumbnailUrl && !isCompactEmbed ? (
        onOpen ? (
          <button
            type="button"
            className={previewButtonClass}
            onClick={handleOpenClick}
            aria-label={`Open ${displayTitle}`}
          >
            <PreviewFrame
              className={cx(previewClass, clickablePreviewClass)}
              thumbnailUrl={thumbnailUrl}
              alt={`${displayTitle} screenshot`}
              ariaLabel={`${displayTitle} preview`}
            />
          </button>
        ) : (
          <PreviewFrame
            className={previewClass}
            thumbnailUrl={thumbnailUrl}
            alt={`${displayTitle} screenshot`}
            ariaLabel={`${displayTitle} preview`}
          />
        )
      ) : null}
    </div>
  );

  function handleBuildClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onBuild?.(build);
  }

  function handleOpenClick(event: React.MouseEvent<HTMLButtonElement>) {
    handleOpenEvent(event);
  }

  function handleCompactOpenClick(event: React.MouseEvent<HTMLDivElement>) {
    handleOpenEvent(event);
  }

  function handleCompactOpenKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    handleOpenEvent(event);
  }

  function handleOpenEvent(event: React.SyntheticEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    onOpen?.(build);
  }

  function renderStatusBadges(compact = false) {
    const statusBadgeClass = cx(
      statusClass,
      'build-mini-card__status',
      compact && 'compact'
    );
    return (
      <div
        className={cx(
          statusRowClass,
          'build-mini-card__status-row',
          compact && 'compact'
        )}
      >
        {relationshipLabels.map((label) => (
          <span key={label} className={statusBadgeClass}>
            <Icon icon={label === 'fork' ? 'code-branch' : 'users'} />
            {label === 'fork' ? 'Forked' : 'Branch'}
          </span>
        ))}
        {showOpenSource ? (
          <span className={statusBadgeClass}>
            <Icon icon="code-branch" />
            Open Source
          </span>
        ) : null}
        {showOpenSource ? (
          compact || !interactiveBadges ? (
            <span className={statusBadgeClass}>
              <Icon icon="code-branch" />
              {formatBuildForkCount(forkCount)}
            </span>
          ) : (
            <BuildForkersTrigger
              buildId={buildId}
              className={statusBadgeClass}
              disabled={forkCount <= 0}
            >
              <Icon icon="code-branch" />
              {formatBuildForkCount(forkCount)}
            </BuildForkersTrigger>
          )
        ) : null}
        {showVisitBadge ? (
          <ViewCount
            count={viewCount}
            unit="visits"
            className={statusBadgeClass}
          />
        ) : null}
        {collaboratorCount > 0 ? (
          compact || !interactiveBadges ? (
            <span className={statusBadgeClass}>
              <Icon icon="users" />
              {formatBuildCollaboratorCount(collaboratorCount)}
            </span>
          ) : (
            <BuildTeamMembersTrigger
              buildId={buildId}
              className={statusBadgeClass}
            >
              <Icon icon="users" />
              {formatBuildCollaboratorCount(collaboratorCount)}
            </BuildTeamMembersTrigger>
          )
        ) : null}
      </div>
    );
  }
}
