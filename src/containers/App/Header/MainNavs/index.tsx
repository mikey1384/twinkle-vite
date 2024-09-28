import React, { useEffect, useMemo, useRef } from 'react';
import Nav from './Nav';
import MobileSideMenuNav from './MobileSideMenuNav';
import Icon from '~/components/Icon';
import { matchPath } from 'react-router-dom';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { getSectionFromPathname, isTablet } from '~/helpers';
import { AI_CARD_CHAT_TYPE, VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import { truncateText } from '~/helpers/stringHelpers';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useViewContext,
  useKeyContext
} from '~/contexts';
import { socket } from '~/constants/sockets/api';
import localize from '~/constants/localize';

const deviceIsTablet = isTablet(navigator);
const homeLabel = localize('home');
const exploreLabel = localize('explore');
const missionsLabel = localize('missions');
const chatLabel = localize('chat');

export default function MainNavs({
  isAIChat,
  loggedIn,
  numChatUnreads,
  numNewNotis,
  numNewPosts,
  onMobileMenuOpen,
  pathname,
  search,
  defaultSearchFilter,
  totalRewardAmount,
  onSetBalanceModalShown
}: {
  isAIChat: boolean;
  loggedIn: boolean;
  numChatUnreads: number;
  numNewNotis: number;
  numNewPosts: number;
  onMobileMenuOpen: () => void;
  pathname: string;
  search: string;
  defaultSearchFilter: string;
  onSetBalanceModalShown: () => void;
  totalRewardAmount: number;
}) {
  const { twinkleCoins, userId, banned, lastChatPath } = useKeyContext(
    (v) => v.myState
  );
  const exploreCategory = useViewContext((v) => v.state.exploreCategory);
  const contentPath = useViewContext((v) => v.state.contentPath);
  const contentNav = useViewContext((v) => v.state.contentNav);
  const profileNav = useViewContext((v) => v.state.profileNav);
  const homeNav = useViewContext((v) => v.state.homeNav);
  const onSetExploreCategory = useViewContext(
    (v) => v.actions.onSetExploreCategory
  );
  const onSetContentPath = useViewContext((v) => v.actions.onSetContentPath);
  const onSetContentNav = useViewContext((v) => v.actions.onSetContentNav);
  const onSetProfileNav = useViewContext((v) => v.actions.onSetProfileNav);
  const onSetHomeNav = useViewContext((v) => v.actions.onSetHomeNav);

  const onSetLastChatPath = useAppContext(
    (v) => v.user.actions.onSetLastChatPath
  );
  const feedsOutdated = useHomeContext((v) => v.state.feedsOutdated);
  const chatType = useChatContext((v) => v.state.chatType);
  const chatLoaded = useChatContext((v) => v.state.loaded);
  const loaded = useRef(false);

  const contentLabel = useMemo(() => {
    if (!contentNav) return null;
    return localize(contentNav.substring(0, contentNav.length - 1));
  }, [contentNav]);

  const displayedTwinkleCoins = useMemo(() => {
    if (twinkleCoins > 999) {
      if (twinkleCoins > 999999) {
        return `${(twinkleCoins / 1000000).toFixed(1)}M`;
      }
      return `${(twinkleCoins / 1000).toFixed(1)}K`;
    }
    return twinkleCoins;
  }, [twinkleCoins]);

  const chatMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/chat/*'
        },
        pathname
      ),
    [pathname]
  );

  const homeMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/'
        },
        pathname
      ),
    [pathname]
  );

  const usersMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/users'
        },
        pathname
      ),
    [pathname]
  );

  const earnMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/earn'
        },
        pathname
      ),
    [pathname]
  );

  const achievementsMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/achievements'
        },
        pathname
      ),
    [pathname]
  );

  const groupsMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/groups'
        },
        pathname
      ),
    [pathname]
  );

  const storeMatch = useMemo(
    () =>
      matchPath(
        {
          path: '/settings'
        },
        pathname
      ),
    [pathname]
  );

  const contentPageMatch = useMemo(() => {
    const cardPageMatch = matchPath(
      {
        path: '/ai-cards/:id'
      },
      pathname
    );
    const subjectPageMatch = matchPath(
      {
        path: '/subjects/:id'
      },
      pathname
    );
    const playlistsMatch = matchPath(
      {
        path: '/playlists/:id'
      },
      pathname
    );
    const videoPageMatch = matchPath(
      {
        path: '/videos/:id'
      },
      pathname
    );
    const videoQuestionPageMatch = matchPath(
      {
        path: '/videos/:id/questions'
      },
      pathname
    );
    const linkPageMatch = matchPath(
      {
        path: '/links/:id'
      },
      pathname
    );
    const commentPageMatch = matchPath(
      {
        path: '/comments/:id'
      },
      pathname
    );
    const missionPageMatch = matchPath(
      {
        path: '/missions/:missionType/*'
      },
      pathname
    );

    return (
      !!cardPageMatch ||
      !!subjectPageMatch ||
      !!playlistsMatch ||
      !!videoPageMatch ||
      !!videoQuestionPageMatch ||
      !!linkPageMatch ||
      !!commentPageMatch ||
      !!missionPageMatch
    );
  }, [pathname]);

  const profilePageMatch = matchPath(
    {
      path: '/users/:userId/*'
    },
    pathname
  );

  useEffect(() => {
    const { section } = getSectionFromPathname(pathname);
    if (homeMatch) {
      onSetHomeNav('/');
    } else if (usersMatch) {
      onSetHomeNav('/users');
    } else if (earnMatch) {
      onSetHomeNav('/earn');
    } else if (groupsMatch) {
      onSetHomeNav('/groups');
    } else if (storeMatch) {
      onSetHomeNav('/settings');
    } else if (achievementsMatch) {
      onSetHomeNav('/achievements');
    }

    if (chatMatch) {
      const lastChatPathArray = pathname.split('chat/');
      const path = lastChatPathArray?.[1] || '';
      onSetLastChatPath(`/${path}`);
    }

    if (contentPageMatch) {
      if (contentNav !== section) {
        onSetContentNav(section);
      }
      onSetContentPath(pathname.substring(1) + search || '');
    }

    if (profilePageMatch) {
      onSetProfileNav(pathname);
    }
    if (['links', 'videos', 'subjects', 'ai-cards'].includes(section)) {
      onSetExploreCategory(`${section}${search ? `/${search}` : ''}`);
      loaded.current = true;
    } else if (!loaded.current && defaultSearchFilter) {
      onSetExploreCategory(
        ['videos', 'subjects', 'links', 'ai-cards'].includes(
          defaultSearchFilter
        )
          ? defaultSearchFilter
          : 'subjects'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSearchFilter, pathname, search]);

  const contentIconType = useMemo(
    () =>
      contentNav === 'videos' || contentNav === 'playlists'
        ? 'film'
        : contentNav === 'ai-cards'
        ? 'cards-blank'
        : contentNav === 'links'
        ? 'book'
        : contentNav === 'subjects'
        ? 'bolt'
        : contentNav === 'missions'
        ? 'clipboard-check'
        : 'comment-alt',
    [contentNav]
  );

  const profileUsername = useMemo(() => {
    let result = '';
    if (profileNav) {
      const splitProfileNav = profileNav.split('/users/')[1].split('/');
      result = splitProfileNav[0];
    }
    return result;
  }, [profileNav]);

  const chatAlertShown = useMemo(
    () => loggedIn && !chatMatch && numChatUnreads > 0,
    [chatMatch, loggedIn, numChatUnreads]
  );

  const chatButtonPath = useMemo(() => {
    return `/chat${
      chatLoaded
        ? chatType === VOCAB_CHAT_TYPE
          ? `/${VOCAB_CHAT_TYPE}`
          : chatType === AI_CARD_CHAT_TYPE
          ? `/${AI_CARD_CHAT_TYPE}`
          : lastChatPath || ''
        : ''
    }`;
  }, [chatLoaded, chatType, lastChatPath]);

  useEffect(() => {
    socket.emit('change_busy_status', !chatMatch || isAIChat);
  }, [chatMatch, isAIChat]);

  return (
    <div
      className={css`
        padding: 0;
        display: flex;
        justify-content: center;
        width: auto;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      <MobileSideMenuNav
        alert={numNewNotis > 0 || totalRewardAmount > 0}
        onClick={onMobileMenuOpen}
      />
      {profileNav && <Nav to={profileNav} className="mobile" imgLabel="user" />}
      <Nav
        to={homeNav}
        isHome
        isUsingChat={!!chatMatch}
        className="mobile"
        imgLabel="home"
        alert={pathname === '/' && (numNewPosts > 0 || feedsOutdated)}
      />
      <Nav to={`/${exploreCategory}`} className="mobile" imgLabel="search" />
      {contentNav && (
        <Nav
          to={`/${contentPath}`}
          className="mobile"
          imgLabel={contentIconType}
        />
      )}
      <Nav to={`/missions`} className="mobile" imgLabel="tasks" />
      {!banned?.chat && (
        <Nav
          to={chatButtonPath}
          className="mobile"
          imgLabel="comments"
          alert={chatAlertShown}
        />
      )}
      {profileNav && (
        <Nav
          to={profileNav}
          profileUsername={profileUsername}
          className="desktop"
          style={{ marginRight: '2rem' }}
          imgLabel="user"
        >
          {truncateText({ text: profileUsername.toUpperCase(), limit: 7 })}
        </Nav>
      )}
      <Nav
        to={homeNav}
        isHome
        isUsingChat={!!chatMatch}
        className="desktop"
        imgLabel="home"
        alert={pathname === '/' && !usersMatch && numNewPosts > 0}
      >
        {deviceIsTablet ? '' : homeLabel}
        {pathname === '/' && !usersMatch && numNewPosts > 0
          ? ` (${numNewPosts})`
          : ''}
      </Nav>
      <Nav
        to={`/${exploreCategory}`}
        className="desktop"
        style={{ marginLeft: '2rem' }}
        imgLabel="search"
      >
        {deviceIsTablet ? '' : exploreLabel}
      </Nav>
      {contentNav && (
        <Nav
          to={`/${contentPath}`}
          className="desktop"
          style={{ marginLeft: '2rem' }}
          imgLabel={contentIconType}
        >
          {deviceIsTablet ? '' : contentLabel}
        </Nav>
      )}
      <Nav
        to={`/missions`}
        className="desktop"
        style={{ marginLeft: '2rem' }}
        imgLabel="tasks"
      >
        {deviceIsTablet ? '' : missionsLabel}
      </Nav>
      <div
        className={css`
          margin-left: 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            margin-left: 0;
          }
        `}
      >
        {!banned?.chat && (
          <Nav
            to={chatButtonPath}
            className="desktop"
            imgLabel="comments"
            alert={chatAlertShown}
          >
            {deviceIsTablet ? '' : chatLabel}
          </Nav>
        )}
      </div>
      {userId && (
        <div
          className={`mobile ${css`
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.3rem;
            }
          `}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingRight: '1rem'
          }}
          onClick={onSetBalanceModalShown}
        >
          <Icon
            style={{ marginRight: '0.5rem' }}
            icon={['far', 'badge-dollar']}
          />
          {typeof twinkleCoins === 'number' ? (
            displayedTwinkleCoins
          ) : (
            <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
          )}
        </div>
      )}
    </div>
  );
}
