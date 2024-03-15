import React, { useMemo } from 'react';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import TopFilter from './TopFilter';
import Results from './Results';
import SearchBox from './SearchBox';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useLocation } from 'react-router-dom';
import { getSectionFromPathname } from '~/helpers';
import { useExploreContext } from '~/contexts';

export default function Search({
  innerRef,
  style
}: {
  innerRef: any;
  style: React.CSSProperties;
}) {
  const location = useLocation();
  const searchText = useExploreContext((v) => v.state.search.searchText);
  const category = getSectionFromPathname(location.pathname)?.section;
  const isStringEmpty = useMemo(() => stringIsEmpty(searchText), [searchText]);

  return (
    <ErrorBoundary componentPath="Explore/Search">
      <div style={style}>
        <SearchBox
          style={{
            width: '50%',
            marginTop: '2rem',
            height: '5rem'
          }}
          category={category}
          className={css`
            svg,
            input {
              font-size: 2.3rem;
            }
          `}
          innerRef={innerRef}
        />
        {!isStringEmpty && (
          <>
            <TopFilter
              className={css`
                width: 100%;
                margin-top: 2rem;
              `}
              selectedFilter={category}
            />
            <Results searchText={searchText} filter={category} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
