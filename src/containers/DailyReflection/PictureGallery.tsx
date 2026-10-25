import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import ImageModal from '~/components/Modals/ImageModal';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import {
  paperSecondaryButtonCls,
  paperWorkingDotsCls
} from '~/components/Modals/DailyQuestionModal/paperTheme';
import { PAGE } from './theme';

// My pictures (Mikey 10-24): every picture a member made on Picture Day,
// private to them. Each day shows all its pictures, newest first, with the
// one they picked marked and a link to the post if they shared it.
export interface GalleryPicture {
  path: string;
  prompt: string;
  style: string;
  createdAt: number;
}

export interface GalleryDay {
  questionId: number;
  dayIndex: number;
  chosenPath: string;
  sharedResponseId: number | null;
  pictures: GalleryPicture[];
}

const PAGE_SIZE = 8;

export default function PictureGallery() {
  const loadMyPictures = useAppContext((v) => v.requestHelpers.loadMyPictures);
  const [days, setDays] = useState<GalleryDay[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [viewing, setViewing] = useState<GalleryPicture | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    void loadPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={wrapCls}>
      <header className={headerCls}>
        <h1>My pictures</h1>
        <p>
          <Icon icon="lock" /> Every picture you made on Picture Day. Only you
          can see this page.
        </p>
      </header>

      {days.map((day) => (
        <section key={day.questionId} className={dayCls}>
          <div className={dayHeadCls}>
            <span className={dateCls}>{formatDay(day)}</span>
            {day.sharedResponseId ? (
              <Link
                className={sharedLinkCls}
                to={`/daily-reflections/${day.sharedResponseId}`}
              >
                <Icon icon="share" /> Shared
              </Link>
            ) : null}
          </div>
          <div className={gridCls}>
            {day.pictures.map((picture) => {
              const isPick = picture.path === day.chosenPath;
              return (
                <button
                  key={picture.path}
                  type="button"
                  className={tileCls}
                  onClick={() => setViewing(picture)}
                  aria-label={`See "${picture.prompt}" full size`}
                >
                  <img
                    src={`${cloudFrontURL}/${picture.path}`}
                    alt={picture.prompt}
                    loading="lazy"
                  />
                  {isPick ? (
                    <span className={pickCls}>
                      <Icon icon="check" /> Your pick
                    </span>
                  ) : null}
                  <span className={captionCls}>
                    <span className="text">
                      {picture.style ? (
                        <span className="style">{picture.style}</span>
                      ) : null}
                      {picture.prompt}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {loading ? (
        <p className={noteCls}>
          <span className={paperWorkingDotsCls}>Loading your pictures</span>
        </p>
      ) : failed ? (
        <div className={noteCls}>
          <p>We couldn’t load your pictures.</p>
          <button
            type="button"
            className={paperSecondaryButtonCls}
            onClick={() => loadPage(days.length ? nextBefore : null)}
          >
            Try again
          </button>
        </div>
      ) : days.length === 0 ? (
        <p className={noteCls}>
          No pictures yet. On your next Picture Day, describe a picture and it
          will be kept here.
        </p>
      ) : nextBefore ? (
        <div className={moreCls}>
          <button
            type="button"
            className={paperSecondaryButtonCls}
            onClick={() => loadPage(nextBefore)}
          >
            Show older pictures
          </button>
        </div>
      ) : null}

      {viewing && (
        <ImageModal
          onHide={() => setViewing(null)}
          src={`${cloudFrontURL}/${viewing.path}`}
          caption={viewing.prompt}
          hasCaption={!!viewing.prompt}
          downloadable
        />
      )}
    </div>
  );

  async function loadPage(before: number | null) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const data = await loadMyPictures({ before, limit: PAGE_SIZE });
      if (!data || data.error || !Array.isArray(data.days)) {
        throw new Error(data?.error || 'failed');
      }
      setDays((current) => (before ? [...current, ...data.days] : data.days));
      setNextBefore(data.nextBefore || null);
    } catch {
      setFailed(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }
}

// the day the pictures were made, in the member's own calendar
function formatDay(day: GalleryDay) {
  const madeAt = Math.max(...day.pictures.map((p) => p.createdAt || 0));
  if (!madeAt) return 'Picture Day';
  return new Date(madeAt * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const wrapCls = css`
  max-width: calc(1100 * var(--px));
  width: 100%;
  margin: 0 auto;
`;

const headerCls = css`
  text-align: center;
  margin-bottom: 2rem;
  h1 {
    margin: 0;
    font-size: 3rem;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: ${PAGE.ink};
  }
  p {
    margin: 0.4rem 0 0;
    font-size: 1.4rem;
    color: ${PAGE.inkSoft};
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    margin-bottom: 1.4rem;
    h1 {
      font-size: 2.3rem;
    }
    p {
      font-size: 1.25rem;
    }
  }
`;

const dayCls = css`
  background: ${PAGE.paper};
  border: 1px solid ${PAGE.line};
  border-radius: 18px;
  padding: 1.4rem 1.6rem 1.6rem;
  & + & {
    margin-top: 1.6rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.1rem 1rem 1.2rem;
  }
`;

const dayHeadCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
`;

const dateCls = css`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${PAGE.ink};
`;

const sharedLinkCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${PAGE.blue};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const gridCls = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(200 * var(--px)), 1fr));
  gap: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }
`;

const tileCls = css`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid ${PAGE.line};
  border-radius: 14px;
  overflow: hidden;
  background: ${PAGE.paperDeep};
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(80, 60, 30, 0.14);
  }
  img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
`;

const pickCls = css`
  position: absolute;
  top: 0.7rem;
  left: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  background: ${PAGE.ink};
  color: ${PAGE.paper};
  font-size: 1.1rem;
  font-weight: 700;
`;

const captionCls = css`
  display: block;
  flex: 1 1 auto;
  padding: 0.7rem 0.9rem 0.8rem;
  background: ${PAGE.paper};
  color: ${PAGE.ink};
  font-size: 1.25rem;
  line-height: 1.4;
  .text {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .style {
    margin-right: 0.45rem;
    color: ${PAGE.accent};
    font-weight: 700;
  }
`;

const noteCls = css`
  margin: 2rem 0;
  text-align: center;
  font-size: 1.4rem;
  color: ${PAGE.inkSoft};
  p {
    margin: 0 0 1rem;
  }
`;

const moreCls = css`
  display: flex;
  justify-content: center;
  margin-top: 1.8rem;
`;
