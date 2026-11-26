import React, { useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { Color, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  describeAIImageSource,
  type AIImageHistoryItem
} from '~/helpers/aiImageHistory';

interface ImageHistoryProps {
  images: AIImageHistoryItem[];
  loading: boolean;
  failed: boolean;
  hasMore: boolean;
  selectingId: number | null;
  selectDisabled: boolean;
  themeColor?: string;
  onLoadMore: () => void;
  onRetry: () => void;
  onSelect: (image: AIImageHistoryItem) => void;
  onLoadFullImage: (image: AIImageHistoryItem) => Promise<string | null>;
  // Choosing pictures for a collection: picked tiles show a check, and the
  // intro line and empty message say what tapping does there.
  pickedIds?: number[];
  intro?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  // My Images only (Mikey 11-26): the owner deletes an image; resolves to an
  // error message, or null once the server has deleted it
  onDelete?: (image: AIImageHistoryItem) => Promise<string | null>;
}

// Every image the member made, newest first. Only they can see it.
export default function ImageHistory({
  images,
  loading,
  failed,
  hasMore,
  selectingId,
  selectDisabled,
  themeColor,
  onLoadMore,
  onRetry,
  onSelect,
  onLoadFullImage,
  pickedIds,
  intro,
  emptyMessage,
  onDelete
}: ImageHistoryProps) {
  const themeRole = useRoleColor('button', {
    themeName: themeColor,
    fallback: themeColor || 'logoBlue'
  });
  // CloudFront serves the stored image; if it cannot, the API sends it.
  const [fallbackSrc, setFallbackSrc] = useState<Record<number, string>>({});
  const [brokenIds, setBrokenIds] = useState<Record<number, true>>({});
  const [confirmingDelete, setConfirmingDelete] =
    useState<AIImageHistoryItem | null>(null);
  const [deleteError, setDeleteError] = useState('');

  return (
    <div className={wrapCls}>
      <p className={introCls}>
        {intro || (
          <>
            <Icon icon="lock" /> Every image you&apos;ve made. Only you can see
            these. Tap one to use it or keep editing it.
          </>
        )}
      </p>

      {images.length > 0 && (
        <div className={gridCls}>
          {images.map((image) => {
            const source = describeAIImageSource(image);
            const finished = image.status === 'completed' && !!image.path;
            const isSelecting = selectingId === image.id;
            const isPicked = !!pickedIds?.includes(image.id);
            const src =
              fallbackSrc[image.id] ||
              (image.path ? `${cloudFrontURL}/${image.path}` : '');
            return (
              <div key={image.id} className={tileWrapCls}>
                <button
                  type="button"
                  className={tileCls}
                  disabled={!finished || selectDisabled || isSelecting}
                  onClick={() => onSelect(image)}
                  aria-pressed={pickedIds ? isPicked : undefined}
                  style={
                    isPicked
                      ? {
                          borderColor: themeRole.getColor(),
                          boxShadow: `0 0 0 2px ${themeRole.getColor()}`
                        }
                      : undefined
                  }
                  aria-label={
                    finished
                      ? `Use "${image.prompt || 'this image'}"`
                      : image.status === 'processing'
                        ? 'Image still being made'
                        : 'Image that did not finish'
                  }
                >
                  <span className={frameCls}>
                    {finished && !brokenIds[image.id] ? (
                      <img
                        src={src}
                        alt={image.prompt || 'Your image'}
                        loading="lazy"
                        onError={() => handleImageError(image)}
                      />
                    ) : image.status === 'processing' ? (
                      <span className={stateCls}>
                        <span
                          className={spinnerCls}
                          style={{ borderTopColor: themeRole.getColor() }}
                        />
                        Still being made…
                      </span>
                    ) : (
                      <span className={stateCls}>
                        <Icon icon="image" />
                        {finished
                          ? 'Couldn’t show this one'
                          : 'Didn’t finish. No AI Energy used.'}
                      </span>
                    )}
                    {isPicked && (
                      <span
                        className={pickedCls}
                        style={{ background: themeRole.getColor() }}
                      >
                        <Icon icon="check" />
                      </span>
                    )}
                    {isSelecting && (
                      <span className={selectingCls}>
                        <span
                          className={spinnerCls}
                          style={{ borderTopColor: themeRole.getColor() }}
                        />
                      </span>
                    )}
                  </span>
                  <span className={captionCls}>
                    <span className="prompt">
                      {image.prompt || 'Made before history began'}
                    </span>
                    <span className="meta">
                      {source ? <span className="source">{source}</span> : null}
                      {formatMadeAt(image.completedAt || image.createdAt)}
                    </span>
                  </span>
                </button>
                {onDelete && image.status !== 'processing' && (
                  <button
                    type="button"
                    className={deleteCls}
                    aria-label="Delete image"
                    onClick={() => {
                      setDeleteError('');
                      setConfirmingDelete(image);
                    }}
                  >
                    <Icon icon="trash-alt" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {deleteError && (
        <p role="alert" className={noteCls} style={{ color: Color.rose() }}>
          {deleteError}
        </p>
      )}

      {confirmingDelete && onDelete && (
        <ConfirmModal
          modalOverModal
          title="Delete this image?"
          descriptionFontSize="1.6rem"
          description={
            confirmingDelete.source === 'picture_day'
              ? 'It will be gone from your images and your Picture Day.'
              : 'It will be gone from your images.'
          }
          confirmButtonColor="red"
          confirmButtonLabel="Delete"
          onHide={() => setConfirmingDelete(null)}
          onConfirm={async () => {
            const failure = await onDelete(confirmingDelete);
            setConfirmingDelete(null);
            if (failure) setDeleteError(failure);
          }}
        />
      )}

      {loading ? (
        <p className={noteCls}>Loading your images…</p>
      ) : failed ? (
        <div className={noteCls}>
          <p>We couldn’t load your images.</p>
          <button type="button" className={moreCls} onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : images.length === 0 ? (
        <p className={noteCls}>
          {emptyMessage ||
            'Images you make will be kept here, even if you leave before they finish.'}
        </p>
      ) : hasMore ? (
        <div className={noteCls}>
          <button
            type="button"
            className={moreCls}
            style={{ color: themeRole.getColor() }}
            onClick={onLoadMore}
          >
            Show older images
          </button>
        </div>
      ) : null}
    </div>
  );

  async function handleImageError(image: AIImageHistoryItem) {
    if (fallbackSrc[image.id]) {
      setBrokenIds((current) => ({ ...current, [image.id]: true }));
      return;
    }
    const imageUrl = await onLoadFullImage(image);
    if (imageUrl) {
      setFallbackSrc((current) => ({ ...current, [image.id]: imageUrl }));
    } else {
      setBrokenIds((current) => ({ ...current, [image.id]: true }));
    }
  }
}

function formatMadeAt(seconds: number) {
  if (!seconds) return '';
  return new Date(seconds * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year:
      new Date(seconds * 1000).getFullYear() === new Date().getFullYear()
        ? undefined
        : 'numeric'
  });
}

const wrapCls = css`
  display: flex;
  flex-direction: column;
  gap: calc(14 * var(--px));
  width: 100%;
`;

const introCls = css`
  margin: 0;
  font-size: calc(14 * var(--px));
  color: ${Color.darkerGray()};
  display: flex;
  align-items: center;
  gap: calc(8 * var(--px));
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
    align-items: flex-start;
  }
`;

const gridCls = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(170 * var(--px)), 1fr));
  gap: calc(14 * var(--px));
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }
`;

const tileWrapCls = css`
  position: relative;
  display: flex;
  min-width: 0;
`;

// the tile's corner, opposite the picked check
const deleteCls = css`
  position: absolute;
  top: calc(8 * var(--px));
  left: calc(8 * var(--px));
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(30 * var(--px));
  height: calc(30 * var(--px));
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: ${Color.darkerGray()};
  font-size: calc(13 * var(--px));
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  &:hover,
  &:focus-visible {
    color: ${Color.rose()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
`;

const tileCls = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0;
  text-align: left;
  background: ${Color.white()};
  border: 1px solid var(--ui-border);
  border-radius: calc(14 * var(--px));
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  }
  &:disabled {
    cursor: default;
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 12px;
  }
`;

const frameCls = css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  background: ${Color.highlightGray()};
  overflow: hidden;
  img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
`;

const stateCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(8 * var(--px));
  padding: calc(12 * var(--px));
  text-align: center;
  font-size: calc(13 * var(--px));
  font-weight: 600;
  color: ${Color.darkerGray()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
  }
`;

const spinnerCls = css`
  width: calc(26 * var(--px));
  height: calc(26 * var(--px));
  border: 3px solid var(--ui-border);
  border-top: 3px solid ${Color.logoBlue()};
  border-radius: 50%;
  animation: imageHistorySpin 1s linear infinite;
  @keyframes imageHistorySpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    width: 22px;
    height: 22px;
  }
`;

const selectingCls = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
`;

const pickedCls = css`
  position: absolute;
  top: calc(8 * var(--px));
  right: calc(8 * var(--px));
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(28 * var(--px));
  height: calc(28 * var(--px));
  border-radius: 50%;
  color: #fff;
  font-size: calc(14 * var(--px));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  @media (max-width: ${mobileMaxWidth}) {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
`;

const captionCls = css`
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--px));
  padding: calc(8 * var(--px)) calc(10 * var(--px)) calc(10 * var(--px));
  min-width: 0;
  .prompt {
    font-size: calc(13 * var(--px));
    line-height: 1.35;
    color: ${Color.black()};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: calc(6 * var(--px));
    font-size: calc(12 * var(--px));
    color: ${Color.gray()};
  }
  .source {
    font-weight: 700;
    color: ${Color.darkerGray()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.6rem 0.7rem 0.7rem;
    .prompt {
      font-size: 1.15rem;
    }
    .meta {
      font-size: 1rem;
    }
  }
`;

const noteCls = css`
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(8 * var(--px));
  text-align: center;
  font-size: calc(14 * var(--px));
  color: ${Color.darkerGray()};
  p {
    margin: 0;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

const moreCls = css`
  background: transparent;
  border: 1px solid var(--ui-border);
  border-radius: calc(10 * var(--px));
  padding: calc(8 * var(--px)) calc(16 * var(--px));
  font-size: calc(14 * var(--px));
  font-weight: 700;
  color: ${Color.darkerGray()};
  cursor: pointer;
  &:hover {
    background: ${Color.highlightGray()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;
