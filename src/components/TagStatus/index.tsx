import React, { memo, useEffect, useMemo, useState } from 'react';
import PlaylistModal from '~/components/Modals/PlaylistModal';
import TagModal from './TagModal';
import { hashify } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

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
  const { canEditPlaylists, profileTheme } = useKeyContext((v) => v.myState);
  const {
    link: { color: linkColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
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
    return tags.map((tag) => tag.id);
  }, [tags]);

  const Tags = useMemo(
    () =>
      tags.map((tag) => (
        <a
          style={{
            marginRight: '0.5rem',
            fontSize: '1.5rem',
            color: Color[linkColor]()
          }}
          key={tag.id}
          onClick={() => {
            setShownPlaylistId(tag.id);
            setShownPlaylistTitle(tag.title);
          }}
        >
          {hashify(tag.title)}
        </a>
      )),
    [linkColor, tags]
  );

  const addLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>+{tags.length === 0 ? ' 재생목록에' : ''} 추가</>;
    }
    return (
      <>
        +Add
        {tags.length === 0 ? ' to Playlists' : ''}
      </>
    );
  }, [tags.length]);

  return (
    <div
      style={style}
      className={css`
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: break-word;
        a {
          font-weight: bold;
          cursor: pointer;
        }
      `}
    >
      {(tags.length > 0 || canEditPlaylists) && (
        <div style={{ padding: '0 1rem' }}>
          {Tags}
          {canEditPlaylists && (
            <a
              style={{
                color: tags.length > 0 ? Color.orange() : Color[linkColor]()
              }}
              onClick={() => setTagModalShown(true)}
            >
              {addLabel}
            </a>
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
