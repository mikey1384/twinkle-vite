import React, { memo, useEffect, useMemo, useState } from 'react';
import PlaylistModal from '~/components/Modals/PlaylistModal';
import TagModal from './TagModal';
import { hashify } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';
import { useRoleColor } from '~/theme/useRoleColor';
import Icon from '~/components/Icon';

const addVideoToPlaylistsLabel = localize('addVideoToPlaylists');

function TagStatus({
  contentId,
  onAddTags,
  onAddTagToContents,
  onLoadTags,
  style,
  theme,
  tags
}: {
  contentId: number;
  onAddTags: (v: any) => void;
  onAddTagToContents?: (v: any) => void;
  onLoadTags?: (v: any) => void;
  style?: React.CSSProperties;
  theme?: string;
  tags: any[];
}) {
  const canEditPlaylists = useKeyContext((v) => v.myState.canEditPlaylists);
  const { color: linkRoleColor } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const fetchPlaylistsContaining = useAppContext(
    (v) => v.requestHelpers.fetchPlaylistsContaining
  );
  const [shownPlaylistId, setShownPlaylistId] = useState();
  const [shownPlaylistTitle, setShownPlaylistTitle] = useState('');
  const [tagModalShown, setTagModalShown] = useState(false);

  useEffect(() => {
    if (onLoadTags) {
      loadTags();
    }
    async function loadTags() {
      const tags = await fetchPlaylistsContaining({ videoId: contentId });
      onLoadTags?.({ tags, contentId, contentType: 'video' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  const tagIds = useMemo(() => {
    return typeof tags?.map === 'function' ? tags.map((tag) => tag.id) : [];
  }, [tags]);

  const tagsContainerClass = useMemo(
    () =>
      css`
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      `,
    []
  );

  const tagChipClass = useMemo(
    () =>
      css`
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.4rem 1rem;
        border-radius: 9999px;
        font-size: 1.35rem;
        font-weight: 600;
        line-height: 1.2;
        background: ${Color.highlightGray(0.8)};
        color: ${linkRoleColor};
        border: 1px solid ${Color.borderGray(0.6)};
        cursor: pointer;
        transition: background 0.18s ease, border-color 0.18s ease,
          transform 0.18s ease;
        &:focus-visible {
          outline: 2px solid ${linkRoleColor};
          outline-offset: 2px;
        }
        &:hover {
          background: ${Color.highlightGray(1)};
          border-color: ${Color.borderGray()};
          transform: translateY(-1px);
        }
        &:active {
          transform: translateY(0);
        }
      `,
    [linkRoleColor]
  );

  const addButtonClass = useMemo(
    () =>
      css`
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.45rem 1.1rem;
        border-radius: 9999px;
        font-size: 1.35rem;
        font-weight: 600;
        line-height: 1.2;
        background: ${
          tags?.length > 0 ? Color.orange(0.12) : Color.highlightGray(0.8)
        };
        color: ${tags?.length > 0 ? Color.orange() : linkRoleColor};
        border: 1px solid ${
          tags?.length > 0 ? Color.orange(0.3) : Color.borderGray(0.6)
        };
        cursor: pointer;
        transition: background 0.18s ease, transform 0.18s ease,
          border-color 0.18s ease;
        &:focus-visible {
          outline: 2px solid ${tags?.length > 0 ? Color.orange() : linkRoleColor};
          outline-offset: 2px;
        }
        &:hover {
          background: ${
            tags?.length > 0 ? Color.orange(0.18) : Color.highlightGray(1)
          };
          border-color: ${
            tags?.length > 0 ? Color.orange(0.4) : Color.borderGray()
          };
          transform: translateY(-1px);
        }
        &:active {
          transform: translateY(0);
        }
      `,
    [linkRoleColor, tags?.length]
  );

  const Tags = useMemo(
    () =>
      (Array.isArray(tags) ? tags : []).map((tag) => {
        const hashedTitle = hashify(tag.title);
        const prefix = hashedTitle.startsWith('#') ? '#' : '';
        const label = prefix ? hashedTitle.slice(1) : hashedTitle;
        return (
          <button
            type="button"
            className={`${tagChipClass} unselectable`}
            key={tag.id}
            onClick={() => {
              setShownPlaylistId(tag.id);
              setShownPlaylistTitle(tag.title);
            }}
            aria-label={hashify(tag.title)}
          >
            {prefix ? <span aria-hidden="true">{prefix}</span> : null}
            <span>{label}</span>
          </button>
        );
      }),
    [tagChipClass, tags]
  );

  const addLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>{tags?.length === 0 ? '재생목록에 추가' : '추가'}</>;
    }
    return (
      <>
        Add{tags?.length === 0 ? ' to Playlists' : ''}
      </>
    );
  }, [tags?.length]);

  return (
    <div
      style={style}
      className={css`
        white-space: normal;
      `}
    >
      {(tags?.length > 0 || canEditPlaylists) && (
        <div style={{ padding: '0 1rem' }} className={tagsContainerClass}>
          {Tags}
          {canEditPlaylists && (
            <button
              type="button"
              className={addButtonClass}
              onClick={() => setTagModalShown(true)}
            >
              <Icon icon="plus" />
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      )}
      {tagModalShown && (
        <TagModal
          currentPlaylists={tagIds}
          title={addVideoToPlaylistsLabel}
          onHide={() => setTagModalShown(false)}
          onAddPlaylist={({ videoIds, playlistId, playlistTitle }) =>
            onAddTagToContents?.({
              contentIds: videoIds,
              contentType: 'video',
              tagId: playlistId,
              tagTitle: playlistTitle
            })
          }
          onSubmit={onTagSubmit}
          videoId={contentId}
        />
      )}
      {shownPlaylistId && (
        <PlaylistModal
          onLinkClick={() => setShownPlaylistId(undefined)}
          title={shownPlaylistTitle}
          playlistId={shownPlaylistId}
          onHide={() => {
            setShownPlaylistId(undefined);
            setShownPlaylistTitle('');
          }}
        />
      )}
    </div>
  );

  function onTagSubmit(selectedTags: any[]) {
    onAddTags({ tags: selectedTags, contentType: 'video', contentId });
    setTagModalShown(false);
  }
}

export default memo(TagStatus);
