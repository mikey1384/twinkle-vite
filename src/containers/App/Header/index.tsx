import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import {
  isScrollDiagnosticsLoggingEnabled,
  recordScrollDiagnostic
} from '~/helpers/scrollAnchorDiagnostics';

import ErrorBoundary from '~/components/ErrorBoundary';
import {
  lazyWithRetry,
  recoverFromLazyImportLoadError
} from '~/helpers/lazyImportHelpers';
import { getSectionFromPathname } from '~/helpers';
import { getBasePageTitle } from '~/helpers/analytics';
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

function isBuildAppRuntimePathname(pathname: string) {
  return /^\/app\/\d+(?:\/|$)/.test(pathname);
}

interface HeaderProps {
  onMobileMenuOpen: any;
  style?: React.CSSProperties;
}

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
    if (isBuildAppRuntimePathname(pathname)) return;
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
      document.title = `${getBasePageTitle(pathname)}${
        newNotiNum > 0 ? ' *' : ''
      }`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numNewNotis, numNewPosts, numUnreads, pathname, pageTitle, chatType]);

  useEffect(() => {
    onShowUpdateNotice(!versionMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionMatch]);

  const navRef = useRef<HTMLElement | null>(null);

  // Diagnostics for intermittent dead taps on the mobile bottom nav: window
  // capture listeners record every pointerdown/click landing within the nav's
  // rect (regardless of the event's target, so overlay interception is
  // visible too). A pointerdown without a matching click means the tap was
  // consumed after dispatch; correlate timestamps against restore events in
  // the same ring buffer. No-op unless scroll diagnostics logging is enabled.
  useEffect(() => {
    window.addEventListener('pointerdown', handleNavDiagnosticPointerDown, {
      capture: true,
      passive: true
    });
    window.addEventListener('click', handleNavDiagnosticClick, {
      capture: true
    });

    return () => {
      window.removeEventListener(
        'pointerdown',
        handleNavDiagnosticPointerDown,
        { capture: true }
      );
      window.removeEventListener('click', handleNavDiagnosticClick, {
        capture: true
      });
    };

    function handleNavDiagnosticPointerDown(event: PointerEvent) {
      recordNavDiagnostic('nav-pointerdown', event, event.pointerType || '');
    }

    function handleNavDiagnosticClick(event: MouseEvent) {
      recordNavDiagnostic('nav-click', event, '');
    }

    function recordNavDiagnostic(
      type: string,
      event: MouseEvent,
      reason: string
    ) {
      if (!isScrollDiagnosticsLoggingEnabled()) return;
      const nav = navRef.current;
      if (!nav) return;
      const rect = nav.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) return;
      const targetElement =
        event.target instanceof HTMLElement ? event.target : null;
      const link = targetElement?.closest('a');
      const targetNote = link
        ? `link:${link.getAttribute('href') || ''}`
        : `target:${targetElement?.tagName || 'unknown'}`;
      recordScrollDiagnostic({
        type,
        reason,
        scrollTop: Math.round(getNavDiagnosticScrollTop()),
        note: nav.contains(targetElement)
          ? targetNote
          : `${targetNote}:outside-nav`
      });
    }

    function getNavDiagnosticScrollTop() {
      const appScroller = document.getElementById('App');
      const bodyScroller = document.scrollingElement;
      return Math.max(
        appScroller?.scrollTop || 0,
        bodyScroller?.scrollTop || 0
      );
    }
  }, []);

  return (
    <ErrorBoundary
      componentPath="App/Header/index"
    >
      <nav
        ref={navRef}
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
          <TwinkleLogo style={{ marginLeft: '3rem', flexShrink: 0 }} />
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
              flex-shrink: 0;
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
