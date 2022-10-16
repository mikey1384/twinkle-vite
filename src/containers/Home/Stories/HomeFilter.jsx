import { useEffect, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import SwitchButton from '~/components/Buttons/SwitchButton';
import FilterBar from '~/components/FilterBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import { PropTypes } from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const allPostsLabel = localize('allPosts');
const subjectsLabel = localize('subjects');
const postsLabel = localize('posts');
const newToOldLabel = localize('newToOld');
const oldToNewLabel = localize('oldToNew');
const recommendedLabel = localize('recommended');
const recommendedPostsLabel = localize('recommendedPosts');
const xpVideosLabel = localize('xpVideos');
const hideWatchedLabel = localize('hideWatched');
const categoryObj = {
  uploads: {
    label: postsLabel,
    desc: newToOldLabel,
    asc: oldToNewLabel
  },
  recommended: {
    label: isMobile(navigator) ? recommendedLabel : recommendedPostsLabel
  },
  videos: {
    label: xpVideosLabel
  }
};

HomeFilter.propTypes = {
  applyFilter: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  changeCategory: PropTypes.func.isRequired,
  displayOrder: PropTypes.string.isRequired,
  setDisplayOrder: PropTypes.func.isRequired,
  selectedFilter: PropTypes.string.isRequired
};

export default function HomeFilter({
  applyFilter,
  category,
  changeCategory,
  displayOrder,
  selectedFilter,
  setDisplayOrder
}) {
  const onToggleHideWatched = useAppContext(
    (v) => v.user.actions.onToggleHideWatched
  );
  const toggleHideWatched = useAppContext(
    (v) => v.requestHelpers.toggleHideWatched
  );
  const { hideWatched, userId } = useKeyContext((v) => v.myState);
  const [activeTab, setActiveTab] = useState();

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
              document.getElementById('App').scrollTop = 0;
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
                        font-size: 1.3rem;
                      }
                    `}
                    color="darkerGray"
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
