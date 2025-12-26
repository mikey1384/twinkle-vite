import React, { useEffect, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import FilterBar from '~/components/FilterBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const allPostsLabel = 'All Posts';
const subjectsLabel = 'Subjects';
const postsLabel = 'Posts';
const newToOldLabel = 'New to Old';
const oldToNewLabel = 'Old to New';
const recommendedLabel = 'Recommended';
const dailyReflectionsLabel = 'Daily Reflections';
const categoryObj: Record<string, any> = {
  uploads: {
    label: postsLabel,
    desc: newToOldLabel,
    asc: oldToNewLabel
  },
  recommended: {
    label: recommendedLabel
  },
  dailyReflections: {
    label: dailyReflectionsLabel
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
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    setActiveTab(category);
  }, [category]);

  return (
    <ErrorBoundary componentPath="Home/Stories/HomeFilter">
      <FilterBar
        style={{
          height: '4rem',
          fontSize: '1.6rem'
        }}
      >
        {['uploads', 'recommended', 'dailyReflections'].map((elem) => (
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
      {activeTab === 'uploads' && (
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
            <FilterBar
              style={{
                height: '5rem',
                fontSize: '1.6rem',
                marginBottom: 0
              }}
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
              <DropdownButton
                variant="solid"
                tone="raised"
                color="darkerGray"
                className={css`
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.2rem !important;
                  }
                `}
                style={{ marginLeft: 'auto' }}
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
            </FilterBar>
          </div>
        </nav>
      )}
    </ErrorBoundary>
  );
}
