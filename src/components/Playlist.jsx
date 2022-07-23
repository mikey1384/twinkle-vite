import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import VideoThumbImage from '~/components/VideoThumbImage';
import Link from '~/components/Link';
import InvalidPage from '~/components/InvalidPage';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
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
  playlistId: PropTypes.number.isRequired
};

export default function Playlist({
  onLinkClick = () => {},
  onLoad,
  playlistId
}) {
  const loadPlaylistVideos = useAppContext(
    (v) => v.requestHelpers.loadPlaylistVideos
  );
  const {
    loadMoreButton: { color: loadMoreButtonColor },
    link: { color: linkColor },
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);
  const [videos, setVideos] = useState([]);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    handleLoadPlaylistVideos();
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
      setVideos(videos);
      setLoaded(true);
      setLoadMoreButton(loadMoreButton);
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
      {videos.map((video, index) => (
        <div
          key={video.id}
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
              to={`/videos/${video.id}?playlist=${playlistId}`}
            >
              <VideoThumbImage
                rewardLevel={video.rewardLevel}
                videoId={video.id}
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
      ))}
      {loadMoreButton && (
        <LoadMoreButton
          style={{ marginTop: '1.5em' }}
          loading={loading}
          filled
          color={loadMoreButtonColor}
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
    setVideos(videos.concat(loadedVideos));
    setLoadMoreButton(loadMoreButton);
    setLoading(false);
  }
}
