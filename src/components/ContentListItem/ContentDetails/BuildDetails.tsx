import React from 'react';
import { BuildForkHistoryTrigger } from '~/components/BuildForkHistoryModal';
import Icon from '~/components/Icon';
import { User } from '~/types';
import {
  type BuildRelationshipLabel,
  getBuildDisplayTitle,
  getBuildRelationshipLabels
} from '~/containers/Build/BuildEditor/buildRelationshipLabels';

export default function BuildDetails({
  buildId,
  collaboratorCount,
  description,
  sourceBuildId,
  contributionStatus,
  rootBuildSourceBuildId,
  title,
  uploader
}: {
  buildId: number;
  collaboratorCount?: number;
  description: string;
  sourceBuildId?: number | null;
  contributionStatus?: string | null;
  rootBuildSourceBuildId?: number | null;
  title: string;
  uploader: User;
}) {
  const normalizedCollaboratorCount = Math.max(
    0,
    Math.floor(Number(collaboratorCount) || 0)
  );
  const buildRelationship = {
    title,
    sourceBuildId,
    contributionStatus,
    rootBuildSourceBuildId
  };
  const displayTitle = getBuildDisplayTitle(buildRelationship);
  const relationshipLabels = getBuildRelationshipLabels(buildRelationship);

  return (
    <div className="build-details">
      <div className="title">
        <div className="build-badge">
          <Icon icon="rocket" />
          <span>Lumine App</span>
        </div>
        <p>{displayTitle || 'Lumine App'}</p>
        {uploader.username && (
          <small>Published by {uploader.username}</small>
        )}
      </div>
      {relationshipLabels.map((label) =>
        label === 'fork' ? (
          <BuildForkHistoryTrigger
            key={label}
            buildId={buildId}
            className="build-collaborator-badge"
            style={{
              borderColor: getRelationshipBadgeBorder(label),
              background: getRelationshipBadgeBackground(label),
              color: getRelationshipBadgeColor(label)
            }}
          >
            <Icon icon="code-branch" />
            <span>Fork</span>
          </BuildForkHistoryTrigger>
        ) : (
          <div
            key={label}
            className="build-collaborator-badge"
            style={{
              borderColor: getRelationshipBadgeBorder(label),
              background: getRelationshipBadgeBackground(label),
              color: getRelationshipBadgeColor(label)
            }}
          >
            <Icon icon="users" />
            <span>Branch</span>
          </div>
        )
      )}
      {normalizedCollaboratorCount > 0 ? (
        <div className="build-collaborator-badge">
          <Icon icon="users" />
          <span>{formatCollaboratorCount(normalizedCollaboratorCount)}</span>
        </div>
      ) : null}
      {description && <div className="description">{description}</div>}
      <div className="build-card-action">
        <span>Open app</span>
        <Icon icon="external-link-alt" />
      </div>
    </div>
  );
}

function formatCollaboratorCount(count: number) {
  return count === 1
    ? '1 collaborator'
    : `${count.toLocaleString()} collaborators`;
}

function getRelationshipBadgeBorder(label: BuildRelationshipLabel) {
  return label === 'fork'
    ? 'rgba(147, 51, 234, 0.3)'
    : 'rgba(59, 130, 246, 0.3)';
}

function getRelationshipBadgeBackground(label: BuildRelationshipLabel) {
  return label === 'fork'
    ? 'rgba(147, 51, 234, 0.12)'
    : 'rgba(59, 130, 246, 0.12)';
}

function getRelationshipBadgeColor(label: BuildRelationshipLabel) {
  return label === 'fork' ? '#6b21a8' : '#1d4ed8';
}
