import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import ContentListItem from '~/components/ContentListItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Link from '~/components/Link';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { useAppContext, useExploreContext } from '~/contexts';

Results.propTypes = {
  filter: PropTypes.string.isRequired,
  searchText: PropTypes.string
};

export default function Results({ filter, searchText }) {
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const results = useExploreContext((v) => v.state.search.results);
  const loadMoreButton = useExploreContext(
    (v) => v.state.search.loadMoreButton
  );
  const onLoadSearchResults = useExploreContext(
    (v) => v.actions.onLoadSearchResults
  );
  const onLoadMoreSearchResults = useExploreContext(
    (v) => v.actions.onLoadMoreSearchResults
  );
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [firstRun, setFirstRun] = useState(true);
  const prevFilter = useRef(filter);
  const prevSearchText = useRef(searchText);
  const timerRef = useRef(null);

  useEffect(() => {
    if (filter !== prevFilter.current) {
      setSearching(true);
      handleSearchContent();
    }
    prevFilter.current = filter;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (!stringIsEmpty(searchText) && searchText.length > 1) {
      if (firstRun && results.length === 0) {
        onLoadSearchResults({ filter, results: [], loadMoreButton: false });
      }
      setFirstRun(false);
      if (
        (firstRun && results.length === 0) ||
        searchText !== prevSearchText.current
      ) {
        clearTimeout(timerRef.current);
        setSearching(true);
        timerRef.current = setTimeout(handleSearchContent, 500);
      }
      prevSearchText.current = searchText;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  async function handleSearchContent() {
    const { results, loadMoreButton } = await searchContent({
      filter:
        filter === 'links' ? 'url' : filter.substring(0, filter.length - 1),
      searchText
    });
    onLoadSearchResults({ filter, results, loadMoreButton });
    return setSearching(false);
  }

  const availableFilters = useMemo(
    () =>
      ['videos', 'links', 'subjects'].filter(
        (availableFilter) => availableFilter !== filter
      ),
    [filter]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        justifyContent: 'center'
      }}
    >
      {(searching || filter !== prevFilter.current) && <Loading />}
      {!searching &&
        searchText.length > 1 &&
        results.map((result) => (
          <ContentListItem
            key={result.id}
            style={{ marginBottom: '1rem' }}
            contentObj={result}
          />
        ))}
      {!searching && results.length === 0 && filter === prevFilter.current && (
        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: Color.darkerGray(),
            justifyContent: 'center',
            height: '40vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p>{`No ${filter} found for "${searchText}"`}</p>
            <div
              style={{ marginTop: '1rem', fontSize: '2rem', lineHeight: 1.7 }}
            >
              Search {`"${searchText}"`} for:
              {availableFilters.map((availableFilter, index) => (
                <p style={{ textTransform: 'capitalize' }} key={index}>
                  <Link style={{ cursor: 'pointer' }} to={availableFilter}>
                    {availableFilter}
                  </Link>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
      {!searching && loadMoreButton && (
        <div style={{ paddingBottom: '8rem' }}>
          <LoadMoreButton
            filled
            loading={loadingMore}
            onClick={loadMoreSearchResults}
          />
        </div>
      )}
    </div>
  );

  async function loadMoreSearchResults() {
    setLoadingMore(true);
    const { results: moreResults, loadMoreButton } = await searchContent({
      filter:
        filter === 'links' ? 'url' : filter.substring(0, filter.length - 1),
      searchText,
      shownResults: results
    });
    onLoadMoreSearchResults({ results: moreResults, loadMoreButton });
    setLoadingMore(false);
  }
}
