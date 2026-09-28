import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { QuestNote } from '../StepCard';
import StoryView from './StoryView';
import { storyBackLink, storyPageShell, storyPageWidth } from './StoryPage';
import { EXAMPLES_PATH } from './storyHelpers';
import type { StoryViewData } from './types';

// /bridge-builder/examples/:slug — an example story, rendered by the same
// StoryView as a real one and labelled as AI illustrations on the page and
// its cards. No account needed, so parents can look too.
export default function SampleStoryPage() {
  const { slug = '' } = useParams();
  const loadMeetupSampleStory = useAppContext(
    (v) => v.requestHelpers.loadMeetupSampleStory
  );
  const [story, setStory] = useState<StoryViewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setStory(null);
    loadMeetupSampleStory(slug)
      .then((data: { story: StoryViewData }) => {
        if (active) setStory(data.story);
      })
      .catch((err: any) => {
        if (active) setError(err?.message || 'That example was not found.');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/Story/SampleStoryPage">
      <div className={storyPageShell}>
        <main className={storyPageWidth}>
          <Link to={EXAMPLES_PATH} className={storyBackLink}>
            <Icon icon="arrow-left" /> Example stories
          </Link>
          {error && <QuestNote tone="warning">{error}</QuestNote>}
          {!story && !error && <Loading />}
          {story && <StoryView story={story} />}
        </main>
      </div>
    </ErrorBoundary>
  );
}
