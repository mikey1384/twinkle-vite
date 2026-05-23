import React from 'react';
import { css, cx } from '@emotion/css';
import FavoriteButton, { type BuildFavoriteChange } from '~/components/Build/FavoriteButton';
import PreviewFrame from '~/components/Build/PreviewFrame';
import Icon from '~/components/Icon';
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
`;

const copyClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

export default function BuildMiniCard({
  build: buildInput,
  className,
  interactiveBadges = true,
  showActions = false,
  showFavoriteAction = false,
  onBuild,
  onFavoriteChange,
  onFavoriteError,
  onFavoriteStart,
  onOpen
}: {
  build: Record<string, any>;
  className?: string;
  interactiveBadges?: boolean;
  showActions?: boolean;
  showFavoriteAction?: boolean;
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
  const build = useBuildCardData(buildInput);
  if (!build) return null;
  const displayTitle = getBuildDisplayTitle(build) || 'Lumine App';
  const thumbnailUrl = String(build.thumbnailUrl || '').trim();
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

  return (
    <div className={cx(miniCardClass, !thumbnailUrl && 'no-preview', className)}>
      <div className={copyClass}>
        <div className={badgeClass}>
          <Icon icon="rocket" />
          <span>Lumine App</span>
        </div>
        <h3 className={titleClass}>{displayTitle}</h3>
        {build.description ? (
          <p className={descriptionClass}>{String(build.description)}</p>
        ) : null}
        <div className={statusRowClass}>
          {relationshipLabels.map((label) => (
            <span key={label} className={statusClass}>
              <Icon icon={label === 'fork' ? 'code-branch' : 'users'} />
              {label === 'fork' ? 'Forked' : 'Branch'}
            </span>
          ))}
          {showOpenSource ? (
            <span className={statusClass}>
              <Icon icon="code-branch" />
              Open Source
            </span>
          ) : null}
          {showOpenSource ? (
            interactiveBadges ? (
              <BuildForkersTrigger
                buildId={build.id}
                className={statusClass}
                disabled={forkCount <= 0}
              >
                <Icon icon="code-branch" />
                {formatBuildForkCount(forkCount)}
              </BuildForkersTrigger>
            ) : (
              <span className={statusClass}>
                <Icon icon="code-branch" />
                {formatBuildForkCount(forkCount)}
              </span>
            )
          ) : null}
          {collaboratorCount > 0 ? (
            interactiveBadges ? (
              <BuildTeamMembersTrigger
                buildId={build.id}
                className={statusClass}
              >
                <Icon icon="users" />
                {formatBuildCollaboratorCount(collaboratorCount)}
              </BuildTeamMembersTrigger>
            ) : (
              <span className={statusClass}>
                <Icon icon="users" />
                {formatBuildCollaboratorCount(collaboratorCount)}
              </span>
            )
          ) : null}
        </div>
        {showActions ? (
          <div className={actionRowClass}>
            {onBuild ? (
              <button
                type="button"
                className={cx(actionButtonClass, 'secondary')}
                onClick={() => onBuild(build)}
              >
                <Icon icon="wrench" />
                Build
              </button>
            ) : null}
            <button
              type="button"
              className={actionButtonClass}
              onClick={() => onOpen?.(build)}
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
      {thumbnailUrl ? (
        <PreviewFrame
          className={previewClass}
          thumbnailUrl={thumbnailUrl}
          alt={`${displayTitle} screenshot`}
          ariaLabel={`${displayTitle} preview`}
        />
      ) : null}
    </div>
  );
}
