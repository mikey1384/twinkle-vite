import React from 'react';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import { useChatContext } from '~/contexts';
import { css } from '@emotion/css';

export default function Tabs({ style }: { style?: React.CSSProperties }) {
  const favoriteChannelIds = useChatContext((v) => v.state.favoriteChannelIds);
  const classChannelIds = useChatContext((v) => v.state.classChannelIds);
  const selectedChatTab = useChatContext((v) => v.state.selectedChatTab);
  const onSelectChatTab = useChatContext((v) => v.actions.onSelectChatTab);
  if (!favoriteChannelIds?.length && !classChannelIds?.length) return null;

  return (
    <FilterBar
      className={css`
        padding-inline: 0.8rem;
        > .nav-section {
          min-width: 0;
          gap: 0.3rem;
        }
        > .nav-section > nav {
          min-width: 0;
          padding: 0.8rem 0.6rem;
        }
        @container chat-channels (max-width: 180px) {
          padding-inline: 0.3rem;
          > .nav-section { gap: 0; }
          > .nav-section > nav { padding-inline: 0.3rem; }
        }
        @media (pointer: coarse) {
          > .nav-section > nav { min-height: 44px; }
        }
      `}
      style={{
        fontSize: '1.6rem',
        height: '4rem',
        ...style
      }}
    >
      <nav
        role="button"
        tabIndex={0}
        aria-label="All channels"
        aria-pressed={selectedChatTab === 'home'}
        title="All channels"
        className={selectedChatTab === 'home' ? 'active' : ''}
        onClick={() => onSelectChatTab('home')}
        onKeyDown={(event) => handleKeyDown(event, 'home')}
      >
        <Icon icon="home" />
      </nav>
      {favoriteChannelIds.length > 0 && (
        <nav
          role="button"
          tabIndex={0}
          aria-label="Favorite channels"
          aria-pressed={selectedChatTab === 'favorite'}
          title="Favorite channels"
          className={selectedChatTab === 'favorite' ? 'active' : ''}
          onClick={() => onSelectChatTab('favorite')}
          onKeyDown={(event) => handleKeyDown(event, 'favorite')}
        >
          <Icon icon="star" />
        </nav>
      )}
      {classChannelIds.length > 0 && (
        <nav
          role="button"
          tabIndex={0}
          aria-label="Class channels"
          aria-pressed={selectedChatTab === 'class'}
          title="Class channels"
          className={selectedChatTab === 'class' ? 'active' : ''}
          onClick={() => onSelectChatTab('class')}
          onKeyDown={(event) => handleKeyDown(event, 'class')}
        >
          <Icon icon="chalkboard-teacher" />
        </nav>
      )}
    </FilterBar>
  );

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    tab: 'home' | 'favorite' | 'class'
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectChatTab(tab);
    }
  }
}
