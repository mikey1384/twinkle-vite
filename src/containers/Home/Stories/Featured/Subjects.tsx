import React, { useEffect, useMemo, useRef } from 'react';
import {
  useAppContext,
  useExploreContext,
  useHomeContext,
  useKeyContext
} from '~/contexts';
import ContentListItem from '~/components/ContentListItem';
import { Content } from '~/types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import {
  desktopMinWidth,
  mobileMaxWidth,
  tabletMaxWidth
} from '~/constants/css';
import { css } from '@emotion/css';

const portraitTabletMediaQuery = `(min-width: ${desktopMinWidth}) and (max-width: ${tabletMaxWidth}) and (orientation: portrait)`;

export default function FeaturedSubject({
  isLoggedIn,
  style
}: {
  isLoggedIn: boolean;
  style?: React.CSSProperties;
}) {
  const loadFeaturedSubjects = useAppContext(
    (v) => v.requestHelpers.loadFeaturedSubjects
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const featuredSubjectsLoaded = useHomeContext(
    (v) => v.state.featuredSubjectsLoaded
  );
  const onLoadFeaturedSubjects = useExploreContext(
    (v) => v.actions.onLoadFeaturedSubjects
  );
  const onSetFeaturedSubjectsLoaded = useHomeContext(
    (v) => v.actions.onSetFeaturedSubjectsLoaded
  );
  const featureds = useExploreContext((v) => v.state.subjects.featureds);
  const currentFeaturedIndex = useHomeContext(
    (v) => v.state.currentFeaturedIndex
  );
  const onSetCurrentFeaturedIndex = useHomeContext(
    (v) => v.actions.onSetCurrentFeaturedIndex
  );

  // Use ref to track current index for interval - avoids recreating interval on every tick
  const currentIndexRef = useRef(currentFeaturedIndex);
  useEffect(() => {
    currentIndexRef.current = currentFeaturedIndex;
  }, [currentFeaturedIndex]);

  useEffect(() => {
    if (featuredSubjectsLoaded) return;
    const requestUserId = userId;
    init();

    async function init() {
      try {
        const subjects = await loadFeaturedSubjects();
        if (checkUserChange(requestUserId)) return;
        onLoadFeaturedSubjects(subjects);
      } catch (error) {
        if (checkUserChange(requestUserId)) return;
        console.error('Failed to load featured subjects:', error);
        onLoadFeaturedSubjects([]);
      } finally {
        if (!checkUserChange(requestUserId)) {
          onSetFeaturedSubjectsLoaded(true);
        }
      }
    }
    // checkUserChange/loadFeaturedSubjects/onLoadFeaturedSubjects/onSetFeaturedSubjectsLoaded are stable context helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredSubjectsLoaded, userId]);

  useEffect(() => {
    if (featureds.length === 0) return;

    const intervalId = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % featureds.length;
      onSetCurrentFeaturedIndex(nextIndex);
    }, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureds.length]);

  useEffect(() => {
    if (currentFeaturedIndex >= featureds.length) {
      onSetCurrentFeaturedIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureds.length, currentFeaturedIndex]);

  const subject = useMemo(
    () => featureds[currentFeaturedIndex] as Content,
    [featureds, currentFeaturedIndex]
  );

  return subject ? (
    <ErrorBoundary componentPath="Home/FeaturedSubjects">
      <div
        style={style}
        className={css`
          margin-bottom: 1rem;
          display: flex;
          align-items: stretch;
          @media (max-width: ${mobileMaxWidth}) {
            margin-left: 1rem;
            ${!isLoggedIn ? 'margin-top: 1rem;' : ''}
          }
        `}
      >
        {featureds.length > 1 && (
          <button
            onClick={handlePrevious}
            className={css`
              flex-shrink: 0;
              width: 3.5rem;
              background: none;
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.5rem;
              color: #555;
              background-color: rgba(240, 240, 240, 0.9);
              border-radius: 0.5rem 0 0 0.5rem;
              transition: background-color 0.2s, color 0.2s;
              &:hover {
                color: #000;
                background-color: rgba(220, 220, 220, 1);
              }
              @media (max-width: ${mobileMaxWidth}) {
                width: 3rem;
              }
              @media ${portraitTabletMediaQuery} {
                width: 3rem;
              }
            `}
          >
            <Icon icon="chevron-left" />
          </button>
        )}
        <div
          className={css`
            flex: 1;
            min-width: 0;
          `}
        >
          <ContentListItem key={subject.id} contentObj={subject} />
        </div>
        {featureds.length > 1 && (
          <button
            onClick={handleNext}
            className={css`
              flex-shrink: 0;
              width: 3.5rem;
              background: none;
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.5rem;
              color: #555;
              background-color: rgba(240, 240, 240, 0.9);
              border-radius: 0 0.5rem 0.5rem 0;
              transition: background-color 0.2s, color 0.2s;
              &:hover {
                color: #000;
                background-color: rgba(220, 220, 220, 1);
              }
              @media (max-width: ${mobileMaxWidth}) {
                width: 3rem;
              }
              @media ${portraitTabletMediaQuery} {
                width: 3rem;
              }
            `}
          >
            <Icon icon="chevron-right" />
          </button>
        )}
      </div>
    </ErrorBoundary>
  ) : null;

  function handlePrevious() {
    onSetCurrentFeaturedIndex(
      (currentFeaturedIndex - 1 + featureds.length) % featureds.length
    );
  }

  function handleNext() {
    onSetCurrentFeaturedIndex((currentFeaturedIndex + 1) % featureds.length);
  }
}
