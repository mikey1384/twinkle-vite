import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { QuestNote, questInputClass } from '../StepCard';
import StoryView from './StoryView';
import { HALL_PATH, storyEditorPath } from './storyHelpers';
import type { StoryViewData } from './types';

export const storyPageShell = css`
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 1.6rem 1.6rem 16rem;
  background: #eef3f8;
  min-height: 100%;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 0 12rem;
  }
`;

export const storyPageWidth = css`
  width: 100%;
  max-width: 1180px;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
`;

export const storyBackLink = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.4rem;
  font-weight: bold;
  color: ${Color.logoBlue()};
  @media (max-width: ${mobileMaxWidth}) {
    margin: 1.2rem 1.2rem 0;
  }
`;

// /bridge-builder/stories/:storyId — a live Bridge Builder story (signed-in
// members), or the crew's / Mikey's preview of one that isn't live yet.
export default function StoryPage() {
  const { storyId: rawStoryId } = useParams();
  const storyId = Number(rawStoryId) || 0;
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMeetupStory = useAppContext((v) => v.requestHelpers.loadMeetupStory);
  const [story, setStory] = useState<StoryViewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId || !storyId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, storyId]);

  if (!userId) {
    return (
      <div className={css`padding: 2rem 1rem;`}>
        <HomeLoginPrompt />
      </div>
    );
  }

  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/Story/StoryPage">
      <div className={storyPageShell}>
        <main className={storyPageWidth}>
          <Link to={HALL_PATH} className={storyBackLink}>
            <Icon icon="arrow-left" /> Bridge Builders stories
          </Link>
          {error && <QuestNote tone="warning">{error}</QuestNote>}
          {!story && !error && <Loading />}
          {story && (
            <StoryView
              story={story}
              topSlot={<StoryTopBar story={story} onChanged={load} />}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );

  async function load() {
    try {
      const data = await loadMeetupStory(storyId);
      setStory(data.story);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'That story was not found.');
    }
  }
}

function StoryTopBar({
  story,
  onChanged
}: {
  story: StoryViewData;
  onChanged: () => Promise<void>;
}) {
  const isAdmin = !!story.viewer?.isAdmin;
  if (!story.preview && !isAdmin && !story.announcementSubjectId) return null;
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.4rem 2rem;
        background: #fff;
        border-bottom: 1px solid var(--ui-border);
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.2rem;
        }
      `}
    >
      {story.preview && (
        <QuestNote tone="info">
          <b>Preview:</b> this story isn&apos;t live yet (
          {story.status === 'submitted' ? 'waiting for approval' : 'a draft'}).
          Only your crew and Twinkle admins can see this page.
          {story.viewer?.canEdit && (
            <>
              {' '}
              <Link to={storyEditorPath(story.crewId)} style={{ fontWeight: 'bold' }}>
                Open the editor
              </Link>
            </>
          )}
        </QuestNote>
      )}
      {!story.preview && story.announcementSubjectId > 0 && (
        <div
          className={css`
            font-size: 1.4rem;
            color: ${Color.darkerGray()};
          `}
        >
          <Icon icon="comments" style={{ color: Color.logoBlue(), marginRight: '0.6rem' }} />
          Likes and comments for this story are on{' '}
          <Link to={`/subjects/${story.announcementSubjectId}`} style={{ fontWeight: 'bold' }}>
            its post in the feed
          </Link>
          .
        </div>
      )}
      {isAdmin && <AdminReviewBar story={story} onChanged={onChanged} />}
    </div>
  );
}

// Mikey's final approval (the CLI has the same:
// `lumine admin meetup story approve <crewId>`).
function AdminReviewBar({
  story,
  onChanged
}: {
  story: StoryViewData;
  onChanged: () => Promise<void>;
}) {
  const reviewMeetupStory = useAppContext((v) => v.requestHelpers.reviewMeetupStory);
  const [note, setNote] = useState('');
  const [announce, setAnnounce] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const items = [...story.photos, ...story.clips];
  const publicCount = items.filter((item) => item.gate?.publishable).length;
  const privateCount = items.length - publicCount;
  const warnings = story.review?.nameWarnings || [];

  return (
    <div
      className={css`
        border: 2px solid ${Color.logoBlue(0.5)};
        border-radius: 1.2rem;
        padding: 1.4rem 1.6rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-size: 1.4rem;
        color: ${Color.black()};
      `}
    >
      <b style={{ fontSize: '1.6rem' }}>
        <Icon icon="clipboard-check" style={{ color: Color.logoBlue(), marginRight: '0.6rem' }} />
        Admin: {story.status === 'published' ? 'this story is live' : story.status === 'submitted' ? 'waiting for your approval' : 'draft (not sent yet)'}
      </b>
      {story.preview && (
        <span>
          <b>{publicCount}</b> photo/clip{publicCount === 1 ? '' : 's'} will go public;{' '}
          <b>{privateCount}</b> stay private (the lock badges say why). Parents:{' '}
          {(story.review?.consents || [])
            .map((consent) => {
              const person = story.people.find((p) => p.userId === consent.userId);
              return `${person?.username || consent.userId}: ${consent.state.replace('_', ' ')}`;
            })
            .join(' · ') || 'none'}
        </span>
      )}
      {!!story.review?.addedParentEmails?.length && (
        <span>
          <Icon icon="paper-plane" style={{ color: Color.logoBlue(), marginRight: '0.5rem' }} />
          Parent emails the kids typed in (no guardian on file):{' '}
          {story.review.addedParentEmails
            .map((contact) => {
              const person = story.people.find((p) => p.userId === contact.userId);
              return `${person?.username || contact.userId}: ${contact.masked}${contact.changes > 1 ? ` (${contact.changes} addresses tried)` : ''}`;
            })
            .join(' · ')}
        </span>
      )}
      {warnings.length > 0 && (
        <QuestNote tone="warning">
          Possible real names in the text: <b>{warnings.join(', ')}</b>. Send it
          back if they are.
        </QuestNote>
      )}
      {story.status !== 'draft' && (
        <textarea
          className={questInputClass}
          rows={2}
          maxLength={1000}
          placeholder={
            story.status === 'published'
              ? 'Why it comes down (the crew sees this)'
              : 'A note for the crew (needed to send it back)'
          }
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      )}
      {story.status === 'submitted' && (
        <label
          className={css`
            display: flex;
            align-items: center;
            gap: 0.6rem;
            cursor: pointer;
          `}
        >
          <input
            type="checkbox"
            checked={announce}
            onChange={(event) => setAnnounce(event.target.checked)}
          />
          Also post an announcement with the cover in the home feed
        </label>
      )}
      <div
        className={css`
          display: flex;
          gap: 0.8rem;
          flex-wrap: wrap;
        `}
      >
        {story.status === 'submitted' && (
          <>
            <Button color="green" loading={busy === 'publish'} disabled={!!busy} onClick={() => run('publish')}>
              <Icon icon="check" style={{ marginRight: '0.5rem' }} />
              Publish
            </Button>
            <Button
              variant="soft"
              color="orange"
              loading={busy === 'send-back'}
              disabled={!!busy || !note.trim()}
              onClick={() => run('send-back')}
            >
              Send back with the note
            </Button>
          </>
        )}
        {story.status === 'published' && (
          <>
            <Button variant="soft" color="logoBlue" loading={busy === 'publish'} disabled={!!busy} onClick={() => run('publish')}>
              Add newly allowed photos
            </Button>
            <Button variant="ghost" color="red" loading={busy === 'unpublish'} disabled={!!busy} onClick={() => run('unpublish')}>
              Unpublish
            </Button>
          </>
        )}
      </div>
      {message && <QuestNote tone="success">{message}</QuestNote>}
      {error && <QuestNote tone="warning">{error}</QuestNote>}
    </div>
  );

  async function run(action: 'publish' | 'send-back' | 'unpublish') {
    if (action === 'unpublish' && !window.confirm('Take this story down? Its public photos are deleted and it leaves the hall and profiles.')) {
      return;
    }
    setBusy(action);
    setError('');
    setMessage('');
    try {
      const { result } = await reviewMeetupStory({
        storyId: story.storyId,
        action,
        note,
        announce
      });
      if (action === 'publish') {
        const failed = result?.failed?.length
          ? ` ${result.failed.length} item(s) could not be processed and stay private: ${result.failed
              .map((f: any) => `#${f.mediaId} ${f.error}`)
              .join('; ')}`
          : '';
        setMessage(
          `Published: ${result?.publicMediaIds?.length || 0} public, ${result?.privateMediaIds?.length || 0} private.${result?.announcementSubjectId ? ' The announcement is in the feed.' : ''}${failed}`
        );
      } else {
        setMessage(action === 'send-back' ? 'Sent back to the crew.' : 'Taken down.');
      }
      setNote('');
      await onChanged();
    } catch (err: any) {
      setError(err?.message || 'That did not work. Please try again.');
    } finally {
      setBusy('');
    }
  }
}
