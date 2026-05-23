import React, { useState } from 'react';
import { BuildWideCard } from '~/components/Build/Cards';
import ForkHistoryModal from '~/components/Modals/BuildForkHistoryModal';
import { User } from '~/types';

type BuildCollaborationMode = 'private' | 'open_source';

export default function BuildDetails({
  buildId,
  buildUserId,
  collaboratorCount,
  collaborationMode,
  createdAt,
  description,
  forkCount,
  isFavorited,
  isPublic,
  sourceBuildId,
  contributionStatus,
  rootBuildSourceBuildId,
  thumbUrl,
  title,
  updatedAt,
  uploader,
  viewCount,
  publishedAt
}: {
  buildId: number;
  buildUserId?: number | null;
  collaboratorCount?: number;
  collaborationMode?: BuildCollaborationMode | 'contribution' | null;
  createdAt?: number | null;
  description: string;
  favoritedAt?: number | null;
  forkCount?: number;
  isFavorited?: boolean;
  isPublic?: number | boolean | null;
  sourceBuildId?: number | null;
  contributionStatus?: string | null;
  rootBuildSourceBuildId?: number | null;
  thumbUrl?: string;
  title: string;
  updatedAt?: number | null;
  uploader: User;
  viewCount?: number;
  publishedAt?: number | null;
}) {
  const [forkHistoryBuildId, setForkHistoryBuildId] = useState(0);
  return (
    <div className="build-details">
      <BuildWideCard
        build={{
          id: buildId,
          userId: buildUserId || uploader?.id || 0,
          username: uploader?.username || '',
          profilePicUrl: uploader?.profilePicUrl || '',
          profileTheme: uploader?.profileTheme || null,
          title,
          description,
          collaboratorCount,
          collaborationMode,
          forkCount,
          isFavorited,
          isPublic,
          sourceBuildId,
          contributionStatus,
          rootBuildSourceBuildId,
          thumbnailUrl: thumbUrl,
          createdAt,
          updatedAt,
          viewCount,
          publishedAt
        }}
        clickable={false}
        showFavoriteAction
        onOpenForkHistory={setForkHistoryBuildId}
      />
      {forkHistoryBuildId ? (
        <ForkHistoryModal
          buildId={forkHistoryBuildId}
          isOpen
          onClose={() => setForkHistoryBuildId(0)}
        />
      ) : null}
    </div>
  );
}
