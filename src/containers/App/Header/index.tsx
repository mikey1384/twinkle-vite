import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { css } from '@emotion/css';

import ErrorBoundary from '~/components/ErrorBoundary';
import { capitalize } from '~/helpers/stringHelpers';
import { getSectionFromPathname } from '~/helpers';
import TwinkleLogo from './TwinkleLogo';
import MainNavs from './MainNavs';
import AccountMenu from './AccountMenu';
import BalanceModal from './BalanceModal';
import useAPISocket from './useAPISocket';

import { Color, mobileMaxWidth, desktopMinWidth } from '~/constants/css';
import { userIdRef } from '~/constants/state';

import {
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID,
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE,
  DEFAULT_PROFILE_THEME
} from '~/constants/defaultValues';

import { User } from '~/types';

import {
  useViewContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

interface HeaderProps {
  onInit: () => void;
  onMobileMenuOpen: any;
  style?: React.CSSProperties;
}

export default function Header({
  onInit,
  onMobileMenuOpen,
  style = {}
}: HeaderProps) {
  const [balanceModalShown, setBalanceModalShown] = useState(false);

  const { pathname = '', search = '' } = useLocation();

  const pageTitle = useViewContext((v) => v.state.pageTitle);
  const searchFilter = useKeyContext((v) => v.myState.searchFilter);
  const userId = useKeyContext((v) => v.myState.userId);
  const loggedIn = useKeyContext((v) => v.myState.loggedIn);
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const viewerTheme =
    useKeyContext((v) => v.myState.profileTheme) || DEFAULT_PROFILE_THEME;
  const headerRole = useRoleColor('header', {
    fallback: 'white',
    themeName: viewerTheme
  });
  const headerColor = headerRole.getColor() || Color.white();
  const chatType = useChatContext((v) => v.state.chatType);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const numUnreads = useChatContext((v) => v.state.numUnreads);
  const onGetNumberOfUnreadMessages = useChatContext(
    (v) => v.actions.onGetNumberOfUnreadMessages
  );
  const numNewNotis = useNotiContext((v) => v.state.numNewNotis);
  const numNewPosts = useNotiContext((v) => v.state.numNewPosts);
  const myRewardStats = useNotiContext((v) =>
    userId ? v.state?.notiObj?.[userId] : null
  );
  const versionMatch = useNotiContext((v) => v.state.versionMatch);
  const onShowUpdateNotice = useNotiContext(
    (v) => v.actions.onShowUpdateNotice
  );

  const currentPathId = useMemo(
    () => pathname?.split('chat/')[1]?.split('/')?.[0],
    [pathname]
  );

  const subchannelPath = useMemo(() => {
    if (!currentPathId) return null;
    const [, result] = pathname?.split(currentPathId)?.[1]?.split('/') || [];
    return result;
  }, [currentPathId, pathname]);

  const currentChannel = useMemo<{
    subchannelObj: Record<string, any>;
    twoPeople: boolean;
    members: User[];
  }>(
    () => channelsObj[selectedChannelId] || {},
    [channelsObj, selectedChannelId]
  );

  const subchannelId = useMemo(() => {
    if (!subchannelPath || !currentChannel?.subchannelObj) return null;
    for (const subchannel of Object.values(currentChannel?.subchannelObj)) {
      if (subchannel.path === subchannelPath) {
        return subchannel.id;
      }
    }
    return null;
  }, [currentChannel?.subchannelObj, subchannelPath]);

  const totalRewardedTwinkles = myRewardStats?.totalRewardedTwinkles || 0;

  const totalRewardedTwinkleCoins =
    myRewardStats?.totalRewardedTwinkleCoins || 0;

  const partner = useMemo(() => {
    return currentChannel?.twoPeople
      ? currentChannel?.members?.filter(
          (member) => Number(member.id) !== userId
        )?.[0]
      : null;
  }, [currentChannel?.members, currentChannel?.twoPeople, userId]);

  const isAIChat = useMemo(() => {
    return partner?.id === ZERO_TWINKLE_ID || partner?.id === CIEL_TWINKLE_ID;
  }, [partner?.id]);

  useAPISocket({
    chatType,
    currentPathId,
    channelsObj,
    isAIChat,
    onInit,
    pathname,
    selectedChannelId,
    subchannelId,
    subchannelPath
  });

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    const { section, isSubsection } = getSectionFromPathname(pathname) || {};
    const newNotiNum =
      (pathname === '/' ? numNewPosts : 0) + numNewNotis + numUnreads;
    if (section === 'chat') {
      if (chatType === VOCAB_CHAT_TYPE) {
        document.title = `${`Vocabulary | Twinkle`}${
          newNotiNum > 0 ? ' *' : ''
        }`;
      } else if (chatType === AI_CARD_CHAT_TYPE) {
        document.title = `${`AI Cards | Twinkle`}${newNotiNum > 0 ? ' *' : ''}`;
      } else {
        document.title = `${`Chat | Twinkle`}${newNotiNum > 0 ? ' *' : ''}`;
      }
      onGetNumberOfUnreadMessages(0);
    } else if (
      !['chat', 'comments', 'subjects', 'ai-cards'].includes(section) &&
      isSubsection &&
      !!pageTitle
    ) {
      document.title = `${pageTitle}${newNotiNum > 0 ? ' *' : ''}`;
    } else {
      let currentPageTitle = 'Twinkle';
      if (section !== 'home') {
        const displayedSection =
          section === 'ai-cards'
            ? 'Explore AI Cards'
            : section === 'ai-stories'
            ? 'AI Stories'
            : section;
        currentPageTitle = `${capitalize(
          displayedSection
        )} | ${currentPageTitle}`;
      }
      document.title = `${currentPageTitle}${newNotiNum > 0 ? ' *' : ''}`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numNewNotis, numNewPosts, numUnreads, pathname, pageTitle, chatType]);

  useEffect(() => {
    onShowUpdateNotice(!versionMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionMatch]);

  return (
    <ErrorBoundary componentPath="App/Header/index">
      <nav
        className={`notranslate unselectable ${css`
          z-index: 99999;
          position: relative;
          font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
          font-size: 1.7rem;
          background: ${headerColor};
          display: flex;
          box-shadow: none;
          align-items: center;
          width: 100%;
          margin-bottom: 0px;
          height: 4.5rem;
          &::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 1px;
            pointer-events: none;
            background: var(--ui-border);
            @media (max-width: ${mobileMaxWidth}) {
              display: none;
            }
          }
          @media (min-width: ${desktopMinWidth}) {
            top: 0;
          }
          @media (max-width: ${mobileMaxWidth}) {
            bottom: 0;
            box-shadow: none;
            height: var(--mobile-nav-height, 7rem);
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        `}`}
        style={{
          justifyContent: 'space-around',
          position: 'fixed',
          ...style
        }}
        translate="no"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <TwinkleLogo style={{ marginLeft: '3rem' }} />
          <MainNavs
            isAIChat={isAIChat}
            loggedIn={loggedIn}
            defaultSearchFilter={searchFilter}
            numChatUnreads={numUnreads}
            numNewNotis={numNewNotis}
            numNewPosts={numNewPosts}
            onMobileMenuOpen={onMobileMenuOpen}
            pathname={pathname}
            search={search}
            onSetBalanceModalShown={() => setBalanceModalShown(true)}
            totalRewardAmount={
              totalRewardedTwinkles + totalRewardedTwinkleCoins
            }
          />
          <AccountMenu
            onSetBalanceModalShown={() => setBalanceModalShown(true)}
            className={css`
              margin-right: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-right: 0;
              }
            `}
          />
        </div>
      </nav>
      {balanceModalShown && (
        <BalanceModal onHide={() => setBalanceModalShown(false)} />
      )}
    </ErrorBoundary>
  );
}
