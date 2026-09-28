import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { css, cx, keyframes } from '@emotion/css';
import { v1 as uuidv1 } from 'uuid';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import ProfilePic from '~/components/ProfilePic';
import ProgressBar from '~/components/ProgressBar';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import CrewCover from '../CrewCover';
import { QuestNote, questHelpClass, questInputClass, questLabelClass } from '../StepCard';
import StoryView from './StoryView';
import { storyBackLink } from './StoryPage';
import {
  CLIP_MAX_BYTES,
  CLIP_MAX_SECONDS,
  clipExtension,
  EXAMPLES_PATH,
  mediaSrc,
  posterSrc,
  prepareStoryPhoto,
  probeStoryClip,
  storyPath
} from './storyHelpers';
import type {
  MemberConsentState,
  StoryEditorData,
  StoryMediaItem,
  StoryViewData
} from './types';

// /achievements/bridge-builder/crew/:crewId/story — the crew's story editor.
// Any member who met up can edit; changes autosave (only the fields that
// changed are sent, so two members typing in different fields don't clash),
// and the live preview is the published page's own component.

type TextField = 'title' | 'subtitle' | 'activityKind' | 'body';
const TEXT_FIELDS: TextField[] = ['title', 'subtitle', 'activityKind', 'body'];
const AUTOSAVE_MS = 1200;
const REFRESH_MS = 15_000;
const BODY_MIN = 80;

const pop = keyframes`
  0% { transform: scale(0.9); opacity: 0; }
  60% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); }
`;

const CONSENT_LABELS: Record<MemberConsentState, { text: string; color: string; icon: string }> = {
  no_guardian: { text: 'No parent email on file: photos with them stay private', color: Color.darkGray(), icon: 'lock' },
  not_asked: { text: 'Parent not asked yet', color: Color.darkGray(), icon: 'paper-plane' },
  pending: { text: 'Waiting for their parent', color: '#c77700', icon: 'clock' },
  expired: { text: 'The link expired: ask again', color: '#c77700', icon: 'clock' },
  approved: { text: 'Parent said yes', color: '#1b7f45', icon: 'check-circle' },
  declined: { text: 'Parent said no: their photos stay private', color: Color.darkGray(), icon: 'times-circle' },
  withdrawn: { text: 'Parent withdrew: their photos stay private', color: Color.darkGray(), icon: 'times-circle' }
};

interface UploadJob {
  id: string;
  name: string;
  progress: number;
  error: string;
}

export default function StoryEditorPage() {
  const { crewId: rawCrewId } = useParams();
  const crewId = Number(rawCrewId) || 0;
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMeetupStoryEditor = useAppContext((v) => v.requestHelpers.loadMeetupStoryEditor);
  const startMeetupStory = useAppContext((v) => v.requestHelpers.startMeetupStory);
  const saveMeetupStory = useAppContext((v) => v.requestHelpers.saveMeetupStory);
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const addMeetupStoryMedia = useAppContext((v) => v.requestHelpers.addMeetupStoryMedia);
  const updateMeetupStoryMedia = useAppContext((v) => v.requestHelpers.updateMeetupStoryMedia);
  const removeMeetupStoryMedia = useAppContext((v) => v.requestHelpers.removeMeetupStoryMedia);
  const reorderMeetupStoryMedia = useAppContext((v) => v.requestHelpers.reorderMeetupStoryMedia);
  const requestMeetupStoryConsents = useAppContext(
    (v) => v.requestHelpers.requestMeetupStoryConsents
  );
  const submitMeetupStory = useAppContext((v) => v.requestHelpers.submitMeetupStory);
  const setMeetupStoryParentEmail = useAppContext(
    (v) => v.requestHelpers.setMeetupStoryParentEmail
  );

  const [data, setData] = useState<StoryEditorData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [fields, setFields] = useState<Record<TextField, string>>({
    title: '',
    subtitle: '',
    activityKind: '',
    body: ''
  });
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [captionDrafts, setCaptionDrafts] = useState<Record<number, string>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [actionError, setActionError] = useState('');
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const [consentResult, setConsentResult] = useState<any>(null);
  const [asking, setAsking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [publicOnly, setPublicOnly] = useState(false);
  const fieldsRef = useRef(fields);
  const rolesRef = useRef(roles);
  const dirtyRef = useRef(dirty);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const captionTimersRef = useRef<Record<number, number>>({});
  const clipInputRef = useRef<HTMLInputElement>(null);
  fieldsRef.current = fields;
  rolesRef.current = roles;
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!userId || !crewId) return;
    load({ replaceAll: true });
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load({ replaceAll: false });
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, crewId]);

  // autosave: the changed fields, a moment after typing stops
  useEffect(() => {
    if (!dirty.size || !data?.story) return;
    const timer = window.setTimeout(saveDirty, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, roles, dirty]);

  const story = data?.story || null;
  const canEdit = !!data?.viewer?.canEdit;
  const items = useMemo(() => data?.items || [], [data?.items]);
  const people = useMemo(() => data?.people || [], [data?.people]);

  const previewStory: StoryViewData | null = useMemo(() => {
    if (!data?.view) return null;
    const withCaption = (item: StoryMediaItem) => ({
      ...item,
      caption: captionDrafts[item.id] ?? item.caption
    });
    const cover = items.find((item) => item.id === data.story?.coverMediaId);
    return {
      ...data.view,
      title: fields.title,
      subtitle: fields.subtitle,
      activityKind: fields.activityKind,
      body: fields.body,
      people: data.view.people.map((person) => ({
        ...person,
        role: roles[String(person.userId)] ?? person.role
      })),
      cover: cover ? { key: '', url: cover.url, alt: cover.caption } : null,
      photos: items.filter((item) => item.kind === 'photo').map(withCaption),
      clips: items.filter((item) => item.kind === 'clip').map(withCaption)
    };
  }, [captionDrafts, data, fields, items, roles]);

  if (!userId) {
    return (
      <div className={css`padding: 2rem 1rem;`}>
        <HomeLoginPrompt />
      </div>
    );
  }

  const photoCount = items.filter((item) => item.kind === 'photo').length;
  const clipCount = items.filter((item) => item.kind === 'clip').length;
  const untagged = items.filter((item) => !item.noFaces && !(item.taggedUserIds || []).length).length;
  const bodyLength = fields.body.trim().length;
  const checklist = [
    { label: 'Write your story', done: !!fields.title.trim() && bodyLength >= BODY_MIN },
    { label: 'Add photos and clips', done: photoCount > 0 },
    { label: "Tag who's in each one", done: items.length > 0 && untagged === 0 },
    {
      label: 'Ask your parents',
      done: people.length > 0 && people.every((p) => p.consent !== 'not_asked' && p.consent !== 'expired')
    },
    { label: 'Send it for the final OK', done: story?.status === 'submitted' || story?.status === 'published' }
  ];

  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/Story/StoryEditorPage">
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 1.6rem 1.6rem 16rem;
          background: #eef3f8;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0 0 12rem;
          }
        `}
      >
        <main
          className={css`
            width: 100%;
            max-width: 1500px;
            display: flex;
            flex-direction: column;
            gap: 1.4rem;
          `}
        >
          <Link to={`/achievements/bridge-builder/crew/${crewId}`} className={storyBackLink}>
            <Icon icon="arrow-left" /> Your crew
          </Link>
          {loadError && <QuestNote tone="warning">{loadError}</QuestNote>}
          {!data && !loadError && <Loading />}
          {data && !story && renderStart()}
          {data && story && renderEditor()}
        </main>
      </div>
    </ErrorBoundary>
  );

  function renderStart() {
    return (
      <section
        className={css`
          background: #fff;
          border-radius: 2rem;
          overflow: hidden;
          animation: ${pop} 0.5s ease-out both;
        `}
      >
        <CrewCover cover={data!.crew.cover} height="14rem" rounded="0" />
        <div
          className={css`
            padding: 2.6rem 3rem 3rem;
            display: flex;
            flex-direction: column;
            gap: 1.4rem;
            font-size: 1.6rem;
            line-height: 1.6;
            color: #2c3a48;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 2rem 1.6rem;
            }
          `}
        >
          <h1 className={css`margin: 0; font-size: 3rem; font-weight: 900; color: #1d2b3a;`}>
            Make {data!.crew.displayName}&apos;s story
          </h1>
          <p style={{ margin: 0 }}>
            Your meetup deserves its own page on Twinkle: who came, what you did
            together, your best photos and short clips. Once it&apos;s approved,
            it goes into the Bridge Builders hall for everyone to see, and
            it stays on your profiles.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {data!.canStart && (
              <Button color="green" loading={starting} onClick={handleStart}>
                <Icon icon="pencil-alt" style={{ marginRight: '0.6rem' }} />
                Start our story
              </Button>
            )}
            <Link to={EXAMPLES_PATH} className={css`align-self: center; font-weight: bold; font-size: 1.5rem;`}>
              <Icon icon="wand-magic-sparkles" /> See example stories first
            </Link>
          </div>
          {data!.openReason && <QuestNote tone="info">{data!.openReason}</QuestNote>}
          {actionError && <QuestNote tone="warning">{actionError}</QuestNote>}
        </div>
      </section>
    );
  }

  function renderEditor() {
    return (
      <>
        {renderStatusBanner()}
        <div
          className={css`
            display: none;
            @media (max-width: ${mobileMaxWidth}) {
              display: flex;
              margin: 0 1.2rem;
              background: #fff;
              border-radius: 999px;
              padding: 0.4rem;
              gap: 0.4rem;
            }
          `}
        >
          {(['edit', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileTab(tab)}
              className={css`
                flex: 1;
                border: none;
                border-radius: 999px;
                padding: 1rem;
                font-size: 1.5rem;
                font-weight: bold;
                cursor: pointer;
                background: ${mobileTab === tab ? Color.logoBlue() : 'transparent'};
                color: ${mobileTab === tab ? '#fff' : Color.darkerGray()};
              `}
            >
              <Icon icon={tab === 'edit' ? 'pencil-alt' : 'eye'} style={{ marginRight: '0.6rem' }} />
              {tab === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>
        <div
          className={css`
            display: grid;
            grid-template-columns: minmax(40rem, 46rem) minmax(0, 1fr);
            gap: 2rem;
            align-items: start;
            @media (max-width: 1100px) {
              grid-template-columns: minmax(0, 1fr);
            }
          `}
        >
          <div
            className={cx(
              css`
                display: flex;
                flex-direction: column;
                gap: 1.4rem;
                min-width: 0;
              `,
              mobileTab === 'preview' &&
                css`
                  @media (max-width: ${mobileMaxWidth}) {
                    display: none;
                  }
                `
            )}
          >
            <Checklist items={checklist} />
            {renderWriting()}
            {renderMedia()}
            {renderConsents()}
            {renderSubmit()}
          </div>
          <div
            className={cx(
              css`
                position: sticky;
                top: 1.2rem;
                min-width: 0;
                max-height: calc(100vh - 2.4rem);
                overflow-y: auto;
                border-radius: 2rem;
                @media (max-width: 1100px) {
                  position: static;
                  max-height: none;
                  overflow: visible;
                }
              `,
              mobileTab === 'edit' &&
                css`
                  @media (max-width: ${mobileMaxWidth}) {
                    display: none;
                  }
                `
            )}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                flex-wrap: wrap;
                padding: 1rem 1.4rem;
                margin-bottom: 1rem;
                background: #fff;
                border-radius: 1.2rem;
                font-size: 1.35rem;
                font-weight: bold;
                color: ${Color.darkerGray()};
              `}
            >
              <span>
                <Icon icon="eye" style={{ color: Color.logoBlue(), marginRight: '0.6rem' }} />
                Live preview: this is exactly how the page will look
              </span>
              <label
                className={css`
                  display: inline-flex;
                  align-items: center;
                  gap: 0.6rem;
                  cursor: pointer;
                  font-weight: normal;
                `}
              >
                <input
                  type="checkbox"
                  checked={publicOnly}
                  onChange={(event) => setPublicOnly(event.target.checked)}
                />
                Show only what goes public
              </label>
            </div>
            {previewStory && <StoryView story={previewStory} hidePrivate={publicOnly} />}
          </div>
        </div>
      </>
    );
  }

  function renderStatusBanner() {
    if (!story) return null;
    const saving =
      saveState === 'saving'
        ? 'Saving…'
        : saveState === 'saved'
          ? 'All changes saved'
          : saveState === 'error'
            ? 'Not saved'
            : dirty.size
              ? 'Editing…'
              : 'Saved';
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 1.4rem;
          flex-wrap: wrap;
          padding: 1.6rem 2rem;
          background: #fff;
          border-radius: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            padding: 1.4rem 1.2rem;
          }
        `}
      >
        <div style={{ flex: 1, minWidth: '24rem' }}>
          <div
            className={css`
              font-size: 1.25rem;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: #22a35a;
            `}
          >
            {data!.crew.displayName} · our story
          </div>
          <div className={css`font-size: 2.2rem; font-weight: 900; color: #1d2b3a; margin-top: 0.3rem;`}>
            {story.status === 'published'
              ? 'Your story is live!'
              : story.status === 'submitted'
                ? 'Sent! Waiting for the final OK'
                : 'Making our story'}
          </div>
        </div>
        <span
          className={css`
            font-size: 1.35rem;
            font-weight: bold;
            color: ${saveState === 'error' ? Color.red() : Color.darkGray()};
          `}
        >
          <Icon
            icon={saveState === 'saving' ? 'spinner' : saveState === 'error' ? 'exclamation-circle' : 'check'}
            pulse={saveState === 'saving'}
            style={{ marginRight: '0.5rem' }}
          />
          {saving}
        </span>
        {story.status === 'published' && (
          <Button color="green" onClick={() => navigate(storyPath(story.storyId))}>
            <Icon icon="eye" style={{ marginRight: '0.5rem' }} />
            See it live
          </Button>
        )}
        <Link to={EXAMPLES_PATH} className={css`font-size: 1.4rem; font-weight: bold;`}>
          <Icon icon="wand-magic-sparkles" /> Examples
        </Link>
        {story.reviewNote && story.status === 'draft' && (
          <div style={{ width: '100%' }}>
            <QuestNote tone="warning">
              <b>Note from the admins: </b>
              {story.reviewNote}
            </QuestNote>
          </div>
        )}
        {story.status === 'submitted' && (
          <div style={{ width: '100%' }}>
            <QuestNote tone="info">
              You can still make changes while you wait. The page shows the
              latest version when it goes live.
            </QuestNote>
          </div>
        )}
        {saveError && (
          <div style={{ width: '100%' }}>
            <QuestNote tone="warning">{saveError}</QuestNote>
          </div>
        )}
      </div>
    );
  }

  function renderWriting() {
    const disabled = !canEdit;
    return (
      <Card title="Your story" icon="pencil-alt" number={1}>
        <div>
          <label className={questLabelClass} htmlFor="story-title">
            Title
          </label>
          <input
            id="story-title"
            className={questInputClass}
            maxLength={80}
            disabled={disabled}
            value={fields.title}
            placeholder="For example: Our popsicle-stick bridge held 2.4 kg!"
            onChange={(event) => setField('title', event.target.value)}
          />
        </div>
        <div>
          <label className={questLabelClass} htmlFor="story-subtitle">
            One-line summary <span style={{ fontWeight: 'normal' }}>(optional)</span>
          </label>
          <input
            id="story-subtitle"
            className={questInputClass}
            maxLength={140}
            disabled={disabled}
            value={fields.subtitle}
            placeholder="Three branches, one classroom and a lot of glue"
            onChange={(event) => setField('subtitle', event.target.value)}
          />
        </div>
        <div>
          <label className={questLabelClass} htmlFor="story-kind">
            What kind of meetup? <span style={{ fontWeight: 'normal' }}>(optional)</span>
          </label>
          <input
            id="story-kind"
            className={questInputClass}
            maxLength={60}
            disabled={disabled}
            value={fields.activityKind}
            placeholder="Science: build and test"
            onChange={(event) => setField('activityKind', event.target.value)}
          />
        </div>
        <div>
          <label className={questLabelClass} htmlFor="story-body">
            What we did together
          </label>
          <textarea
            id="story-body"
            className={questInputClass}
            rows={10}
            maxLength={5000}
            disabled={disabled}
            value={fields.body}
            placeholder={'How did the day start? What did you make, find or learn? What was the funniest moment? What would you do next time?'}
            onChange={(event) => setField('body', event.target.value)}
          />
          <div className={questHelpClass}>
            {bodyLength < BODY_MIN
              ? `${BODY_MIN - bodyLength} more characters to go (a few sentences is great).`
              : `${bodyLength} characters. Leave an empty line between paragraphs.`}{' '}
            Use usernames, never real names, and no addresses or phone numbers.
          </div>
        </div>
        {!!data?.nameWarnings?.length && (
          <QuestNote tone="warning">
            Is <b>{data.nameWarnings.join(', ')}</b> someone&apos;s real name? On
            the page, please use usernames instead.
          </QuestNote>
        )}
        {people.length > 0 && (
          <div>
            <span className={questLabelClass}>Who did what?</span>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
              `}
            >
              {people.map((person) => (
                <div
                  key={person.userId}
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                  `}
                >
                  <ProfilePic
                    userId={person.userId}
                    profilePicUrl={person.profilePicUrl || undefined}
                    style={{ width: '3.6rem', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={css`font-size: 1.3rem; font-weight: bold; color: #1d2b3a;`}>
                      {person.username} · {person.branch}
                    </div>
                    <input
                      className={questInputClass}
                      maxLength={100}
                      disabled={disabled}
                      value={roles[String(person.userId)] ?? ''}
                      placeholder="Role, for example: Weigher, read the scale every round"
                      onChange={(event) => setRole(person.userId, event.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }

  function renderMedia() {
    return (
      <Card
        title="Photos and clips"
        icon="images"
        number={2}
        note={`${photoCount} photo${photoCount === 1 ? '' : 's'} · ${clipCount}/3 clips`}
      >
        <QuestNote tone="info">
          Tag everyone who is in each photo or clip. A photo goes public only
          when the parent of everyone in it says yes. Photos with nobody in
          them: tap <b>No faces</b>.
        </QuestNote>
        {canEdit && (
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotoFiles}
            />
            <input
              ref={clipInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleClipFile}
            />
            <Button color="logoBlue" onClick={() => photoInputRef.current?.click()}>
              <Icon icon="image" style={{ marginRight: '0.6rem' }} />
              Add photos
            </Button>
            <Button
              variant="soft"
              color="logoBlue"
              disabled={clipCount >= 3}
              onClick={() => clipInputRef.current?.click()}
            >
              <Icon icon="film" style={{ marginRight: '0.6rem' }} />
              Add a clip (up to {CLIP_MAX_SECONDS} s)
            </Button>
          </div>
        )}
        {uploads.map((job) => (
          <div key={job.id} className={css`font-size: 1.3rem; color: ${Color.darkerGray()};`}>
            <div>
              {job.error ? (
                <span style={{ color: Color.red() }}>
                  {job.name}: {job.error}
                </span>
              ) : (
                <>Uploading {job.name}…</>
              )}
            </div>
            {!job.error && <ProgressBar progress={job.progress} />}
          </div>
        ))}
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
          `}
        >
          {items.map((item, index) => (
            <React.Fragment key={item.id}>{renderMediaRow(item, index)}</React.Fragment>
          ))}
        </div>
      </Card>
    );
  }

  function renderMediaRow(item: StoryMediaItem, index: number) {
    const tags = item.taggedUserIds || [];
    const isCover = item.id === story?.coverMediaId;
    return (
      <div
        className={css`
          display: grid;
          grid-template-columns: 12rem minmax(0, 1fr);
          gap: 1.2rem;
          padding: 1.2rem;
          border-radius: 1.2rem;
          border: 1px solid ${item.gate?.publishable ? Color.green(0.4) : 'var(--ui-border)'};
          background: #fff;
          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 9rem minmax(0, 1fr);
          }
        `}
      >
        <div
          className={css`
            position: relative;
            border-radius: 0.8rem;
            overflow: hidden;
            background: #000;
            aspect-ratio: 1;
            align-self: start;
          `}
        >
          {item.kind === 'photo' ? (
            <img
              src={mediaSrc(item)}
              alt=""
              className={css`width: 100%; height: 100%; object-fit: cover; display: block;`}
            />
          ) : posterSrc(item) ? (
            <img
              src={posterSrc(item)}
              alt=""
              className={css`width: 100%; height: 100%; object-fit: cover; display: block;`}
            />
          ) : (
            <video src={mediaSrc(item)} preload="metadata" muted className={css`width: 100%; height: 100%; object-fit: cover;`} />
          )}
          {item.kind === 'clip' && (
            <span
              className={css`
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 2.4rem;
                text-shadow: 0 0.2rem 0.6rem rgba(0, 0, 0, 0.5);
              `}
            >
              <Icon icon="play" />
            </span>
          )}
          {isCover && (
            <span
              className={css`
                position: absolute;
                top: 0.4rem;
                left: 0.4rem;
                padding: 0.2rem 0.7rem;
                border-radius: 999px;
                background: #22a35a;
                color: #fff;
                font-size: 1.1rem;
                font-weight: bold;
              `}
            >
              Cover
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
          <input
            className={questInputClass}
            maxLength={200}
            disabled={!canEdit}
            value={captionDrafts[item.id] ?? item.caption}
            placeholder={item.kind === 'photo' ? 'The moment: what is happening here?' : 'What happens in this clip?'}
            onChange={(event) => setCaption(item.id, event.target.value)}
          />
          <div>
            <div className={css`font-size: 1.25rem; font-weight: bold; color: ${Color.darkerGray()}; margin-bottom: 0.4rem;`}>
              Who&apos;s in it?
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {people.map((person) => {
                const on = tags.includes(person.userId);
                return (
                  <button
                    key={person.userId}
                    type="button"
                    disabled={!canEdit}
                    onClick={() =>
                      mediaAction(() =>
                        updateMeetupStoryMedia({
                          storyId: story!.storyId,
                          mediaId: item.id,
                          taggedUserIds: on
                            ? tags.filter((id) => id !== person.userId)
                            : [...tags, person.userId]
                        })
                      )
                    }
                    className={chip(on, Color.logoBlue())}
                  >
                    {on && <Icon icon="check" style={{ marginRight: '0.4rem' }} />}
                    {person.username}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() =>
                  mediaAction(() =>
                    updateMeetupStoryMedia({
                      storyId: story!.storyId,
                      mediaId: item.id,
                      taggedUserIds: [],
                      noFaces: !item.noFaces
                    })
                  )
                }
                className={chip(!!item.noFaces, '#22a35a')}
              >
                {item.noFaces && <Icon icon="check" style={{ marginRight: '0.4rem' }} />}
                No faces
              </button>
            </div>
          </div>
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.6rem;
              flex-wrap: wrap;
              font-size: 1.25rem;
            `}
          >
            <span
              className={css`
                font-weight: bold;
                color: ${item.gate?.publishable ? '#1b7f45' : Color.darkGray()};
              `}
            >
              <Icon icon={item.gate?.publishable ? 'check-circle' : 'lock'} style={{ marginRight: '0.4rem' }} />
              {item.gate?.publishable ? 'Can go public' : gateText(item)}
            </span>
            {canEdit && (
              <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
                {item.kind === 'photo' && !isCover && (
                  <Button size="sm" variant="ghost" color="logoBlue" onClick={() => setCover(item.id)}>
                    Make cover
                  </Button>
                )}
                <Button size="sm" variant="ghost" color="darkGray" disabled={index === 0} onClick={() => move(item.id, -1)} aria-label="Move up">
                  <Icon icon="arrow-up" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  color="darkGray"
                  disabled={index === items.length - 1}
                  onClick={() => move(item.id, 1)}
                  aria-label="Move down"
                >
                  <Icon icon="arrow-down" />
                </Button>
                <Button size="sm" variant="ghost" color="red" onClick={() => remove(item.id)} aria-label="Remove">
                  <Icon icon="trash-alt" />
                </Button>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  function gateText(item: StoryMediaItem) {
    const gate = item.gate;
    if (!gate) return 'Private';
    if (gate.reason === 'untagged') return 'Private until you tag who is in it (or No faces)';
    if (gate.reason === 'not_in_story') return "Private: someone tagged wasn't at the meetup";
    const names = gate.waitingOn
      .map((w) => people.find((p) => p.userId === w.userId)?.username)
      .filter(Boolean)
      .join(', ');
    return `Private until ${names ? `${names}'s parent says` : 'every parent says'} yes`;
  }

  function renderConsents() {
    const completed = !!data?.crew.completed;
    return (
      <Card title="Ask your parents" icon="paper-plane" number={3}>
        <p className={css`margin: 0; font-size: 1.4rem; line-height: 1.6; color: #2c3a48;`}>
          We email each of your parents a preview of the photos and clips you
          are in, with <b>Allow</b> and <b>Don&apos;t allow</b> buttons. Only
          what every parent in it allows goes public. Everyone still appears on
          the page by username and profile picture.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {people.map((person) => {
            const label = CONSENT_LABELS[person.consent];
            return (
              <div
                key={person.userId}
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 1rem;
                  padding: 0.8rem 1rem;
                  border-radius: 1rem;
                  background: ${Color.extraLightGray(0.7)};
                `}
              >
                <ProfilePic
                  userId={person.userId}
                  profilePicUrl={person.profilePicUrl || undefined}
                  style={{ width: '3.4rem', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={css`font-size: 1.4rem; font-weight: bold; color: #1d2b3a;`}>
                    {person.username}{' '}
                    <span style={{ fontWeight: 'normal', color: Color.darkGray() }}>
                      · in {person.taggedIn} photo{person.taggedIn === 1 ? '' : 's'}/clip{person.taggedIn === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className={css`font-size: 1.3rem; font-weight: bold; color: ${label.color};`}>
                    <Icon icon={label.icon} style={{ marginRight: '0.4rem' }} />
                    {person.consent === 'no_guardian' && !person.parentContact.canSet
                      ? `No parent email yet: photos with them stay private until ${person.username} adds one`
                      : label.text}
                  </div>
                  {person.parentContact.source === 'added' && (
                    <div className={css`font-size: 1.25rem; color: ${Color.darkerGray()}; margin-top: 0.2rem;`}>
                      <Icon icon="paper-plane" style={{ marginRight: '0.4rem' }} />
                      We&apos;ll email {person.parentContact.masked ? `your parent (${person.parentContact.masked})` : 'their parent'} to ask
                    </div>
                  )}
                  {person.parentContact.canSet && (
                    <ParentEmailForm
                      key={`${person.userId}-${person.parentContact.source}`}
                      hasEmail={person.parentContact.source === 'added'}
                      forSelf={person.userId === userId}
                      username={person.username}
                      onSave={(email) =>
                        setMeetupStoryParentEmail({
                          storyId: story!.storyId,
                          userId: person.userId,
                          email
                        }).then((next: StoryEditorData) => applyServer(next))
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!completed && (
          <QuestNote tone="info">
            You can ask your parents once an admin has approved your meetup
            video (so we know who was there). Keep writing in the meantime!
          </QuestNote>
        )}
        {canEdit && (
          <div>
            <Button color="logoBlue" loading={asking} disabled={!completed || asking} onClick={handleAskParents}>
              <Icon icon="paper-plane" style={{ marginRight: '0.6rem' }} />
              Ask our parents
            </Button>
            <div className={questHelpClass}>
              Added more photos later? Ask again: parents only get the new ones.
            </div>
          </div>
        )}
        {consentResult && (
          <QuestNote tone="success">
            {consentResult.members
              .map((member: any) => `${member.username}: ${askResultText(member.result)}`)
              .join('\n')}
            {!!consentResult.devLinks?.length && (
              <>
                {'\n'}
                (Local dev: the email was not sent.{' '}
                {consentResult.devLinks.map((link: any) => (
                  <a key={link.token} href={`/bridge-builder/consent?token=${encodeURIComponent(link.token)}`} style={{ marginRight: '0.6rem' }}>
                    parent page ({people.find((p) => p.userId === link.userId)?.username})
                  </a>
                ))}
                )
              </>
            )}
          </QuestNote>
        )}
      </Card>
    );
  }

  function renderSubmit() {
    const problem = data?.viewer?.submitProblem || '';
    const status = story?.status;
    return (
      <Card title="Send it for the final OK" icon="check-circle" number={4}>
        <p className={css`margin: 0; font-size: 1.4rem; line-height: 1.6; color: #2c3a48;`}>
          When your crew is happy with it, send it to the Twinkle admins. They
          read every story before it goes live.
        </p>
        {status === 'published' ? (
          <QuestNote tone="success">Your story is live. Congratulations, Bridge Builders!</QuestNote>
        ) : status === 'submitted' ? (
          <QuestNote tone="success">Sent! The admins will look at it soon.</QuestNote>
        ) : (
          <div>
            <Button color="green" loading={submitting} disabled={!!problem || submitting || !canEdit} onClick={handleSubmit}>
              <Icon icon="paper-plane" style={{ marginRight: '0.6rem' }} />
              Send for approval
            </Button>
            {problem && <div className={questHelpClass}>{problem}</div>}
          </div>
        )}
        {actionError && <QuestNote tone="warning">{actionError}</QuestNote>}
      </Card>
    );
  }

  // ---- data ----

  async function load({ replaceAll }: { replaceAll: boolean }) {
    try {
      const next: StoryEditorData = await loadMeetupStoryEditor(crewId);
      applyServer(next, replaceAll);
      setLoadError('');
    } catch (error: any) {
      if (replaceAll) setLoadError(error?.message || 'Could not open the story.');
    }
  }

  // Server data in; fields someone is editing here stay as typed.
  function applyServer(next: StoryEditorData, replaceAll = false) {
    setData(next);
    if (!next.story) return;
    const editing = replaceAll ? new Set<string>() : dirtyRef.current;
    setFields((current) => {
      const merged = { ...current };
      for (const key of TEXT_FIELDS) {
        if (!editing.has(key)) merged[key] = next.story![key] || '';
      }
      return merged;
    });
    setRoles((current) => {
      const merged: Record<string, string> = { ...next.story!.memberRoles };
      for (const key of Object.keys(current)) {
        if (editing.has(`role:${key}`)) merged[key] = current[key];
      }
      return merged;
    });
  }

  function setField(key: TextField, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setDirty((current) => new Set(current).add(key));
    setSaveState('idle');
  }

  function setRole(memberId: number, value: string) {
    setRoles((current) => ({ ...current, [String(memberId)]: value }));
    setDirty((current) => new Set(current).add(`role:${memberId}`));
    setSaveState('idle');
  }

  async function saveDirty() {
    if (!story) return;
    const keys = [...dirtyRef.current];
    if (!keys.length) return;
    const sentFields = { ...fieldsRef.current };
    const sentRoles = { ...rolesRef.current };
    const patch: Record<string, unknown> = {};
    const memberRoles: Record<string, string> = {};
    for (const key of keys) {
      if (key.startsWith('role:')) {
        const id = key.slice(5);
        memberRoles[id] = sentRoles[id] || '';
      } else {
        patch[key] = sentFields[key as TextField];
      }
    }
    if (Object.keys(memberRoles).length) patch.memberRoles = memberRoles;
    setSaveState('saving');
    try {
      await saveMeetupStory({ storyId: story.storyId, patch });
      // clear only what didn't change again while saving
      setDirty((current) => {
        const next = new Set(current);
        for (const key of keys) {
          const unchanged = key.startsWith('role:')
            ? (rolesRef.current[key.slice(5)] || '') === (sentRoles[key.slice(5)] || '')
            : fieldsRef.current[key as TextField] === sentFields[key as TextField];
          if (unchanged) next.delete(key);
        }
        return next;
      });
      setSaveState('saved');
      setSaveError('');
    } catch (error: any) {
      setSaveState('error');
      setSaveError(error?.message || 'Could not save. Check your connection.');
      // don't retry the same text in a loop: it waits for the next edit
      setDirty(new Set());
    }
  }

  function setCaption(mediaId: number, value: string) {
    setCaptionDrafts((current) => ({ ...current, [mediaId]: value }));
    window.clearTimeout(captionTimersRef.current[mediaId]);
    captionTimersRef.current[mediaId] = window.setTimeout(async () => {
      try {
        setSaveState('saving');
        const next = await updateMeetupStoryMedia({ storyId: story!.storyId, mediaId, caption: value });
        applyServer(next);
        setCaptionDrafts((current) => {
          if (current[mediaId] !== value) return current;
          const copy = { ...current };
          delete copy[mediaId];
          return copy;
        });
        setSaveState('saved');
        setSaveError('');
      } catch (error: any) {
        setSaveState('error');
        setSaveError(error?.message || 'Could not save the caption.');
      }
    }, AUTOSAVE_MS);
  }

  async function mediaAction(run: () => Promise<StoryEditorData>) {
    setActionError('');
    try {
      applyServer(await run());
    } catch (error: any) {
      setActionError(error?.message || 'That did not work. Please try again.');
    }
  }

  async function setCover(mediaId: number) {
    setActionError('');
    try {
      await saveMeetupStory({ storyId: story!.storyId, patch: { coverMediaId: mediaId } });
      await load({ replaceAll: false });
    } catch (error: any) {
      setActionError(error?.message || 'Could not change the cover.');
    }
  }

  function move(mediaId: number, delta: number) {
    const ids = items.map((item) => item.id);
    const from = ids.indexOf(mediaId);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    mediaAction(() => reorderMeetupStoryMedia({ storyId: story!.storyId, mediaIds: ids }));
  }

  function remove(mediaId: number) {
    if (!window.confirm('Remove this from your story?')) return;
    mediaAction(() => removeMeetupStoryMedia({ storyId: story!.storyId, mediaId }));
  }

  async function handleStart() {
    setStarting(true);
    setActionError('');
    try {
      applyServer(await startMeetupStory(crewId), true);
    } catch (error: any) {
      setActionError(error?.message || 'Could not start the story.');
    } finally {
      setStarting(false);
    }
  }

  function addJob(name: string) {
    const job: UploadJob = { id: uuidv1(), name, progress: 0, error: '' };
    setUploads((current) => [...current, job]);
    return job.id;
  }

  function updateJob(id: string, patch: Partial<UploadJob>) {
    setUploads((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }

  function finishJob(id: string) {
    setUploads((current) => current.filter((job) => job.id !== id));
  }

  async function handlePhotoFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    for (const file of files) {
      const jobId = addJob(file.name);
      try {
        const prepared = await prepareStoryPhoto(file);
        const key = await uploadFile({
          context: 'meetup',
          filePath: uuidv1(),
          file: prepared.file,
          fileName: 'story-photo.jpg',
          onUploadProgress: ({ loaded, total }: { loaded: number; total: number }) =>
            updateJob(jobId, { progress: Math.min(100, Math.round((loaded / (total || 1)) * 100)) })
        });
        if (!key) throw new Error('The upload did not finish. Try again.');
        applyServer(
          await addMeetupStoryMedia({
            storyId: story!.storyId,
            kind: 'photo',
            key,
            width: prepared.width,
            height: prepared.height
          })
        );
        finishJob(jobId);
      } catch (error: any) {
        updateJob(jobId, { error: error?.message || 'Upload failed.' });
      }
    }
  }

  async function handleClipFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const jobId = addJob(file.name);
    try {
      const extension = clipExtension(file.name);
      if (!extension) throw new Error('Choose an MP4, MOV or WebM video.');
      if (file.size > CLIP_MAX_BYTES) throw new Error('That clip is too large. Keep it under a minute.');
      const probe = await probeStoryClip(file);
      if (!probe.durationSec || probe.durationSec > CLIP_MAX_SECONDS + 0.5) {
        throw new Error(`Clips can be up to ${CLIP_MAX_SECONDS} seconds. Trim it on your phone first.`);
      }
      let posterKey = '';
      if (probe.poster) {
        posterKey =
          (await uploadFile({
            context: 'meetup',
            filePath: uuidv1(),
            file: probe.poster,
            fileName: 'story-poster.jpg'
          })) || '';
      }
      const key = await uploadFile({
        context: 'meetup',
        filePath: uuidv1(),
        file,
        fileName: `story-clip.${extension}`,
        onUploadProgress: ({ loaded, total }: { loaded: number; total: number }) =>
          updateJob(jobId, { progress: Math.min(100, Math.round((loaded / (total || 1)) * 100)) })
      });
      if (!key) throw new Error('The upload did not finish. Try again.');
      applyServer(
        await addMeetupStoryMedia({
          storyId: story!.storyId,
          kind: 'clip',
          key,
          posterKey: posterKey || undefined,
          width: probe.width,
          height: probe.height,
          durationSec: Math.ceil(probe.durationSec)
        })
      );
      finishJob(jobId);
    } catch (error: any) {
      updateJob(jobId, { error: error?.message || 'Upload failed.' });
    }
  }

  async function handleAskParents() {
    setAsking(true);
    setActionError('');
    try {
      const { result, editor } = await requestMeetupStoryConsents(story!.storyId);
      setConsentResult(result);
      applyServer(editor);
    } catch (error: any) {
      setActionError(error?.message || 'Could not send the emails.');
    } finally {
      setAsking(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setActionError('');
    try {
      await saveDirty();
      applyServer(await submitMeetupStory(story!.storyId));
    } catch (error: any) {
      setActionError(error?.message || 'Could not send it.');
    } finally {
      setSubmitting(false);
    }
  }
}

// "Add your parent's email so we can ask them": for a member with no guardian
// on file (or an admin for them). Used only to ask about this story's photos.
function ParentEmailForm({
  hasEmail,
  forSelf,
  username,
  onSave
}: {
  hasEmail: boolean;
  forSelf: boolean;
  username: string;
  onSave: (email: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(!hasEmail);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={css`
          margin-top: 0.4rem;
          border: none;
          background: none;
          padding: 0;
          color: ${Color.logoBlue()};
          font-size: 1.25rem;
          font-weight: bold;
          cursor: pointer;
        `}
      >
        Change the email
      </button>
    );
  }
  return (
    <div
      className={css`
        margin-top: 0.8rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      `}
    >
      <label className={css`font-size: 1.3rem; font-weight: bold; color: #1d2b3a;`}>
        {forSelf
          ? "Add your parent's email so we can ask them"
          : `Add ${username}'s parent's email so we can ask them`}
      </label>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <input
          type="email"
          className={questInputClass}
          style={{ flex: 1, minWidth: '18rem' }}
          value={email}
          maxLength={320}
          placeholder="parent@example.com"
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save();
          }}
        />
        <Button color="logoBlue" size="sm" loading={busy} disabled={busy || !email.trim()} onClick={() => save()}>
          Save
        </Button>
      </div>
      <span className={questHelpClass}>
        We only use it to ask them about this story&apos;s photos, and we tell
        them you typed it in. Your crew never sees the address.
      </span>
      {error && <span style={{ color: Color.red(), fontSize: '1.3rem' }}>{error}</span>}
    </div>
  );

  async function save() {
    if (busy || !email.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onSave(email.trim());
      setEmail('');
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Could not save the email.');
    } finally {
      setBusy(false);
    }
  }
}

function askResultText(result: string) {
  switch (result) {
    case 'sent':
      return 'email sent to their parent';
    case 'no_guardian':
      return 'no parent email on file';
    case 'nothing_to_ask':
      return 'nothing new to ask';
    case 'already_asked':
      return 'already asked, waiting for an answer';
    case 'daily_limit':
      return 'enough emails for today, try tomorrow';
    case 'send_failed':
      return 'the email could not be sent, try again';
    default:
      return result;
  }
}

function chip(on: boolean, color: string) {
  return css`
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1.1rem;
    border-radius: 999px;
    border: 1.5px solid ${on ? color : 'var(--ui-border)'};
    background: ${on ? color : '#fff'};
    color: ${on ? '#fff' : Color.darkerGray()};
    font-size: 1.3rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    &:disabled {
      cursor: default;
      opacity: 0.7;
    }
  `;
}

function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  const done = items.filter((item) => item.done).length;
  return (
    <div
      className={css`
        background: #fff;
        border-radius: 1.6rem;
        padding: 1.6rem 1.8rem;
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
        }
      `}
    >
      <div className={css`display: flex; justify-content: space-between; font-size: 1.4rem; font-weight: bold; color: #1d2b3a;`}>
        <span>Your checklist</span>
        <span style={{ color: '#22a35a' }}>
          {done}/{items.length}
        </span>
      </div>
      <ol
        className={css`
          list-style: none;
          margin: 1rem 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        `}
      >
        {items.map((item) => (
          <li
            key={item.label}
            className={css`
              display: flex;
              align-items: center;
              gap: 0.8rem;
              font-size: 1.4rem;
              color: ${item.done ? '#1b7f45' : Color.darkerGray()};
              font-weight: ${item.done ? 'bold' : 'normal'};
            `}
          >
            <span
              className={css`
                width: 2.2rem;
                height: 2.2rem;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 1.1rem;
                background: ${item.done ? '#22a35a' : Color.extraLightGray()};
                color: ${item.done ? '#fff' : Color.gray()};
                ${item.done ? `animation: ${pop} 0.4s ease-out;` : ''}
              `}
            >
              <Icon icon="check" />
            </span>
            {item.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Card({
  title,
  icon,
  number,
  note,
  children
}: {
  title: string;
  icon: string;
  number: number;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={css`
        background: #fff;
        border-radius: 1.6rem;
        padding: 1.8rem;
        display: flex;
        flex-direction: column;
        gap: 1.4rem;
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          padding: 1.6rem 1.2rem;
        }
      `}
    >
      <h2
        className={css`
          margin: 0;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1.9rem;
          font-weight: 900;
          color: #1d2b3a;
        `}
      >
        <span
          className={css`
            width: 3.4rem;
            height: 3.4rem;
            border-radius: 50%;
            background: ${Color.logoBlue()};
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
          `}
          aria-label={`Part ${number}`}
        >
          <Icon icon={icon} />
        </span>
        {title}
        {note && (
          <span className={css`margin-left: auto; font-size: 1.3rem; color: ${Color.darkGray()};`}>{note}</span>
        )}
      </h2>
      {children}
    </section>
  );
}

