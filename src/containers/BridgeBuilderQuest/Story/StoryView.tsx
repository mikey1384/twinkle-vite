import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { css, cx, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { Color } from '~/constants/css';
import CrewCover from '../CrewCover';
import Lightbox, { type LightboxPhoto } from './Lightbox';
import {
  EXAMPLES_PATH,
  formatDuration,
  HALL_PATH,
  mediaSrc,
  posterSrc,
  QUEST_PATH,
  SAMPLE_LABEL
} from './storyHelpers';
import type { StoryMediaItem, StoryPerson, StoryViewData } from './types';

// THE Bridge Builder story page. One component renders every version of it:
// a live story, an example (sample) story, the crew's live preview in the
// editor and Mikey's review preview, so the preview looks exactly like the
// published page. Layout follows the component's own width (a container
// query), so the editor's narrow preview column shows the phone layout.

const INK = '#1d2b3a';
const BLUE = Color.logoBlue();
const BLUE_DEEP = '#2f6fd0';
const GREEN = '#22a35a';
const PAPER = '#f6f9fc';

const rise = keyframes`
  from { opacity: 0; transform: translateY(1.6rem); }
  to { opacity: 1; transform: translateY(0); }
`;
const kenBurns = keyframes`
  from { transform: scale(1.08); }
  to { transform: scale(1); }
`;
const drawBridge = keyframes`
  from { stroke-dashoffset: 1400; }
  to { stroke-dashoffset: 0; }
`;
const hangerDrop = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;
const floatDot = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.6rem); }
`;

const AVATAR_COLORS = ['#418ceb', '#22a35a', '#f08a24', '#139a9a', '#d9577f', '#2f6fd0'];

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function rotationFor(index: number) {
  return [-1.4, 1.1, -0.6, 1.6, -1.1, 0.7][index % 6];
}

export function PrivateBadge({ item }: { item: StoryMediaItem }) {
  const gate = item.gate;
  if (!gate || gate.publishable) return null;
  const text =
    gate.reason === 'untagged'
      ? 'Private: tag who is in it'
      : gate.reason === 'not_in_story'
        ? "Private: someone who wasn't at the meetup is tagged"
        : "Private for now: waiting for a parent's OK";
  return (
    <span
      className={css`
        position: absolute;
        left: 0.8rem;
        right: 0.8rem;
        bottom: 0.8rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 1rem;
        border-radius: 999px;
        background: rgba(29, 43, 58, 0.86);
        color: #fff;
        font-size: 1.2rem;
        font-weight: bold;
        line-height: 1.3;
      `}
    >
      <Icon icon="lock" />
      {text}
    </span>
  );
}

export default function StoryView({
  story,
  hidePrivate = false,
  topSlot
}: {
  story: StoryViewData;
  // the editor's "Show only what goes public" switch
  hidePrivate?: boolean;
  // a bar above the hero (admin review, the editor's notices)
  topSlot?: React.ReactNode;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos = useMemo(
    () =>
      story.photos.filter(
        (item) => !hidePrivate || !item.gate || item.gate.publishable
      ),
    [hidePrivate, story.photos]
  );
  const clips = useMemo(
    () =>
      story.clips.filter(
        (item) => !hidePrivate || !item.gate || item.gate.publishable
      ),
    [hidePrivate, story.clips]
  );
  const coverSrc = story.cover ? story.cover.url || mediaSrc({ url: '', key: story.cover.key }) : '';
  const coverIsPrivate =
    !!story.cover &&
    story.preview &&
    story.photos.some(
      (item) => mediaSrc(item) === coverSrc && item.gate && !item.gate.publishable
    );
  const showCover = !!coverSrc && !(hidePrivate && coverIsPrivate);
  const lightboxPhotos: LightboxPhoto[] = photos.map((item) => ({
    id: item.id,
    src: mediaSrc(item),
    caption: item.caption,
    alt: item.caption
  }));
  const paragraphs = story.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const title = story.title || 'Our story';

  return (
    <article
      className={css`
        container-type: inline-size;
        width: 100%;
        background: ${PAPER};
        color: ${INK};
        border-radius: 2rem;
        overflow: hidden;
        box-shadow: 0 0.2rem 1.4rem rgba(29, 43, 58, 0.08);
      `}
    >
      {topSlot}
      <header
        className={css`
          position: relative;
          height: 56rem;
          max-height: 68vh;
          overflow: hidden;
          background: ${INK};
          @container (max-width: 720px) {
            height: 38rem;
            max-height: 56vh;
          }
        `}
      >
        {showCover ? (
          <img
            src={coverSrc}
            alt={story.cover?.alt || title}
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
              animation: ${kenBurns} 9s ease-out both;
              ${coverIsPrivate ? 'filter: grayscale(0.7); opacity: 0.55;' : ''}
              @media (prefers-reduced-motion: reduce) {
                animation: none;
              }
            `}
          />
        ) : (
          <CrewCover cover={story.crewCover} height="100%" rounded="0" />
        )}
        {story.isSample && (
          <div
            className={css`
              position: absolute;
              top: 1.6rem;
              left: 50%;
              transform: translateX(-50%);
              max-width: calc(100% - 3.2rem);
              display: flex;
              align-items: center;
              gap: 0.8rem;
              padding: 0.8rem 1.6rem;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.95);
              color: ${INK};
              font-size: 1.4rem;
              font-weight: bold;
              box-shadow: 0 0.4rem 1.6rem rgba(0, 0, 0, 0.18);
              text-align: center;
              line-height: 1.35;
            `}
          >
            <Icon icon="wand-magic-sparkles" style={{ color: BLUE_DEEP, flexShrink: 0 }} />
            {SAMPLE_LABEL}
          </div>
        )}
        {coverIsPrivate && (
          <span
            className={css`
              position: absolute;
              top: 1.6rem;
              right: 1.6rem;
              padding: 0.6rem 1.2rem;
              border-radius: 999px;
              background: rgba(29, 43, 58, 0.86);
              color: #fff;
              font-size: 1.2rem;
              font-weight: bold;
            `}
          >
            <Icon icon="lock" style={{ marginRight: '0.5rem' }} />
            Cover is private until every parent in it says OK
          </span>
        )}
      </header>

      <div
        className={css`
          position: relative;
          margin: -12rem auto 0;
          width: calc(100% - 6rem);
          max-width: 92rem;
          background: #fff;
          border-radius: 2rem;
          padding: 3.2rem 4rem 3rem;
          box-shadow: 0 1.2rem 4rem rgba(29, 43, 58, 0.16);
          animation: ${rise} 0.6s ease-out 0.1s both;
          @container (max-width: 720px) {
            margin-top: -6rem;
            width: calc(100% - 2rem);
            padding: 2.2rem 1.8rem 2rem;
            border-radius: 1.6rem;
          }
          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.8rem;
            flex-wrap: wrap;
            margin-bottom: 1.2rem;
          `}
        >
          <span
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.6rem;
              font-size: 1.25rem;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: ${GREEN};
            `}
          >
            <Icon icon="users" />
            Bridge Builders
          </span>
          {story.activityKind && (
            <span
              className={css`
                font-size: 1.25rem;
                font-weight: bold;
                color: ${Color.darkGray()};
              `}
            >
              · {story.activityKind}
            </span>
          )}
        </div>
        <h1
          className={css`
            margin: 0;
            font-size: 4.2rem;
            line-height: 1.12;
            font-weight: 900;
            letter-spacing: -0.02em;
            color: ${INK};
            overflow-wrap: anywhere;
            @container (max-width: 720px) {
              font-size: 2.8rem;
            }
          `}
        >
          {title}
        </h1>
        {story.subtitle && (
          <p
            className={css`
              margin: 1rem 0 0;
              font-size: 2rem;
              line-height: 1.4;
              color: ${Color.darkerGray()};
              @container (max-width: 720px) {
                font-size: 1.7rem;
              }
            `}
          >
            {story.subtitle}
          </p>
        )}
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
            margin-top: 2rem;
          `}
        >
          {story.dateLabel && <MetaChip icon="clock">{story.dateLabel}</MetaChip>}
          {story.place && <MetaChip icon="school">{story.place}</MetaChip>}
          {story.branches.length > 0 && (
            <MetaChip icon="globe">
              {story.branches.length} branches: {story.branches.join(' · ')}
            </MetaChip>
          )}
          {story.grownUps.length > 0 && !story.isSample && (
            <MetaChip icon="chalkboard-teacher">{story.grownUps[0].label}</MetaChip>
          )}
        </div>
      </div>

      <Section title="The crew" icon="users" delay={0.2}>
        <CrewRow people={story.people} isSample={story.isSample} />
        {story.isSample && story.grownUps.length > 0 && (
          <div
            className={css`
              margin-top: 1.8rem;
              display: flex;
              flex-wrap: wrap;
              gap: 0.8rem;
              justify-content: center;
            `}
          >
            {story.grownUps.map((grownUp) => (
              <MetaChip key={grownUp.label} icon="chalkboard-teacher">
                <b>{grownUp.label}</b>
                {grownUp.role ? ` · ${grownUp.role}` : ''}
              </MetaChip>
            ))}
          </div>
        )}
      </Section>

      {paragraphs.length > 0 && (
        <Section title="What we did together" icon="book-open" delay={0.3}>
          <div
            className={css`
              max-width: 70rem;
              margin: 0 auto;
              font-size: 1.8rem;
              line-height: 1.8;
              color: #2c3a48;
              @container (max-width: 720px) {
                font-size: 1.65rem;
                line-height: 1.75;
              }
              p {
                margin: 0 0 1.6rem;
                overflow-wrap: anywhere;
              }
              p:first-of-type {
                font-size: 1.12em;
                color: ${INK};
              }
              p:first-of-type::first-letter {
                float: left;
                font-size: 3.4em;
                line-height: 0.9;
                font-weight: 900;
                color: ${BLUE_DEEP};
                margin: 0.3rem 0.8rem 0 0;
              }
            `}
          >
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </Section>
      )}

      {photos.length > 0 && (
        <Section
          title="Moments"
          icon="images"
          delay={0.35}
          note={`${photos.length} photo${photos.length === 1 ? '' : 's'}`}
        >
          <div
            className={css`
              column-count: 3;
              column-gap: 2.4rem;
              @container (max-width: 900px) {
                column-count: 2;
              }
              @container (max-width: 520px) {
                column-count: 1;
              }
            `}
          >
            {photos.map((item, index) => (
              <figure
                key={item.id}
                className={css`
                  break-inside: avoid;
                  margin: 0 0 2.6rem;
                  padding: 1rem 1rem 1.4rem;
                  background: #fff;
                  border-radius: 0.6rem;
                  box-shadow: 0 0.4rem 1.6rem rgba(29, 43, 58, 0.12);
                  transform: rotate(${rotationFor(index)}deg);
                  transition: transform 0.25s ease, box-shadow 0.25s ease;
                  &:hover {
                    transform: rotate(0deg) scale(1.02);
                    box-shadow: 0 1rem 2.8rem rgba(29, 43, 58, 0.2);
                  }
                  @container (max-width: 520px) {
                    transform: none;
                  }
                  @media (prefers-reduced-motion: reduce) {
                    transition: none;
                  }
                `}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={item.caption ? `Open photo: ${item.caption}` : 'Open photo'}
                  className={css`
                    position: relative;
                    display: block;
                    width: 100%;
                    padding: 0;
                    border: none;
                    background: ${Color.extraLightGray()};
                    border-radius: 0.3rem;
                    overflow: hidden;
                    cursor: zoom-in;
                    ${item.width && item.height ? `aspect-ratio: ${item.width} / ${item.height};` : 'min-height: 16rem;'}
                  `}
                >
                  <img
                    src={mediaSrc(item)}
                    alt={item.caption || `Photo ${index + 1}`}
                    loading="lazy"
                    className={cx(
                      css`
                        display: block;
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                      `,
                      item.gate && !item.gate.publishable
                        ? css`
                            filter: grayscale(0.8);
                            opacity: 0.5;
                          `
                        : ''
                    )}
                  />
                  <PrivateBadge item={item} />
                </button>
                {item.caption && (
                  <figcaption
                    className={css`
                      margin-top: 1.1rem;
                      font-size: 1.5rem;
                      line-height: 1.5;
                      color: #3a4856;
                      overflow-wrap: anywhere;
                    `}
                  >
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
          {story.isSample && <SampleFootnote />}
        </Section>
      )}

      {clips.length > 0 && (
        <Section title="Clips" icon="film" delay={0.4}>
          <div
            className={css`
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(28rem, 1fr));
              gap: 2rem;
            `}
          >
            {clips.map((item) => (
              <figure
                key={item.id}
                className={css`
                  margin: 0;
                  background: #fff;
                  border-radius: 1.2rem;
                  overflow: hidden;
                  box-shadow: 0 0.4rem 1.6rem rgba(29, 43, 58, 0.12);
                `}
              >
                <div
                  className={css`
                    position: relative;
                    background: #000;
                    aspect-ratio: ${item.width && item.height ? `${item.width} / ${item.height}` : '16 / 9'};
                  `}
                >
                  <video
                    src={mediaSrc(item)}
                    poster={posterSrc(item) || undefined}
                    controls
                    playsInline
                    preload="none"
                    className={css`
                      width: 100%;
                      height: 100%;
                      display: block;
                      object-fit: contain;
                      ${item.gate && !item.gate.publishable ? 'opacity: 0.5;' : ''}
                    `}
                  />
                  <span
                    className={css`
                      position: absolute;
                      top: 0.8rem;
                      right: 0.8rem;
                      padding: 0.3rem 0.8rem;
                      border-radius: 999px;
                      background: rgba(0, 0, 0, 0.65);
                      color: #fff;
                      font-size: 1.2rem;
                      font-weight: bold;
                      pointer-events: none;
                    `}
                  >
                    <Icon icon="play" style={{ marginRight: '0.4rem' }} />
                    {formatDuration(item.durationSec)}
                  </span>
                  <PrivateBadge item={item} />
                </div>
                {item.caption && (
                  <figcaption
                    className={css`
                      padding: 1.2rem 1.4rem 1.4rem;
                      font-size: 1.5rem;
                      line-height: 1.5;
                      color: #3a4856;
                    `}
                  >
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </Section>
      )}

      <CallToAction isSample={story.isSample} />

      {lightboxIndex !== null && (
        <Lightbox
          photos={lightboxPhotos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </article>
  );
}

function MetaChip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 1.2rem;
        border-radius: 999px;
        background: ${Color.logoBlue(0.1)};
        color: ${BLUE_DEEP};
        font-size: 1.35rem;
        font-weight: bold;
        line-height: 1.3;
      `}
    >
      <Icon icon={icon} />
      <span>{children}</span>
    </span>
  );
}

function Section({
  title,
  icon,
  note,
  delay,
  children
}: {
  title: string;
  icon: string;
  note?: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className={css`
        max-width: 110rem;
        margin: 0 auto;
        padding: 5rem 4rem 0;
        animation: ${rise} 0.6s ease-out ${delay}s both;
        @container (max-width: 720px) {
          padding: 3.4rem 1.6rem 0;
        }
        @media (prefers-reduced-motion: reduce) {
          animation: none;
        }
      `}
    >
      <h2
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 0 0 2.6rem;
          font-size: 2.4rem;
          font-weight: 900;
          color: ${INK};
          text-align: center;
          @container (max-width: 720px) {
            font-size: 2.1rem;
            margin-bottom: 2rem;
          }
        `}
      >
        <span
          className={css`
            width: 4rem;
            height: 4rem;
            border-radius: 50%;
            background: ${BLUE};
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.6rem;
            flex-shrink: 0;
          `}
        >
          <Icon icon={icon} />
        </span>
        {title}
        {note && (
          <span
            className={css`
              font-size: 1.4rem;
              font-weight: bold;
              color: ${Color.darkGray()};
            `}
          >
            {note}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

// The crew: everyone who met, joined by a little suspension bridge.
function CrewRow({ people, isSample }: { people: StoryPerson[]; isSample: boolean }) {
  const count = Math.max(1, people.length);
  const hangers = Array.from({ length: 13 }, (_, i) => 60 + i * 70);
  return (
    <div
      className={css`
        position: relative;
      `}
    >
      <svg
        aria-hidden
        viewBox="0 0 1000 120"
        preserveAspectRatio="none"
        className={css`
          position: absolute;
          left: 6%;
          right: 6%;
          top: -1.4rem;
          width: 88%;
          height: 6.4rem;
          overflow: visible;
          @container (max-width: 720px) {
            display: none;
          }
        `}
      >
        {hangers.map((x, i) => {
          const t = (x - 500) / 500;
          const y = 16 + 70 * t * t;
          return (
            <line
              key={x}
              x1={x}
              x2={x}
              y1={y}
              y2={104}
              stroke={Color.logoBlue(0.35)}
              strokeWidth={3}
              className={css`
                transform-origin: ${x}px 104px;
                transform-box: view-box;
                animation: ${hangerDrop} 0.5s ease-out ${0.9 + i * 0.05}s both;
                @media (prefers-reduced-motion: reduce) {
                  animation: none;
                }
              `}
            />
          );
        })}
        <path
          d="M 0 86 Q 500 -54 1000 86"
          fill="none"
          stroke={BLUE}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={1400}
          className={css`
            animation: ${drawBridge} 1.4s ease-out 0.3s both;
            @media (prefers-reduced-motion: reduce) {
              animation: none;
            }
          `}
        />
        <line x1={0} x2={1000} y1={104} y2={104} stroke={GREEN} strokeWidth={7} strokeLinecap="round" />
      </svg>
      <div
        className={css`
          position: relative;
          display: grid;
          grid-template-columns: repeat(${Math.min(count, 4)}, minmax(0, 1fr));
          gap: 2rem;
          padding-top: 5.6rem;
          @container (max-width: 720px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            padding-top: 0;
            gap: 1.2rem;
          }
        `}
      >
        {people.map((person, index) => (
          <div
            key={`${person.userId}-${person.username}`}
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              gap: 0.8rem;
              padding: 2rem 1.4rem 1.8rem;
              background: #fff;
              border-radius: 1.6rem;
              box-shadow: 0 0.4rem 1.6rem rgba(29, 43, 58, 0.08);
              min-width: 0;
            `}
          >
            <div
              className={css`
                animation: ${floatDot} 4s ease-in-out ${index * 0.4}s infinite;
                @media (prefers-reduced-motion: reduce) {
                  animation: none;
                }
              `}
            >
              {isSample || !person.userId ? (
                <InitialAvatar name={person.username} />
              ) : (
                <ProfilePic
                  userId={person.userId}
                  profilePicUrl={person.profilePicUrl || undefined}
                  style={{ width: '7.6rem' }}
                />
              )}
            </div>
            {isSample || !person.userId ? (
              <b className={usernameClass}>{person.username}</b>
            ) : (
              <Link to={`/users/${person.username}`} className={usernameClass}>
                {person.username}
              </Link>
            )}
            {person.branch && (
              <span
                className={css`
                  padding: 0.3rem 1rem;
                  border-radius: 999px;
                  background: ${Color.green(0.12)};
                  color: #1b7f45;
                  font-size: 1.25rem;
                  font-weight: bold;
                `}
              >
                {person.branch}
              </span>
            )}
            {person.role && (
              <span
                className={css`
                  font-size: 1.35rem;
                  line-height: 1.45;
                  color: #4a5866;
                  overflow-wrap: anywhere;
                `}
              >
                {person.role}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const usernameClass = css`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${INK};
  max-width: 100%;
  overflow-wrap: anywhere;
  &:hover {
    text-decoration: none;
    color: ${BLUE_DEEP};
  }
`;

function InitialAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className={css`
        width: 7.6rem;
        height: 7.6rem;
        border-radius: 50%;
        background: ${colorFor(name)};
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        font-weight: 900;
        box-shadow: inset 0 -0.4rem 0 rgba(0, 0, 0, 0.12);
      `}
    >
      {(name || '?').slice(0, 1).toUpperCase()}
    </span>
  );
}

function SampleFootnote() {
  return (
    <p
      className={css`
        margin: 0.4rem 0 0;
        text-align: center;
        font-size: 1.35rem;
        color: ${Color.darkGray()};
      `}
    >
      <Icon icon="wand-magic-sparkles" style={{ marginRight: '0.5rem' }} />
      {SAMPLE_LABEL}. Real stories show real photos your crew takes, and only
      the ones every parent in them said yes to.
    </p>
  );
}

function CallToAction({ isSample }: { isSample: boolean }) {
  return (
    <div
      className={css`
        margin: 6rem 4rem 4rem;
        padding: 4rem 3rem;
        border-radius: 2rem;
        background: ${BLUE_DEEP};
        color: #fff;
        text-align: center;
        position: relative;
        overflow: hidden;
        @container (max-width: 720px) {
          margin: 4rem 1.2rem 2rem;
          padding: 3rem 1.8rem;
        }
      `}
    >
      <svg
        aria-hidden
        viewBox="0 0 400 60"
        className={css`
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 6rem;
          opacity: 0.25;
        `}
        preserveAspectRatio="none"
      >
        <path d="M 0 50 Q 200 -10 400 50" fill="none" stroke="#fff" strokeWidth={3} />
        <line x1={0} x2={400} y1={56} y2={56} stroke="#fff" strokeWidth={4} />
      </svg>
      <div
        className={css`
          font-size: 1.3rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          opacity: 0.85;
        `}
      >
        {isSample ? 'Make yours real' : 'Your turn'}
      </div>
      <h3
        className={css`
          margin: 0.8rem 0 1rem;
          font-size: 3rem;
          font-weight: 900;
          line-height: 1.2;
          @container (max-width: 720px) {
            font-size: 2.3rem;
          }
        `}
      >
        Build a bridge of your own
      </h3>
      <p
        className={css`
          margin: 0 auto 2.2rem;
          max-width: 56rem;
          font-size: 1.6rem;
          line-height: 1.6;
          opacity: 0.92;
        `}
      >
        Find students from other Twinkle branches, meet up with a grown-up,
        do something amazing together and make a page like this one.
      </p>
      <div
        className={css`
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
        `}
      >
        <Link
          to={QUEST_PATH}
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.8rem;
            padding: 1.3rem 2.6rem;
            border-radius: 999px;
            background: ${GREEN};
            color: #fff;
            font-size: 1.7rem;
            font-weight: 800;
            box-shadow: 0 0.4rem 0 #177a41;
            transition: transform 0.15s;
            &:hover {
              text-decoration: none;
              color: #fff;
              transform: translateY(-2px);
            }
          `}
        >
          <Icon icon="plus" />
          Start your own crew
        </Link>
        <Link
          to={isSample ? EXAMPLES_PATH : HALL_PATH}
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.8rem;
            padding: 1.3rem 2.2rem;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.16);
            color: #fff;
            font-size: 1.6rem;
            font-weight: 700;
            &:hover {
              text-decoration: none;
              color: #fff;
              background: rgba(255, 255, 255, 0.26);
            }
          `}
        >
          <Icon icon="book-open" />
          {isSample ? 'More examples' : 'More Bridge Builders stories'}
        </Link>
      </div>
    </div>
  );
}
