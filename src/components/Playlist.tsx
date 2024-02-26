import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import VideoThumbImage from '~/components/VideoThumbImage';
import Link from '~/components/Link';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import localize from '~/constants/localize';

const eitherRemovedOrNeverExistedLabel = localize(
  'eitherRemovedOrNeverExisted'
);
const loadingLabel = localize('loading');
const playlistNotExistLabel = localize('playlistNotExist');
const uploadedByLabel = localize('uploadedBy');

Playlist.propTypes = {
  onLinkClick: PropTypes.func,
  onLoad: PropTypes.func,
  playlistId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default function Playlist({
  onLinkClick = () => null,
  onLoad,
  playlistId
}: {
  onLinkClick?: () => void;
  onLoad?: (params: any) => void;
  playlistId: string | number;
}) {
  const loadPlaylistVideos = useAppContext(
    (v) => v.requestHelpers.loadPlaylistVideos
  );
  const contentState = useContentContext((v) => v.state);
  const onSetContentState = useContentContext(
    (v) => v.actions.onSetContentState
  );

  const {
    link: { color: linkColor },
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);
  const { loadMoreShown, videos, loaded } = useContentState({
    contentType: 'playlist',
    contentId: playlistId
  });
  const onLoadPlaylistVideos = useContentContext(
    (v) => v.actions.onLoadPlaylistVideos
  );
  const onLoadMorePlaylistVideos = useContentContext(
    (v) => v.actions.onLoadMorePlaylistVideos
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loaded) {
      handleLoadPlaylistVideos();
    }
    async function handleLoadPlaylistVideos() {
      const {
        title,
        results: videos,
        loadMoreButton
      } = await loadPlaylistVideos({
        playlistId
      });
      if (typeof onLoad === 'function') {
        onLoad({ exists: videos.length > 0, title });
      }
      for (const video of videos) {
        onSetContentState({
          contentId: video.id,
          contentType: 'video',
          newState: video
        });
      }
      onLoadPlaylistVideos({
        playlistId,
        videos,
        loadMoreShown: loadMoreButton
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Playlist">
      {videos.length === 0 ? (
        loaded ? (
          <InvalidPage
            title={playlistNotExistLabel}
            text={eitherRemovedOrNeverExistedLabel}
          />
        ) : (
          <Loading text={`${loadingLabel}...`} />
        )
      ) : null}
      {videos
        .map((video: any) => video.id)
        .map((videoId: any, index: number) => {
          const video = contentState[`video${videoId}`] || {};
          return (
            <div
              key={videoId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%',
                marginTop: index !== 0 ? '1rem' : 0
              }}
            >
              <div style={{ width: '35%' }}>
                <Link
                  onClick={onLinkClick}
                  to={`/videos/${videoId}?playlist=${playlistId}`}
                >
                  <VideoThumbImage
                    rewardLevel={video.rewardLevel}
                    videoId={videoId}
                    src={`https://img.youtube.com/vi/${video.content}/mqdefault.jpg`}
                  />
                </Link>
              </div>
              <div style={{ width: '60%' }}>
                <Link
                  style={{
                    color: video.byUser
                      ? Color[userLinkColor]()
                      : Color[linkColor](),
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    lineHeight: 1.5
                  }}
                  onClick={onLinkClick}
                  to={`/videos/${video.id}?playlist=${playlistId}`}
                >
                  {video.title}
                </Link>
                <p style={{ color: Color.gray(), fontSize: '1.5rem' }}>
                  {uploadedByLabel} {video.uploaderName}
                </p>
              </div>
            </div>
          );
        })}
      {loadMoreShown && (
        <LoadMoreButton
          style={{ marginTop: '1.5em' }}
          loading={loading}
          filled
          onClick={handleLoadMoreVideos}
        />
      )}
    </ErrorBoundary>
  );

  async function handleLoadMoreVideos() {
    setLoading(true);
    const { results: loadedVideos, loadMoreButton } = await loadPlaylistVideos({
      playlistId,
      shownVideos: videos
    });
    for (const video of loadedVideos) {
      onSetContentState({
        contentId: video.id,
        contentType: 'video',
        newState: video
      });
    }
    onLoadMorePlaylistVideos({
      playlistId,
      videos: loadedVideos,
      loadMoreShown: loadMoreButton
    });
    setLoading(false);
  }
}
