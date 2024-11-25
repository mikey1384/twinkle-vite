import React, { useEffect, useMemo } from 'react';
import { useAppContext, useExploreContext, useHomeContext } from '~/contexts';
import ContentListItem from '~/components/ContentListItem';
import { Content } from '~/types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

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

  useEffect(() => {
    if (!featuredSubjectsLoaded) {
      init();
    }

    async function init() {
      const maxRetries = 5;
      let attempt = 0;

      while (attempt < maxRetries) {
        const timeoutDuration = (attempt + 1) * 5000;
        try {
          const subjectsPromise = loadFeaturedSubjects();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Request timed out after ${timeoutDuration}ms`));
            }, timeoutDuration);
          });

          const subjects = await Promise.race([
            subjectsPromise,
            timeoutPromise
          ]);
          onLoadFeaturedSubjects(subjects);
          onSetFeaturedSubjectsLoaded(true);
          return;
        } catch (error) {
          attempt++;
          console.error(
            `Failed to load featured subjects (attempt ${attempt}/${maxRetries}):`,
            error
          );

          if (attempt === maxRetries) {
            console.error(
              'Max retries reached. Failed to load featured subjects.'
            );
            onLoadFeaturedSubjects([]);
            onSetFeaturedSubjectsLoaded(true);
          } else {
            // Wait before retrying (optional)
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (featureds.length === 0) {
        onSetCurrentFeaturedIndex(0);
      } else {
        onSetCurrentFeaturedIndex(
          (currentFeaturedIndex + 1) % featureds.length
        );
      }
    }, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFeaturedIndex, featureds.length]);

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
          position: relative;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
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
              position: absolute;
              left: 0.3rem;
              width: 3rem;
              height: 3rem;
              background: none;
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.5rem;
              color: #555;
              background-color: rgba(255, 255, 255, 0.8);
              box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
              border-radius: 50%;
              &:hover {
                color: #000;
                background-color: rgba(255, 255, 255, 1);
              }
            `}
          >
            <Icon icon="arrow-left" />
          </button>
        )}
        <ContentListItem key={subject.id} contentObj={subject} />
        {featureds.length > 1 && (
          <button
            onClick={handleNext}
            className={css`
              position: absolute;
              right: 0.3rem;
              width: 3rem;
              height: 3rem;
              background: none;
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.5rem;
              color: #555;
              background-color: rgba(255, 255, 255, 0.8);
              box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
              border-radius: 50%;
              &:hover {
                color: #000;
                background-color: rgba(255, 255, 255, 1);
              }
            `}
          >
            <Icon icon="arrow-right" />
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
