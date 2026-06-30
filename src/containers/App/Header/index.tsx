import React, { Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { css } from '@emotion/css';

import ErrorBoundary from '~/components/ErrorBoundary';
import { capitalize } from '~/helpers/stringHelpers';
import {
  lazyWithRetry,
  recoverFromLazyImportLoadError
} from '~/helpers/lazyImportHelpers';
import { getSectionFromPathname } from '~/helpers';
import TwinkleLogo from './TwinkleLogo';
import MainNavs from './MainNavs';
import AccountMenu from './AccountMenu';
import useIsAIChat from '../hooks/useIsAIChat';

import { Color, mobileMaxWidth, desktopMinWidth } from '~/constants/css';
import { APP_SHELL_HEADER_OFFSET_FALLBACK } from '~/constants/appShell';

import {
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE,
  DEFAULT_PROFILE_THEME
} from '~/constants/defaultValues';

import {
  useViewContext,
  useNotiContext,
  useChatContext,
  useKeyContext
} from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

const BalanceModal = lazyWithRetry(() => import('./BalanceModal'));

interface HeaderProps {
  onMobileMenuOpen: any;
  style?: React.CSSProperties;
}

const contentSubsectionTitles: Record<string, string> = {
  comments: 'Comment',
  links: 'Link',
  missions: 'Mission',
  playlists: 'Playlist',
  subjects: 'Subject',
  videos: 'Video',
  'ai-cards': 'AI Card',
  'ai-stories': 'AI Story',
  'daily-reflections': 'Daily Reflection',
  'mission-passes': 'Mission Pass',
  'achievement-unlocks': 'Achievement',
  'daily-rewards': 'Daily Goal',
  'shared-prompts': 'Shared Prompt'
};

export default function Header({
  onMobileMenuOpen,
  style = {}
}: HeaderProps) {
  const [balanceModalShown, setBalanceModalShown] = useState(false);

  const { pathname = '', search = '' } = useLocation();

  const pageTitle = useViewContext((v) => v.state.pageTitle);
  const onSetAiFeaturesDisabled = useViewContext(
    (v) => v.actions.onSetAiFeaturesDisabled
  );
  const searchFilter = useKeyContext((v) => v.myState.searchFilter);
  const userId = useKeyContext((v) => v.myState.userId);
  const loggedIn = useKeyContext((v) => v.myState.loggedIn);
  const viewerTheme =
    useKeyContext((v) => v.myState.profileTheme) || DEFAULT_PROFILE_THEME;
  const headerRole = useRoleColor('header', {
    fallback: 'white',
    themeName: viewerTheme
  });
  const headerColor = headerRole.getColor() || Color.white();
  const chatType = useChatContext((v) => v.state.chatType);
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

  const totalRewardedTwinkles = myRewardStats?.totalRewardedTwinkles || 0;

  const totalRewardedTwinkleCoins =
    myRewardStats?.totalRewardedTwinkleCoins || 0;

  const isAIChat = useIsAIChat();

  useEffect(() => {
    let cancelled = false;

    initAiFeatureFlags();

    async function initAiFeatureFlags() {
      try {
        const { default: loadAiFeatureFlags } = await import(
          './requestHelpers/loadAiFeatureFlags'
        );
        const { aiFeaturesDisabled } = await loadAiFeatureFlags();
        if (!cancelled) {
          onSetAiFeaturesDisabled(aiFeaturesDisabled);
        }
      } catch (error) {
        if (await recoverFromLazyImportLoadError(error)) return;
        console.error('Failed to load AI feature flags:', error);
        if (!cancelled) {
          onSetAiFeaturesDisabled(true);
        }
      }
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const subsectionTitle = isSubsection
          ? contentSubsectionTitles[section]
          : '';
        const displayedSection =
          subsectionTitle ||
          (section === 'ai-cards'
            ? 'Explore AI Cards'
            : section === 'ai-stories'
            ? 'AI Stories'
            : section);
        currentPageTitle = `${
          subsectionTitle ? displayedSection : capitalize(displayedSection)
        } | ${currentPageTitle}`;
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
    <ErrorBoundary
      componentPath="App/Header/index"
    >
      <nav
        data-app-shell-header="true"
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
          height: ${APP_SHELL_HEADER_OFFSET_FALLBACK};
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
        <Suspense fallback={null}>
          <BalanceModal onHide={() => setBalanceModalShown(false)} />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
