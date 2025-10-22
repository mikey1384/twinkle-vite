import React, { useEffect, useMemo, useState } from 'react';
import Link from '~/components/Link';
import { Color, tabletMaxWidth, borderRadius } from '~/constants/css';
import { queryStringForArray } from '~/helpers/stringHelpers';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import VideoThumbImage from '~/components/VideoThumbImage';
import FilterBar from '~/components/FilterBar';
import Notification from '~/components/Notification';
import Loading from '~/components/Loading';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import request from 'axios';
import URL from '~/constants/URL';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';
import {
  useAppContext,
  useExploreContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import localize from '~/constants/localize';
import { useRoleColor } from '~/theme/useRoleColor';

const hideWatchedLabel = localize('hideWatched');
const videosLabel = localize('videos');
const newsLabel = localize('news');
const leaderboardLabel = localize('leaderboard');
const rewardsLabel = localize('rewards');
const newVideosLabel = localize('newVideos');
const relatedVideosLabel = localize('relatedVideos');
const upNextLabel = localize('upNext');
const uploadedByLabel = localize('uploadedBy');
const continueWatchingLabel = localize('continueWatching');

export default function NavMenu({
  playlistId,
  videoId,
  isContinuing
}: {
  playlistId?: number | null;
  videoId: number | string;
  isContinuing?: boolean;
}) {
  const navVideos = useExploreContext((v) => v.state.videos.navVideos);
  const {
    nextVideos,
    relatedVideos,
    otherVideos,
    playlistVideos,
    continueWatching: continueWatchingVideos
  } = navVideos;
  const onSetNavVideoState = useExploreContext(
    (v) => v.actions.onSetNavVideoState
  );
  const onToggleHideWatched = useAppContext(
    (v) => v.user.actions.onToggleHideWatched
  );
  const auth = useAppContext((v) => v.requestHelpers.auth);
  const loadRewards = useAppContext((v) => v.requestHelpers.loadRewards);
  const loadRightMenuVideos = useAppContext(
    (v) => v.requestHelpers.loadRightMenuVideos
  );
  const toggleHideWatched = useAppContext(
    (v) => v.requestHelpers.toggleHideWatched
  );
  const hideWatched = useKeyContext((v) => v.myState.hideWatched);
  const userId = useKeyContext((v) => v.myState.userId);
  const { colorKey: linkColor } = useRoleColor('link');
  const { colorKey: userLinkColor } = useRoleColor('userLink', {
    fallback: linkColor
  });
  const { colorKey: spinnerColor } = useRoleColor('spinner', {
    fallback: 'logoBlue'
  });
  const numNewNotis = useNotiContext((v) => v.state.numNewNotis);
  const notiObj = useNotiContext((v) => v.state.notiObj);
  const totalRewardedTwinkles = useMemo(
    () => notiObj[userId]?.totalRewardedTwinkles || 0,
    [notiObj, userId]
  );
  const totalRewardedTwinkleCoins = useMemo(
    () => notiObj[userId]?.totalRewardedTwinkleCoins || 0,
    [notiObj, userId]
  );
  const onLoadRewards = useNotiContext((v) => v.actions.onLoadRewards);

  const [rewardsExist, setRewardsExist] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState();
  const [filtering, setFiltering] = useState(false);
  const [playlistVideosLoading, setPlaylistVideosLoading] = useState(false);
  const [playlistVideosLoadMoreShown, setPlaylistVideosLoadMoreShown] =
    useState(false);
  const [videoTabActive, setVideoTabActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const noVideos = useMemo(() => {
    return (
      nextVideos.length +
        relatedVideos.length +
        otherVideos.length +
        playlistVideos.length ===
      0
    );
  }, [
    nextVideos.length,
    otherVideos.length,
    playlistVideos.length,
    relatedVideos.length
  ]);

  useEffect(() => {
    socket.on('new_reward_posted', handleNewReward);

    return function cleanUp() {
      socket.off('new_reward_posted', handleNewReward);
    };

    async function handleNewReward({ receiverId }: { receiverId: number }) {
      if (userId && receiverId === userId) {
        handleLoadRewards();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    handleLoadRightMenuVideos();
    async function handleLoadRightMenuVideos() {
      setLoading(true);
      try {
        const data = await loadRightMenuVideos({
          videoId,
          playlistId,
          isContinuing
        });
        if (data.playlistTitle) {
          setPlaylistTitle(data.playlistTitle);
        }
        if (data.continueWatching) {
          onSetNavVideoState({ continueWatching: data.continueWatching });
        }
        if (data.nextVideos) {
          onSetNavVideoState({ nextVideos: data.nextVideos });
        }
        if (data.relatedVideos) {
          onSetNavVideoState({ relatedVideos: data.relatedVideos });
        }
        if (data.playlistVideos) {
          onSetNavVideoState({ playlistVideos: data.playlistVideos });
        }
        setPlaylistVideosLoadMoreShown(!!data.playlistVideosLoadMoreShown);
        if (data.otherVideos) {
          onSetNavVideoState({ otherVideos: data.otherVideos });
        }
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, hideWatched, userId, playlistId]);

  useEffect(() => {
    setRewardsExist(totalRewardedTwinkles + totalRewardedTwinkleCoins > 0);
  }, [totalRewardedTwinkles, totalRewardedTwinkleCoins]);

  return (
    <ErrorBoundary
      componentPath="VideoPage/NavMenu"
      className={css`
        width: 100%;
        font-size: 2rem;
        > section {
          padding: 0;
          margin-bottom: 1.5rem;
          p {
            margin-bottom: 1rem;
            font-size: 2.5rem;
            font-weight: bold;
          }
          a {
            font-size: 1.7rem;
            font-weight: bold;
            line-height: 1.7rem;
          }
        }
        @media (max-width: ${tabletMaxWidth}) {
          width: 100%;
          margin: 0;
          padding-bottom: 20rem;
          section {
            margin: 0;
            margin-bottom: 1rem;
          }
        }
      `}
    >
      <div
        className={css`
          background: #fff;
          border-radius: ${borderRadius};
          padding: 0.5rem 0.75rem;
          margin-bottom: 1rem;
          @media (max-width: ${tabletMaxWidth}) {
            padding: 0.3rem 0.5rem;
          }
        `}
      >
        <FilterBar className="desktop">
        <nav
          className={videoTabActive ? 'active' : ''}
          onClick={() => setVideoTabActive(true)}
        >
          {videosLabel}
        </nav>
        <nav
          className={`${!videoTabActive ? 'active' : ''} ${
            rewardsExist || numNewNotis > 0 ? 'alert' : ''
          }`}
          onClick={() => setVideoTabActive(false)}
        >
          {rewardsExist ? rewardsLabel : userId ? newsLabel : leaderboardLabel}
        </nav>
        </FilterBar>
      </div>
      {userId && videoTabActive && !!playlistId && (
        <section>
          <div
            className={css`
              background: #fff;
              border-radius: ${borderRadius};
              padding: 1rem;
              display: flex;
              align-items: center;
              justify-content: flex-end;
            `}
          >
            {filtering && (
              <Icon
                style={{ marginRight: '1rem', color: Color[spinnerColor]() }}
                icon="spinner"
                pulse
              />
            )}
            <SwitchButton
              checked={!!hideWatched}
              label={hideWatchedLabel}
              onChange={handleToggleHideWatched}
              labelStyle={{ fontSize: '1.6rem' }}
            />
          </div>
        </section>
      )}
      {loading && noVideos && <Loading />}
      {videoTabActive && (
        <>
          {nextVideos.length > 0 && (
            <section key={videoId + 'up next'}>
              <div
                className={css`
                  background: #fff;
                  border-radius: ${borderRadius};
                  padding: 1.25rem;
                  @media (max-width: ${tabletMaxWidth}) {
                    padding: 1rem;
                  }
                `}
              >
                <p>{upNextLabel}</p>
                {renderVideos({
                  videos: nextVideos,
                  arePlaylistVideos: !!playlistId && playlistVideos.length > 0
                })}
              </div>
            </section>
          )}
          {continueWatchingVideos.length > 0 && (
            <section key={videoId + 'continue watching'}>
              <div
                className={css`
                  background: #fff;
                  border-radius: ${borderRadius};
                  padding: 1.25rem;
                  @media (max-width: ${tabletMaxWidth}) {
                    padding: 1rem;
                  }
                `}
              >
                <p>{continueWatchingLabel}</p>
                {renderVideos({
                  videos: continueWatchingVideos,
                  areContinueWatchingVideos: true
                })}
              </div>
            </section>
          )}
          {!!playlistId && playlistVideos.length > 0 && (
            <section
              key={videoId + 'playlist videos'}
            >
              <div
                className={css`
                  background: #fff;
                  border-radius: ${borderRadius};
                  padding: 1.25rem;
                  white-space: pre-wrap;
                  overflow-wrap: break-word;
                  word-break: break-word;
                  @media (max-width: ${tabletMaxWidth}) {
                    padding: 1rem;
                  }
                `}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <Link
                    style={{ fontSize: '2.5rem', textDecoration: 'none' }}
                    to={`/playlists/${playlistId}`}
                  >
                    {playlistTitle}
                  </Link>
                </div>
                {renderVideos({
                  videos: playlistVideos,
                  arePlaylistVideos: true
                })}
                {playlistVideosLoadMoreShown && (
                  <LoadMoreButton
                    loading={playlistVideosLoading}
                    onClick={handleLoadMorePlaylistVideos}
                    color="green"
                    filled
                    style={{ marginTop: '1.5rem', width: '100%' }}
                  />
                )}
              </div>
            </section>
          )}
          {relatedVideos.length > 0 && (
            <section key={videoId + 'related videos'}>
              <div
                className={css`
                  background: #fff;
                  border-radius: ${borderRadius};
                  padding: 1.25rem;
                  @media (max-width: ${tabletMaxWidth}) {
                    padding: 1rem;
                  }
                `}
              >
                <p>{relatedVideosLabel}</p>
                {renderVideos({ videos: relatedVideos })}
              </div>
            </section>
          )}
          {otherVideos.length > 0 && (
            <section key={videoId + 'new videos'}>
              <div
                className={css`
                  background: #fff;
                  border-radius: ${borderRadius};
                  padding: 1.25rem;
                  @media (max-width: ${tabletMaxWidth}) {
                    padding: 1rem;
                  }
                `}
              >
                <p>{newVideosLabel}</p>
                {renderVideos({ videos: otherVideos })}
              </div>
            </section>
          )}
        </>
      )}
      {!videoTabActive && (
        <div
          className={css`
            background: #fff;
            border-radius: ${borderRadius};
            padding: 0.75rem;
          `}
        >
          <Notification style={{ paddingTop: 0 }} />
        </div>
      )}
      <div style={{ height: '1rem', marginTop: '-1rem' }} />
    </ErrorBoundary>
  );

  async function handleLoadRewards() {
    const {
      rewards,
      loadMoreRewards,
      totalRewardedTwinkles,
      totalRewardedTwinkleCoins
    } = await loadRewards();
    onLoadRewards({
      rewards,
      loadMoreRewards,
      totalRewardedTwinkles,
      totalRewardedTwinkleCoins,
      userId
    });
  }

  async function handleToggleHideWatched() {
    setFiltering(true);
    const hideWatched = await toggleHideWatched();
    onToggleHideWatched(hideWatched);
    setFiltering(false);
  }

  async function handleLoadMorePlaylistVideos() {
    setPlaylistVideosLoading(true);
    const shownVideos = queryStringForArray({
      array: playlistVideos,
      originVar: 'videoId',
      destinationVar: 'shownVideos'
    });
    try {
      const {
        data: {
          playlistVideos: newPlaylistVideos,
          playlistVideosLoadMoreShown: shown
        }
      } = await request.get(
        `${URL}/video/more/playlistVideos?videoId=${videoId}&playlistId=${playlistId}&${shownVideos}`,
        auth()
      );
      setPlaylistVideosLoading(false);
      onSetNavVideoState({
        playlistVideos: playlistVideos.concat(newPlaylistVideos)
      });
      setPlaylistVideosLoadMoreShown(shown);
    } catch (error) {
      console.error(error);
    }
  }

  function renderVideos({
    videos,
    areContinueWatchingVideos,
    arePlaylistVideos
  }: {
    videos: any[];
    areContinueWatchingVideos?: boolean;
    arePlaylistVideos?: boolean;
  }) {
    return videos.map((video, index) => (
      <div
        key={video?.id}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          width: '100%',
          marginTop: index !== 0 ? '1rem' : 0
        }}
      >
        <div style={{ width: '50%' }}>
          <div style={{ overflow: 'hidden', borderRadius }}>
            <Link
              to={`/videos/${video.videoId}${
                arePlaylistVideos
                  ? `?playlist=${playlistId}`
                  : areContinueWatchingVideos
                  ? '?continue=true'
                  : ''
              }`}
            >
              <VideoThumbImage
                rewardLevel={video.rewardLevel}
                videoId={video.videoId}
                src={`https://img.youtube.com/vi/${video.content}/mqdefault.jpg`}
              />
            </Link>
          </div>
        </div>
        <div
          style={{
            paddingLeft: '1rem',
            width: '50%',
            lineHeight: 1.1,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            marginTop: '-0.5rem'
          }}
        >
          <Link
            to={`/videos/${video.videoId}${
              arePlaylistVideos ? `?playlist=${playlistId}` : ''
            }`}
            style={{
              color: video.byUser ? Color[userLinkColor]() : Color[linkColor]()
            }}
          >
            {video.title}
          </Link>
          <small
            style={{
              color: Color.gray(),
              display: 'block',
              fontSize: '1.3rem',
              marginTop: '1rem'
            }}
          >
            {uploadedByLabel} {video.username}
          </small>
        </div>
      </div>
    ));
  }
}
