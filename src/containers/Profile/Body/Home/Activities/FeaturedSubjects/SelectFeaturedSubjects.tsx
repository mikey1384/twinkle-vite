import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import ContentListItem from '~/components/ContentListItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import FilterBar from '~/components/FilterBar';
import SearchInput from '~/components/Texts/SearchInput';
import { useAppContext, useKeyContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import { objectify } from '~/helpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';

export default function SelectFeaturedSubjectsModal({
  subjects,
  onHide,
  onSubmit
}: {
  subjects: any[];
  onHide: () => void;
  onSubmit: (arg0: any[]) => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const loadUploads = useAppContext((v) => v.requestHelpers.loadUploads);
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const featureSubjectsOnProfile = useAppContext(
    (v) => v.requestHelpers.featureSubjectsOnProfile
  );
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [searchLoadMoreButton, setSearchLoadMoreButton] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subjectObj, setSubjectObj] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectTabActive, setSelectTabActive] = useState(true);
  const [allSubjects, setAllSubjects] = useState([]);
  const [searchedSubjects, setSearchedSubjects] = useState([]);
  const [searchText, setSearchText] = useState('');
  const { handleSearch, searching } = useSearch({
    onSearch: handleSubjectSearch,
    onClear: () => setSearchedSubjects([]),
    onSetSearchText: setSearchText
  });

  useEffect(() => {
    init();
    async function init() {
      const maxRetries = 3;
      let attempts = 0;
      let success = false;

      const selectedIds = subjects.map(({ id }) => id);
      setSelected(selectedIds);

      while (attempts < maxRetries && !success) {
        attempts++;
        try {
          const { results, loadMoreButton: loadMoreShown } = await loadUploads({
            limit: 10,
            contentType: 'subject',
            includeRoot: true
          });

          setSubjectObj({
            ...objectify(results),
            ...objectify(subjects)
          });
          setAllSubjects(results.map((subject: { id: number }) => subject.id));
          setLoadMoreButton(loadMoreShown);
          success = true;
        } catch (error) {
          console.error(`Attempt ${attempts} failed:`, error);
          if (attempts < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        } finally {
          if (success) {
            setLoaded(true);
          } else if (attempts >= maxRetries) {
            console.error('All attempts failed.');
            setLoaded(false);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedSubjects = useMemo(
    () => (stringIsEmpty(searchText) ? allSubjects : searchedSubjects),
    [allSubjects, searchText, searchedSubjects]
  );
  const displayedLoadMoreButton = useMemo(
    () => (stringIsEmpty(searchText) ? loadMoreButton : searchLoadMoreButton),
    [loadMoreButton, searchLoadMoreButton, searchText]
  );

  return (
    <Modal wrapped large onHide={onHide}>
      <header>Select Featured Subjects</header>
      <main>
        <FilterBar style={{ marginBottom: '1.5rem' }}>
          <nav
            className={selectTabActive ? 'active' : ''}
            onClick={() => setSelectTabActive(true)}
          >
            Select
          </nav>
          <nav
            className={!selectTabActive ? 'active' : ''}
            onClick={() => setSelectTabActive(false)}
          >
            Selected
          </nav>
        </FilterBar>
        {selectTabActive && (
          <SearchInput
            autoFocus
            placeholder="Search for subjects to feature..."
            value={searchText}
            onChange={handleSearch}
            style={{ marginBottom: '1.5rem' }}
          />
        )}
        {loaded ? (
          <>
            {selectTabActive &&
              (searching ? (
                <Loading />
              ) : displayedSubjects.length === 0 ? (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '10rem',
                    fontWeight: 'bold',
                    fontSize: '2.5rem',
                    justifyContent: 'center'
                  }}
                >
                  No Subjects{stringIsEmpty(searchText) ? '' : ' Found'}
                </p>
              ) : (
                displayedSubjects.map((subjectId) => (
                  <ContentListItem
                    selectable
                    modalOverModal
                    selected={selected.includes(subjectId)}
                    key={subjectId}
                    style={{ width: '100%', marginBottom: '1rem' }}
                    contentObj={subjectObj[subjectId]}
                    onClick={() => handleSelect(subjectId)}
                  />
                ))
              ))}
            {!selectTabActive &&
              (selected.length === 0 ? (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '10rem',
                    fontWeight: 'bold',
                    fontSize: '2.5rem',
                    justifyContent: 'center'
                  }}
                >
                  No Subjects Selected
                </p>
              ) : (
                selected.map((selectedId, index) => (
                  <ContentListItem
                    selectable
                    modalOverModal
                    selected={selected.includes(selectedId)}
                    key={selectedId}
                    style={{
                      width: '100%',
                      marginBottom: index !== selected.length - 1 ? '1rem' : 0
                    }}
                    contentObj={subjectObj[selectedId]}
                    onContentIsDeleted={(id) =>
                      setSelected((selected) => {
                        return selected.filter(
                          (selectedId) => selectedId !== id
                        );
                      })
                    }
                    onClick={() => handleSelect(selectedId)}
                  />
                ))
              ))}
          </>
        ) : (
          <Loading />
        )}
        {!searching && displayedLoadMoreButton && selectTabActive && (
          <LoadMoreButton
            style={{ fontSize: '2rem' }}
            transparent
            loading={loadingMore}
            onClick={handleLoadMore}
          />
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={selected.length > 10}
          loading={submitting}
          color={doneColor}
          onClick={handleSubmit}
        >
          {selected.length > 10 ? 'Cannot select more than 10' : 'Done'}
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubjectSearch(text: string) {
    const { loadMoreButton: loadMoreShown, results } = await searchContent({
      limit: 10,
      filter: 'subject',
      searchText: text
    });
    setSubjectObj((legacyTopicObj) => ({
      ...legacyTopicObj,
      ...objectify(results)
    }));
    setSearchedSubjects(results.map((result: { id: number }) => result.id));
    setSearchLoadMoreButton(loadMoreShown);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    const options = stringIsEmpty(searchText)
      ? {
          limit: 10,
          contentType: 'subject',
          includeRoot: true,
          excludeContentIds: allSubjects
        }
      : {
          limit: 10,
          filter: 'subject',
          searchText,
          shownResults: searchedSubjects.map(
            (subjectId) => subjectObj[subjectId]
          )
        };
    const method = stringIsEmpty(searchText) ? loadUploads : searchContent;
    const { results, loadMoreButton: loadMoreShown } = await method(options);
    setSubjectObj({
      ...subjectObj,
      ...objectify(results)
    });
    const setSubjectsMethod = stringIsEmpty(searchText)
      ? setAllSubjects
      : setSearchedSubjects;
    setSubjectsMethod((subjects) =>
      subjects.concat(results.map((subject: { id: number }) => subject.id))
    );
    setLoadingMore(false);
    const setLoadMoreButtonMethod = stringIsEmpty(searchText)
      ? setLoadMoreButton
      : setSearchLoadMoreButton;
    setLoadMoreButtonMethod(loadMoreShown);
  }

  function handleSelect(selectedId: number) {
    if (selected.includes(selectedId)) {
      setSelected((selected) => selected.filter((id) => id !== selectedId));
    } else {
      setSelected((selected) => [selectedId].concat(selected));
    }
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      for (const selectedId of selected) {
        if (!selectedId) {
          return reportError({
            componentPath:
              'Profile/Body/Home/Activities/FeaturedSubjects/SelectFeaturedSubjects',
            message: `handleSubmit: one of the elements inside selected array is null`
          });
        }
      }
      await featureSubjectsOnProfile({ selected });
      onSubmit(selected.map((selectedId) => subjectObj[selectedId]));
    } catch (error) {
      console.error('Error during handleSubmit:', error);
    } finally {
      setSubmitting(false);
    }
  }
}
