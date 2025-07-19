import React, { useEffect, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import SwitchButton from '~/components/Buttons/SwitchButton';
import FilterBar from '~/components/FilterBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const allPostsLabel = localize('allPosts');
const subjectsLabel = localize('subjects');
const postsLabel = localize('posts');
const newToOldLabel = localize('newToOld');
const oldToNewLabel = localize('oldToNew');
const recommendedLabel = localize('recommended');
const xpVideosLabel = localize('xpVideos');
const hideWatchedLabel = localize('hideWatched');
const categoryObj: Record<string, any> = {
  uploads: {
    label: postsLabel,
    desc: newToOldLabel,
    asc: oldToNewLabel
  },
  recommended: {
    label: recommendedLabel
  },
  videos: {
    label: xpVideosLabel
  }
};

export default function HomeFilter({
  applyFilter,
  category,
  changeCategory,
  displayOrder,
  selectedFilter,
  setDisplayOrder
}: {
  applyFilter: (arg0: string) => void;
  category: string;
  changeCategory: (arg0: string) => void;
  displayOrder: string;
  setDisplayOrder: (arg0: string) => void;
  selectedFilter: string;
}) {
  const onToggleHideWatched = useAppContext(
    (v) => v.user.actions.onToggleHideWatched
  );
  const toggleHideWatched = useAppContext(
    (v) => v.requestHelpers.toggleHideWatched
  );
  const hideWatched = useKeyContext((v) => v.myState.hideWatched);
  const userId = useKeyContext((v) => v.myState.userId);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    setActiveTab(category);
  }, [category]);

  return (
    <ErrorBoundary componentPath="Home/Stories/HomeFilter">
      <FilterBar
        inverted
        bordered
        style={{
          height: '4rem',
          fontSize: '1.6rem'
        }}
      >
        {['uploads', 'recommended', 'videos'].map((elem) => (
          <nav
            key={elem}
            className={activeTab === elem ? 'active' : ''}
            style={{ width: elem !== 'recommended' ? '70%' : '100%' }}
            onClick={() => {
              const appElement = document.getElementById('App');
              if (appElement) appElement.scrollTop = 0;
              changeCategory(elem);
            }}
          >
            {categoryObj[elem].label}
          </nav>
        ))}
      </FilterBar>
      {(activeTab === 'uploads' || (category === 'videos' && userId)) && (
        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '1rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            {category === 'uploads' && (
              <FilterBar
                bordered
                style={{
                  height: '5rem',
                  fontSize: '1.6rem',
                  marginBottom: 0
                }}
                dropdownButton={
                  <DropdownButton
                    skeuomorphic
                    className={css`
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1.2rem !important;
                      }
                    `}
                    icon="caret-down"
                    text={categoryObj.uploads[displayOrder]}
                    menuProps={[
                      {
                        label:
                          displayOrder === 'desc'
                            ? categoryObj.uploads['asc']
                            : categoryObj.uploads['desc'],
                        onClick: setDisplayOrder
                      }
                    ]}
                  />
                }
              >
                {['all', 'subject'].map((type) => {
                  const displayLabel =
                    type === 'all' ? allPostsLabel : subjectsLabel;
                  return (
                    <nav
                      key={type}
                      className={selectedFilter === type ? 'active' : ''}
                      onClick={() => applyFilter(type)}
                    >
                      {`${displayLabel
                        .charAt(0)
                        .toUpperCase()}${displayLabel.slice(1)}`}
                    </nav>
                  );
                })}
              </FilterBar>
            )}
            {category === 'videos' && (
              <div
                className={css`
                  border: 1px solid ${Color.borderGray()};
                  @media (max-width: ${mobileMaxWidth}) {
                    border-right: 0;
                    border-left: 0;
                  }
                `}
                style={{
                  display: 'flex',
                  background: '#fff',
                  height: '100%',
                  width: '100%',
                  padding: '1rem',
                  justifyContent: 'flex-end'
                }}
              >
                {userId && (
                  <SwitchButton
                    checked={!!hideWatched}
                    label={hideWatchedLabel}
                    onChange={handleToggleHideWatched}
                    labelStyle={{ fontSize: '1.6rem' }}
                  />
                )}
              </div>
            )}
          </div>
        </nav>
      )}
    </ErrorBoundary>
  );

  async function handleToggleHideWatched() {
    const hideWatched = await toggleHideWatched();
    onToggleHideWatched(hideWatched);
  }
}
