import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import ProgressBar from '~/components/ProgressBar';
import { mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { BuildCopilotPolicy, BuildRuntimeUploadAsset } from './types';
import { formatBytes, formatTokenCount } from './utils';

interface RuntimeUploadsModalProps {
  copilotPolicy: BuildCopilotPolicy | null;
  runtimeUploadsModalShown: boolean;
  runtimeUploadAssets: BuildRuntimeUploadAsset[];
  runtimeUploadsNextCursor: number | null;
  runtimeUploadsLoading: boolean;
  runtimeUploadsLoadingMore: boolean;
  runtimeUploadsError: string;
  runtimeUploadDeletingId: number | null;
  onCloseRuntimeUploadsManager: () => void;
  onDeleteRuntimeUpload: (asset: BuildRuntimeUploadAsset) => Promise<void> | void;
  onLoadMoreRuntimeUploads: () => void;
}

export default function RuntimeUploadsModal({
  copilotPolicy,
  runtimeUploadsModalShown,
  runtimeUploadAssets,
  runtimeUploadsNextCursor,
  runtimeUploadsLoading,
  runtimeUploadsLoadingMore,
  runtimeUploadsError,
  runtimeUploadDeletingId,
  onCloseRuntimeUploadsManager,
  onDeleteRuntimeUpload,
  onLoadMoreRuntimeUploads
}: RuntimeUploadsModalProps) {
  const groupedRuntimeUploadAssets = useMemo(() => {
    const groups: Array<{
      key: string;
      buildId: number;
      buildTitle: string;
      buildExists: boolean;
      assets: BuildRuntimeUploadAsset[];
    }> = [];
    const groupMap = new Map<
      string,
      {
        key: string;
        buildId: number;
        buildTitle: string;
        buildExists: boolean;
        assets: BuildRuntimeUploadAsset[];
      }
    >();

    for (const asset of runtimeUploadAssets) {
      const buildExists = Boolean(asset.buildTitle?.trim());
      const buildTitle =
        asset.buildTitle?.trim() ||
        `Deleted build #${formatTokenCount(asset.buildId)}`;
      const key = `${asset.buildId}:${buildTitle}`;
      let group = groupMap.get(key);

      if (!group) {
        group = {
          key,
          buildId: asset.buildId,
          buildTitle,
          buildExists,
          assets: []
        };
        groupMap.set(key, group);
        groups.push(group);
      }

      group.assets.push(asset);
    }

    return groups;
  }, [runtimeUploadAssets]);

  if (!runtimeUploadsModalShown) {
    return null;
  }

  return (
    <Modal
      modalKey="BuildRuntimeUploadsModal"
      isOpen
      onClose={onCloseRuntimeUploadsManager}
      title="Manage uploads"
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onCloseRuntimeUploadsManager}
            uppercase={false}
          >
            Close
          </Button>
          {runtimeUploadsNextCursor ? (
            <Button
              color="blue"
              variant="solid"
              loading={runtimeUploadsLoadingMore}
              onClick={onLoadMoreRuntimeUploads}
              uppercase={false}
            >
              Load more
            </Button>
          ) : null}
        </>
      }
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          max-width: 100%;
          min-height: 0;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
      >
        {copilotPolicy ? (
          <div
            className={css`
              border: 1px solid var(--ui-border);
              border-radius: 12px;
              background: var(--chat-bg);
              padding: 0.95rem 1rem;
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.8rem;
                margin-bottom: 0.45rem;
                flex-wrap: wrap;
              `}
            >
              <span
                className={css`
                  font-size: 1.3rem;
                  font-weight: 800;
                  color: var(--chat-text);
                `}
              >
                Lumine file storage
              </span>
              <span
                className={css`
                  font-size: 1rem;
                  color: var(--chat-text);
                  opacity: 0.72;
                `}
              >
                {formatBytes(copilotPolicy.usage.runtimeFileStorageRemaining)} left
              </span>
            </div>
            <ProgressBar
              progress={Math.max(
                0,
                Math.min(
                  100,
                  (copilotPolicy.usage.runtimeFileStorageBytes /
                    Math.max(copilotPolicy.limits.maxRuntimeFileStorageBytes, 1)) *
                    100
                )
              )}
              text={`${formatBytes(copilotPolicy.usage.runtimeFileStorageBytes)} / ${formatBytes(copilotPolicy.limits.maxRuntimeFileStorageBytes)}`}
              color="pink"
            />
            <div
              className={css`
                margin-top: 0.45rem;
                font-size: 1rem;
                color: var(--chat-text);
                opacity: 0.72;
              `}
            >
              {formatTokenCount(copilotPolicy.usage.runtimeFileCount)} uploaded
              file{copilotPolicy.usage.runtimeFileCount === 1 ? '' : 's'} across
              your builds
            </div>
          </div>
        ) : null}
        {runtimeUploadsError ? (
          <div
            className={css`
              border: 1px solid rgba(220, 38, 38, 0.16);
              border-radius: 12px;
              background: rgba(254, 242, 242, 0.96);
              padding: 0.85rem 0.95rem;
              color: #b91c1c;
              font-size: 1.1rem;
              font-weight: 700;
            `}
          >
            {runtimeUploadsError}
          </div>
        ) : null}
        {runtimeUploadsLoading && runtimeUploadAssets.length === 0 ? (
          <EmptyState>Loading uploaded files...</EmptyState>
        ) : groupedRuntimeUploadAssets.length === 0 ? (
          <EmptyState>No uploaded files yet.</EmptyState>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.9rem;
              padding-right: 0.15rem;
              padding-bottom: 0.25rem;
            `}
          >
            {groupedRuntimeUploadAssets.map((group) => (
              <section
                key={group.key}
                className={css`
                  display: flex;
                  flex-direction: column;
                  flex-shrink: 0;
                  border: 1px solid var(--ui-border);
                  border-radius: 12px;
                  background: #fff;
                  overflow: clip;
                `}
              >
                <div
                  className={css`
                    padding: 0.85rem 1rem;
                    border-bottom: 1px solid var(--ui-border);
                    background: rgba(248, 250, 252, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                  `}
                >
                  <div
                    className={css`
                      display: flex;
                      flex-direction: column;
                      gap: 0.2rem;
                    `}
                  >
                    <span
                      className={css`
                        font-size: 1.2rem;
                        font-weight: 800;
                        color: var(--chat-text);
                      `}
                    >
                      {group.buildTitle}
                    </span>
                    <span
                      className={css`
                        font-size: 1rem;
                        color: var(--chat-text);
                        opacity: 0.68;
                      `}
                    >
                      Build #{formatTokenCount(group.buildId)}
                    </span>
                  </div>
                  {group.buildExists ? (
                    <a
                      href={`/build/${group.buildId}`}
                      className={css`
                        font-size: 1rem;
                        font-weight: 800;
                        color: #1d4ed8;
                        text-decoration: none;
                      `}
                    >
                      Open build
                    </a>
                  ) : (
                    <span
                      className={css`
                        font-size: 1rem;
                        color: var(--chat-text);
                        opacity: 0.6;
                      `}
                    >
                      Build deleted
                    </span>
                  )}
                </div>
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    min-height: 0;
                  `}
                >
                  {group.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className={css`
                        display: grid;
                        grid-template-columns: auto minmax(0, 1fr) auto;
                        gap: 0.85rem;
                        align-items: center;
                        padding: 0.9rem 1rem;
                        border-top: 1px solid rgba(226, 232, 240, 0.65);
                        &:first-child {
                          border-top: none;
                        }
                        @media (max-width: ${mobileMaxWidth}) {
                          grid-template-columns: minmax(0, 1fr);
                        }
                      `}
                    >
                      {asset.thumbUrl && asset.fileType === 'image' ? (
                        <img
                          src={asset.thumbUrl}
                          alt={asset.originalFileName || asset.fileName}
                          className={css`
                            width: 56px;
                            height: 56px;
                            object-fit: cover;
                            border-radius: 12px;
                            border: 1px solid var(--ui-border);
                          `}
                        />
                      ) : (
                        <div
                          className={css`
                            width: 56px;
                            height: 56px;
                            border-radius: 12px;
                            border: 1px solid var(--ui-border);
                            background: rgba(59, 130, 246, 0.08);
                            color: #1d4ed8;
                            display: grid;
                            place-items: center;
                            font-size: 0.9rem;
                            font-weight: 800;
                            text-transform: uppercase;
                          `}
                        >
                          {asset.fileType}
                        </div>
                      )}
                      <div
                        className={css`
                          min-width: 0;
                          display: flex;
                          flex-direction: column;
                          gap: 0.24rem;
                        `}
                      >
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className={css`
                            font-size: 1.1rem;
                            font-weight: 800;
                            color: var(--chat-text);
                            text-decoration: none;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                          `}
                        >
                          {asset.originalFileName || asset.fileName}
                        </a>
                        <div
                          className={css`
                            font-size: 1rem;
                            color: var(--chat-text);
                            opacity: 0.72;
                            display: flex;
                            flex-wrap: wrap;
                            gap: 0.35rem;
                          `}
                        >
                          <span>{formatBytes(asset.sizeBytes)}</span>
                          <span>•</span>
                          <span>{timeSince(asset.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void onDeleteRuntimeUpload(asset)}
                        disabled={runtimeUploadDeletingId === asset.id}
                        className={css`
                          justify-self: end;
                          border: 1px solid rgba(220, 38, 38, 0.16);
                          background: rgba(254, 242, 242, 0.96);
                          color: #b91c1c;
                          border-radius: 999px;
                          padding: 0.48rem 0.95rem;
                          font-size: 1rem;
                          font-weight: 800;
                          cursor: pointer;
                          white-space: nowrap;
                          &:disabled {
                            cursor: wait;
                            opacity: 0.62;
                          }
                          @media (max-width: ${mobileMaxWidth}) {
                            justify-self: start;
                          }
                        `}
                      >
                        {runtimeUploadDeletingId === asset.id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={css`
        border: 1px dashed var(--ui-border);
        border-radius: 12px;
        padding: 1.2rem 1rem;
        text-align: center;
        font-size: 1.1rem;
        color: var(--chat-text);
        opacity: 0.72;
      `}
    >
      {children}
    </div>
  );
}
