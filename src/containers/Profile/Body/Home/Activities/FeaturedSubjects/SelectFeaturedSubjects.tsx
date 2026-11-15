import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import ContentListItem from '~/components/ContentListItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import FilterBar from '~/components/FilterBar';
import SearchInput from '~/components/Texts/SearchInput';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import {
  MAX_PROFILE_FEATURED_ITEMS,
  profileFeaturedItemKey
} from '~/helpers/profileFeatured';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color } from '~/constants/css';

type PickerKind = 'subject' | 'comment';
type PickerTab = PickerKind | 'selected';

const emptyMessageStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '10rem',
  fontWeight: 'bold',
  fontSize: '2.5rem',
  justifyContent: 'center',
  textAlign: 'center'
};

function keyOf(contentType: PickerKind, id: number) {
  return `${contentType}:${id}`;
}

function withKeys(contentType: PickerKind, results: any[]) {
  const obj: Record<string, any> = {};
  const keys: string[] = [];
  for (const result of results || []) {
    if (!result?.id) continue;
    const key = keyOf(contentType, Number(result.id));
    obj[key] = { ...result, contentType };
    keys.push(key);
  }
  return { obj, keys };
}

// Pick what shows in the profile's Featured section: subjects, or the
// member's own comments (Subjects | Comments | Selected tabs), up to the
// combined limit. Both kinds are listed with ContentListItem, as subjects
// always were. The saved list comes back from the server and replaces the
// section.
export default function SelectFeaturedSubjectsModal({
  items,
  onHide,
  onSubmit
}: {
  items: any[];
  onHide: () => void;
  onSubmit: (saved: { items: any[]; refs?: any[] }) => void;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const loadUploads = useAppContext((v) => v.requestHelpers.loadUploads);
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const loadMyCommentsForFeatured = useAppContext(
    (v) => v.requestHelpers.loadMyCommentsForFeatured
  );
  const saveProfileFeaturedItems = useAppContext(
    (v) => v.requestHelpers.saveProfileFeaturedItems
  );
  const [tab, setTab] = useState<PickerTab>('subject');
  const kind: PickerKind = tab === 'comment' ? 'comment' : 'subject';
  const selectTabActive = tab !== 'selected';
  const [itemObj, setItemObj] = useState<Record<string, any>>(() => {
    const obj: Record<string, any> = {};
    for (const item of items) obj[profileFeaturedItemKey(item)] = item;
    return obj;
  });
  const [selected, setSelected] = useState<string[]>(() =>
    Array.from(new Set(items.map(profileFeaturedItemKey)))
  );
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Subjects (as before this switch existed)
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [subjectsLoadMore, setSubjectsLoadMore] = useState(false);
  const [searchedSubjects, setSearchedSubjects] = useState<string[]>([]);
  const [searchedSubjectsLoadMore, setSearchedSubjectsLoadMore] =
    useState(false);
  const [subjectSearchText, setSubjectSearchText] = useState('');
  const subjectSearchGenerationRef = useRef(0);
  const subjectSearch = useSearch({
    onSearch: handleSubjectSearch,
    onClear: () => setSearchedSubjects([]),
    onSetSearchText: (text) => {
      subjectSearchGenerationRef.current += 1;
      setSubjectSearchText(text);
    }
  });

  // The member's own comments
  const [commentsRequested, setCommentsRequested] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [allComments, setAllComments] = useState<string[]>([]);
  const [commentsCursor, setCommentsCursor] = useState<number | null>(null);
  const [commentsLoadMore, setCommentsLoadMore] = useState(false);
  const [searchedComments, setSearchedComments] = useState<string[]>([]);
  const [searchedCommentsCursor, setSearchedCommentsCursor] = useState<
    number | null
  >(null);
  const [searchedCommentsLoadMore, setSearchedCommentsLoadMore] =
    useState(false);
  const [commentSearchText, setCommentSearchText] = useState('');
  const commentSearchGenerationRef = useRef(0);
  const commentSearch = useSearch({
    onSearch: handleCommentSearch,
    onClear: () => setSearchedComments([]),
    onSetSearchText: (text) => {
      commentSearchGenerationRef.current += 1;
      setCommentSearchText(text);
    }
  });

  useEffect(() => {
    init();
    async function init() {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { results, loadMoreButton } = await loadUploads({
            limit: 10,
            contentType: 'subject',
            includeRoot: true
          });
          const { obj, keys } = withKeys('subject', results);
          setItemObj((current) => ({ ...current, ...obj, ...currentItems() }));
          setAllSubjects(keys);
          setSubjectsLoadMore(loadMoreButton);
          setSubjectsLoaded(true);
          return;
        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab !== 'comment' || commentsRequested) return;
    setCommentsRequested(true);
    initComments();
    async function initComments() {
      try {
        const data = await loadMyCommentsForFeatured();
        const { obj, keys } = withKeys('comment', data?.comments);
        setItemObj((current) => ({ ...current, ...obj }));
        setAllComments(keys);
        setCommentsCursor(Number(data?.lastId) || null);
        setCommentsLoadMore(!!data?.loadMoreButton);
      } catch (error) {
        console.error('Failed to load your comments:', error);
      } finally {
        setCommentsLoaded(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const isComments = kind === 'comment';
  const searchText = isComments ? commentSearchText : subjectSearchText;
  const searching = isComments
    ? commentSearch.searching
    : subjectSearch.searching;
  const loaded = isComments ? commentsLoaded : subjectsLoaded;
  const displayedKeys = useMemo(() => {
    if (isComments) {
      return stringIsEmpty(commentSearchText) ? allComments : searchedComments;
    }
    return stringIsEmpty(subjectSearchText) ? allSubjects : searchedSubjects;
  }, [
    allComments,
    allSubjects,
    commentSearchText,
    isComments,
    searchedComments,
    searchedSubjects,
    subjectSearchText
  ]);
  const displayedLoadMoreButton = isComments
    ? stringIsEmpty(commentSearchText)
      ? commentsLoadMore
      : searchedCommentsLoadMore
    : stringIsEmpty(subjectSearchText)
      ? subjectsLoadMore
      : searchedSubjectsLoadMore;
  const overLimit = selected.length > MAX_PROFILE_FEATURED_ITEMS;

  return (
    <Modal
      modalKey="SelectFeaturedSubjects"
      isOpen
      size="xl"
      onClose={onHide}
      title="Select Featured"
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button
            disabled={!subjectsLoaded || overLimit}
            loading={submitting}
            color={doneColor}
            onClick={handleSubmit}
          >
            {overLimit
              ? `Cannot select more than ${MAX_PROFILE_FEATURED_ITEMS}`
              : 'Done'}
          </Button>
        </>
      }
    >
      <div style={{ width: '100%' }}>
        <FilterBar style={{ marginBottom: '1.5rem' }}>
          <nav
            className={tab === 'subject' ? 'active' : ''}
            onClick={() => setTab('subject')}
          >
            Subjects
          </nav>
          <nav
            className={tab === 'comment' ? 'active' : ''}
            onClick={() => setTab('comment')}
          >
            Comments
          </nav>
          <nav
            className={tab === 'selected' ? 'active' : ''}
            onClick={() => setTab('selected')}
          >
            Selected
          </nav>
        </FilterBar>
        {selectTabActive && (
          <SearchInput
            key={kind}
            autoFocus
            placeholder={
              isComments
                ? 'Search your comments...'
                : 'Search for subjects to feature...'
            }
            value={searchText}
            onChange={
              isComments ? commentSearch.handleSearch : subjectSearch.handleSearch
            }
            style={{ marginBottom: '1.5rem' }}
          />
        )}
        {selectTabActive ? (
          !loaded || searching ? (
            <Loading />
          ) : displayedKeys.length === 0 ? (
            <p style={emptyMessageStyle}>
              {isComments
                ? stringIsEmpty(searchText)
                  ? 'No Comments Yet'
                  : 'No Comments Found'
                : `No Subjects${stringIsEmpty(searchText) ? '' : ' Found'}`}
            </p>
          ) : (
            displayedKeys.map((key) => renderPickable(key, false))
          )
        ) : selected.length === 0 ? (
          <p style={emptyMessageStyle}>Nothing Selected</p>
        ) : (
          selected.map((key, index) =>
            renderPickable(key, index === selected.length - 1)
          )
        )}
        {selectTabActive && loaded && !searching && displayedLoadMoreButton && (
          <LoadMoreButton
            style={{ fontSize: '2rem' }}
            variant="ghost"
            loading={loadingMore}
            onClick={handleLoadMore}
          />
        )}
      </div>
    </Modal>
  );

  function currentItems() {
    const obj: Record<string, any> = {};
    for (const item of items) obj[profileFeaturedItemKey(item)] = item;
    return obj;
  }

  function renderPickable(key: string, isLast: boolean) {
    const item = itemObj[key];
    if (!item) return null;
    const contentType: PickerKind =
      item.contentType === 'comment' ? 'comment' : 'subject';
    return (
      <ContentListItem
        selectable
        modalOverModal
        selected={selected.includes(key)}
        key={key}
        style={{ width: '100%', marginBottom: isLast ? 0 : '1rem' }}
        contentObj={item}
        showCommentContext
        onContentIsDeleted={(id) =>
          setSelected((current) =>
            current.filter((selectedKey) => selectedKey !== keyOf(contentType, id))
          )
        }
        onClick={() => handleSelect(key)}
      />
    );
  }

  async function handleSubjectSearch(text: string) {
    const searchGeneration = subjectSearchGenerationRef.current;
    const { loadMoreButton, results } = await searchContent({
      limit: 10,
      filter: 'subject',
      searchText: text
    });
    if (searchGeneration !== subjectSearchGenerationRef.current) return;
    const { obj, keys } = withKeys('subject', results);
    setItemObj((current) => ({ ...current, ...obj }));
    setSearchedSubjects(keys);
    setSearchedSubjectsLoadMore(loadMoreButton);
  }

  async function handleCommentSearch(text: string) {
    const searchGeneration = commentSearchGenerationRef.current;
    const data = await loadMyCommentsForFeatured({ searchText: text });
    if (searchGeneration !== commentSearchGenerationRef.current) return;
    const { obj, keys } = withKeys('comment', data?.comments);
    setItemObj((current) => ({ ...current, ...obj }));
    setSearchedComments(keys);
    setSearchedCommentsCursor(Number(data?.lastId) || null);
    setSearchedCommentsLoadMore(!!data?.loadMoreButton);
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      if (isComments) {
        await loadMoreComments();
      } else {
        await loadMoreSubjects();
      }
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadMoreSubjects() {
    const loadGeneration = subjectSearchGenerationRef.current;
    const isSearch = !stringIsEmpty(subjectSearchText);
    const { results, loadMoreButton } = isSearch
      ? await searchContent({
          limit: 10,
          filter: 'subject',
          searchText: subjectSearchText,
          shownResults: searchedSubjects.map((key) => itemObj[key])
        })
      : await loadUploads({
          limit: 10,
          contentType: 'subject',
          includeRoot: true,
          excludeContentIds: allSubjects.map((key) => Number(key.split(':')[1]))
        });
    if (loadGeneration !== subjectSearchGenerationRef.current) return;
    const { obj, keys } = withKeys('subject', results);
    setItemObj((current) => ({ ...current, ...obj }));
    if (isSearch) {
      setSearchedSubjects((current) => current.concat(keys));
      setSearchedSubjectsLoadMore(loadMoreButton);
    } else {
      setAllSubjects((current) => current.concat(keys));
      setSubjectsLoadMore(loadMoreButton);
    }
  }

  async function loadMoreComments() {
    const loadGeneration = commentSearchGenerationRef.current;
    const isSearch = !stringIsEmpty(commentSearchText);
    const data = await loadMyCommentsForFeatured({
      lastId: (isSearch ? searchedCommentsCursor : commentsCursor) || undefined,
      searchText: isSearch ? commentSearchText : undefined
    });
    if (loadGeneration !== commentSearchGenerationRef.current) return;
    const { obj, keys } = withKeys('comment', data?.comments);
    setItemObj((current) => ({ ...current, ...obj }));
    if (isSearch) {
      setSearchedComments((current) => current.concat(keys));
      setSearchedCommentsCursor(Number(data?.lastId) || null);
      setSearchedCommentsLoadMore(!!data?.loadMoreButton);
    } else {
      setAllComments((current) => current.concat(keys));
      setCommentsCursor(Number(data?.lastId) || null);
      setCommentsLoadMore(!!data?.loadMoreButton);
    }
  }

  function handleSelect(key: string) {
    setSelected((current) =>
      current.includes(key)
        ? current.filter((selectedKey) => selectedKey !== key)
        : [key].concat(current)
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const saved = await saveProfileFeaturedItems(
        selected.map((key) => {
          const [contentType, contentId] = key.split(':');
          return {
            contentType: contentType as PickerKind,
            contentId: Number(contentId)
          };
        })
      );
      onSubmit({ items: saved?.items || [], refs: saved?.refs });
    } catch (error) {
      console.error('Error during handleSubmit:', error);
    } finally {
      setSubmitting(false);
    }
  }
}
