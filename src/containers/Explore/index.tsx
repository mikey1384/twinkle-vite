import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { css } from '@emotion/css';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useExploreContext, useKeyContext } from '~/contexts';
import DisplayedContent from './DisplayedContent';
import ErrorBoundary from '~/components/ErrorBoundary';
import Notification from '~/components/Notification';
import SideMenu from '~/components/SideMenu';
import Search from './Search';
import Categories from './Categories';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import { isTablet } from '~/helpers';

const deviceIsTablet = isTablet(navigator);
const aiCardsLabel = localize('aiCards');
const subjectsLabel = localize('subjects');
const videosLabel = localize('videos2');
const linksLabel = localize('links');

export default function Explore({ category }: { category: string }) {
  const searchText = useExploreContext((v) => v.state.search.searchText);
  const onSetPrevUserId = useExploreContext((v) => v.actions.onSetPrevUserId);
  const userId = useKeyContext((v) => v.myState.userId);
  const ContainerRef: React.RefObject<any> = useRef({});
  const SearchBoxRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    onSetPrevUserId(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <ErrorBoundary componentPath="Explore/index">
      <div
        ref={ContainerRef}
        className={css`
          width: 100%;
          display: flex;
          @media (max-width: ${mobileMaxWidth}) {
            margin-top: 0;
          }
        `}
      >
        <SideMenu>
          <NavLink
            to="/ai-cards"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="cards-blank" />
            <span style={{ marginLeft: '1.1rem' }}>{aiCardsLabel}</span>
          </NavLink>
          <NavLink
            to="/subjects"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="bolt" />
            <span style={{ marginLeft: '1.1rem' }}>{subjectsLabel}</span>
          </NavLink>
          <NavLink
            to="/videos"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="film" />
            <span style={{ marginLeft: '1.1rem' }}>{videosLabel}</span>
          </NavLink>
          <NavLink
            to="/links"
            className={(navData) => (navData.isActive ? 'active' : '')}
          >
            <Icon icon="book" />
            <span style={{ marginLeft: '1.1rem' }}>{linksLabel}</span>
          </NavLink>
        </SideMenu>
        <div
          className={css`
            width: CALC(100vw - 51rem - 2rem);
            margin-left: 20rem;
            @media (max-width: ${tabletMaxWidth}) {
              width: CALC(100vw - 21rem);
            }
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
              margin-top: 0;
              margin-left: 0;
              margin-right: 0;
            }
          `}
        >
          {(stringIsEmpty(searchText) || category === 'ai-cards') && (
            <Categories
              style={{ marginTop: '5rem', marginBottom: '3rem' }}
              filter={category}
              onSetDefaultSearchFilter={handleSetDefaultSearchFilter}
            />
          )}
          {category !== 'ai-cards' && (
            <Search
              innerRef={SearchBoxRef}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                marginBottom: '3rem'
              }}
            />
          )}
          <DisplayedContent category={category} />
          <Categories
            style={{ marginTop: '3rem', marginBottom: '4rem' }}
            filter={category}
          />
          <div
            className={css`
              display: none;
              @media (max-width: ${mobileMaxWidth}) {
                display: block;
                width: 100%;
                height: 5rem;
              }
            `}
          />
        </div>
        {!deviceIsTablet && (
          <Notification
            trackScrollPosition
            className={css`
              width: 31rem;
              overflow-y: scroll;
              -webkit-overflow-scrolling: touch;
              right: 1rem;
              top: 4.5rem;
              bottom: 0;
              position: absolute;
              @media (max-width: ${tabletMaxWidth}) {
                width: 20rem;
              }
              @media (max-width: ${mobileMaxWidth}) {
                display: none;
              }
            `}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleSetDefaultSearchFilter() {
    if (stringIsEmpty(searchText)) {
      SearchBoxRef.current?.focus();
    }
  }
}
