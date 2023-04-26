import React, { useEffect, useRef } from 'react';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import TopFilter from './TopFilter';
import Results from './Results';
import SearchBox from './SearchBox';
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
  const onLoadSearchResults = useExploreContext(
    (v) => v.actions.onLoadSearchResults
  );
  const category = getSectionFromPathname(location.pathname)?.section;
  const prevSearchText = useRef(searchText);

  useEffect(() => {
    if (
      !stringIsEmpty(prevSearchText.current) &&
      prevSearchText.current.length >= 2 &&
      (stringIsEmpty(searchText) || searchText.length < 2)
    ) {
      onLoadSearchResults({ results: [], loadMoreButton: false });
    }
    prevSearchText.current = searchText;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
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
      {!stringIsEmpty(searchText) && (
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
  );
}
