import React, { useCallback, useEffect, useRef, useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import { useLocation, useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const SEARCH_PARAM = 'q';
const SEARCH_DEBOUNCE_MS = 350;

// The profile search lives in the URL (?q=) so it survives back/forward,
// carries across the Posts/Likes tabs, and can be linked to directly.
export function useProfileSearchQuery() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = (
    new URLSearchParams(location.search).get(SEARCH_PARAM) || ''
  ).trim();
  const setQuery = useCallback(
    (text: string) => {
      const params = new URLSearchParams(location.search);
      const trimmed = text.trim();
      if (trimmed) {
        params.set(SEARCH_PARAM, trimmed);
      } else {
        params.delete(SEARCH_PARAM);
      }
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : '' },
        { replace: true }
      );
    },
    [location.pathname, location.search, navigate]
  );
  return { query, searchSuffix: location.search, setQuery };
}

interface SearchPage {
  data?: {
    feeds?: any[];
    loadMoreButton?: boolean;
    nextCursor?: { searchBeforeId?: number } | null;
    searchStoppedEarly?: boolean;
    searchTimedOut?: boolean;
    searchRateLimited?: boolean;
    searchRequiresSignIn?: boolean;
  };
}

// Why a search page ended where it did, for the message under the results.
export type ProfileFeedSearchNotice =
  '' | 'stoppedEarly' | 'timedOut' | 'rateLimited' | 'requiresSignIn';

function getNotice(page: SearchPage): ProfileFeedSearchNotice {
  const data = page?.data;
  if (data?.searchRequiresSignIn) return 'requiresSignIn';
  if (data?.searchRateLimited) return 'rateLimited';
  if (data?.searchTimedOut) return 'timedOut';
  if (data?.searchStoppedEarly) return 'stoppedEarly';
  return '';
}

export function getProfileFeedSearchMessage({
  notice,
  noMatchLabel
}: {
  notice: ProfileFeedSearchNotice;
  noMatchLabel: string;
}) {
  switch (notice) {
    case 'stoppedEarly':
      return 'No matches in the most recent posts yet.';
    case 'timedOut':
      return 'That search took too long. Try more specific words.';
    case 'rateLimited':
      return 'You are searching very fast. Wait a few seconds and try again.';
    case 'requiresSignIn':
      return 'Sign in to search.';
    default:
      return noMatchLabel;
  }
}

// Shown above Load more when a search page ended early while results are
// already on screen (the empty-results case uses getProfileFeedSearchMessage).
export function ProfileFeedSearchNote({
  notice
}: {
  notice: ProfileFeedSearchNotice;
}) {
  const message =
    notice === 'stoppedEarly'
      ? 'These are the matches in the most recent posts. Search older posts for more.'
      : notice === 'timedOut'
        ? 'Searching older posts took too long. Try again, or use more specific words.'
        : notice === 'rateLimited'
          ? 'You are searching very fast. Wait a few seconds and try again.'
          : '';
  if (!message) return null;
  return (
    <p
      className={css`
        margin: 0.5rem 1rem 1rem;
        text-align: center;
        font-size: 1.4rem;
        color: ${Color.darkerGray()};
      `}
    >
      {message}
    </p>
  );
}

// Loads search results for one tab. The server walks the member's history
// newest first within a time budget per request; each page resumes below the
// cursor it returns. Results stay local to the search so the profile's normal
// tab lists are untouched when the search is cleared. A newer search (or
// leaving the tab) cancels the request still in flight.
export function useProfileFeedSearchResults({
  query,
  scopeKey,
  loadPage
}: {
  query: string;
  scopeKey: string;
  loadPage: (args: {
    searchText: string;
    searchBeforeId?: number;
    signal: AbortSignal;
  }) => Promise<SearchPage>;
}) {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notice, setNotice] = useState<ProfileFeedSearchNotice>('');
  const cursorRef = useRef<number | undefined>(undefined);
  const controllerRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);
  const loadPageRef = useRef(loadPage);
  loadPageRef.current = loadPage;

  useEffect(() => {
    controllerRef.current?.abort();
    cursorRef.current = undefined;
    setFeeds([]);
    setLoadMoreButton(false);
    setNotice('');
    if (!query) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    loadPageRef
      .current({ searchText: query, signal: controller.signal })
      .then((page) => {
        if (controller.signal.aborted) return;
        cursorRef.current = page?.data?.nextCursor?.searchBeforeId;
        setFeeds(page?.data?.feeds || []);
        setLoadMoreButton(
          Boolean(page?.data?.loadMoreButton && cursorRef.current)
        );
        setNotice(getNotice(page));
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, scopeKey]);

  const loadMore = useCallback(async () => {
    const controller = controllerRef.current;
    const searchBeforeId = cursorRef.current;
    if (
      !query ||
      !controller ||
      !searchBeforeId ||
      loadingMoreRef.current ||
      !loadMoreButton
    ) {
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await loadPageRef.current({
        searchText: query,
        searchBeforeId,
        signal: controller.signal
      });
      if (controller.signal.aborted) return;
      const nextCursor = page?.data?.nextCursor?.searchBeforeId;
      const pageNotice = getNotice(page);
      if (pageNotice === 'rateLimited' || pageNotice === 'timedOut') {
        // Nothing was searched: keep the cursor so Load more can try again.
        setNotice(pageNotice);
        return;
      }
      cursorRef.current = nextCursor;
      setFeeds((current) => {
        const knownIds = new Set(current.map((feed) => feed.feedId));
        return [
          ...current,
          ...(page?.data?.feeds || []).filter(
            (feed: any) => !knownIds.has(feed.feedId)
          )
        ];
      });
      setLoadMoreButton(Boolean(page?.data?.loadMoreButton && nextCursor));
      setNotice(pageNotice);
    } catch (error) {
      if (!controller.signal.aborted) console.error(error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loadMoreButton, query]);

  return { feeds, loading, loadingMore, loadMoreButton, loadMore, notice };
}

export default function ProfileFeedSearch({
  placeholder,
  query,
  onSearch
}: {
  placeholder: string;
  query: string;
  onSearch: (text: string) => void;
}) {
  const [draft, setDraft] = useState(query);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    setDraft((current) => (current.trim() === query ? current : query));
  }, [query]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <SearchInput
      className={css`
        margin: 0 0 1.2rem 0;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 1rem;
        }
      `}
      inputHeight="4rem"
      inputFontSize="1.5rem"
      placeholder={placeholder}
      value={draft}
      onChange={handleChange}
    />
  );

  function handleChange(text: string) {
    setDraft(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!text.trim()) {
      onSearchRef.current('');
      return;
    }
    timerRef.current = setTimeout(
      () => onSearchRef.current(text),
      SEARCH_DEBOUNCE_MS
    );
  }
}
