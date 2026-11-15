import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { Color, borderRadius } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { getErrorMessage } from '~/helpers/errorMessageHelpers';
import {
  apprenticeSentViaLabel,
  APPRENTICE_QUESTIONS,
  type ApprenticeAnswers,
  type ApprenticeResolvedPick
} from '~/constants/apprentice';

export interface ApprenticeApplicationDetail {
  user: { userId: number; username: string; joinedAt: number | null; lastActive: number | null };
  revision: number;
  firstSubmittedAt: number | null;
  lastSubmittedAt: number | null;
  latest: {
    revision: number;
    submittedAt: number;
    answers: ApprenticeAnswers;
    picks: ApprenticeResolvedPick[];
  } | null;
  timeline: {
    revision: number;
    submittedAt: number;
    changed: string[];
    // '' when the member sent it; else Zero or Ciel sent it for them
    sentVia?: string;
  }[];
  activity: {
    publicBuildCount: number;
    postsLast90Days: number;
    commentsLast30Days: number;
    facts: string[];
  };
  observations: {
    id: number;
    polarity: 'positive' | 'negative' | 'neutral';
    trait: string;
    note: string;
    evidenceUrl: string | null;
    at: number;
  }[];
}

// One application, for Mikey: the latest version, what changed in each
// update, a short activity summary and the daily run's observations. The
// standard window; read-only.
export default function ApprenticeApplicationModal({
  userId,
  onHide
}: {
  userId: number;
  onHide: () => void;
}) {
  const loadApprenticeApplicationDetail = useAppContext(
    (v) => v.requestHelpers.loadApprenticeApplicationDetail
  );
  const [detail, setDetail] = useState<ApprenticeApplicationDetail | null>(
    null
  );
  const [error, setError] = useState('');

  useEffect(() => {
    let canceled = false;
    loadApprenticeApplicationDetail(userId)
      .then((data: ApprenticeApplicationDetail) => {
        if (!canceled) setDetail(data);
      })
      .catch((err: unknown) => {
        if (!canceled) setError(getErrorMessage(err));
      });
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <ApprenticeApplicationModalView
      detail={detail}
      error={error}
      onHide={onHide}
    />
  );
}

export function ApprenticeApplicationModalView({
  detail,
  error,
  onHide
}: {
  detail: ApprenticeApplicationDetail | null;
  error: string;
  onHide: () => void;
}) {
  const navigate = useNavigate();
  return (
    <Modal
      modalKey="ApprenticeApplication"
      isOpen
      size="lg"
      onClose={onHide}
      title={detail ? `${detail.user.username}'s application` : 'Application'}
      footer={
        <>
          {detail && (
            <Button
              variant="ghost"
              style={{ marginRight: '0.7rem' }}
              onClick={() => {
                onHide();
                navigate(`/users/${detail.user.username}`);
              }}
            >
              Profile
            </Button>
          )}
          <Button color="logoBlue" onClick={onHide}>
            Close
          </Button>
        </>
      }
    >
      {error ? (
        <div className={mutedClass}>{error}</div>
      ) : !detail || !detail.latest ? (
        <Loading />
      ) : (
        <div className={bodyClass}>
          <div className={mutedClass}>
            Version {detail.revision} · sent {timeSince(detail.latest.submittedAt)}
            {apprenticeSentViaLabel(detail.timeline[0]?.sentVia)
              ? ` ${apprenticeSentViaLabel(detail.timeline[0]?.sentVia)}`
              : ''}
            {detail.firstSubmittedAt && detail.revision > 1
              ? ` · first sent ${timeSince(detail.firstSubmittedAt)}`
              : ''}
          </div>
          {detail.timeline[0] && detail.revision > 1 && (
            <div className={changedClass}>
              <b>Changed in this version:</b>{' '}
              {detail.timeline[0].changed.join(', ')}
            </div>
          )}

          {detail.latest.picks.length > 0 && (
            <section>
              <h3>Builds and posts</h3>
              <ul className={picksClass}>
                {detail.latest.picks.map((pick) => (
                  <li key={`${pick.type}:${pick.id}`}>
                    <Link to={pick.path} onClick={onHide}>
                      {pick.title || 'Untitled'}
                    </Link>{' '}
                    <span className={mutedClass}>
                      {pick.type === 'build' ? 'Build' : 'Post'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {APPRENTICE_QUESTIONS.map((question) =>
            detail.latest?.answers[question.field]?.trim() ? (
              <section key={question.field}>
                <h3>{question.label}</h3>
                <p className={answerClass}>
                  {detail.latest.answers[question.field]}
                </p>
              </section>
            ) : null
          )}

          {detail.timeline.length > 1 && (
            <section>
              <h3>Versions</h3>
              <ul className={listClass}>
                {detail.timeline.map((item) => (
                  <li key={item.revision}>
                    <b>{item.revision}</b> · {timeSince(item.submittedAt)}
                    {apprenticeSentViaLabel(item.sentVia)
                      ? ` ${apprenticeSentViaLabel(item.sentVia)}`
                      : ''}{' '}
                    · {item.changed.join(', ')}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3>Activity</h3>
            <p className={mutedClass} style={{ margin: 0 }}>
              {detail.activity.publicBuildCount} public builds ·{' '}
              {detail.activity.postsLast90Days} posts in 90 days ·{' '}
              {detail.activity.commentsLast30Days} comments in 30 days
            </p>
            {detail.activity.facts.length > 0 && (
              <ul className={listClass}>
                {detail.activity.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            )}
          </section>

          {detail.observations.length > 0 && (
            <section>
              <h3>Daily run observations</h3>
              <ul className={listClass}>
                {detail.observations.map((item) => (
                  <li key={item.id}>
                    <span
                      className={css`
                        font-weight: bold;
                        color: ${item.polarity === 'positive'
                          ? Color.green()
                          : item.polarity === 'negative'
                            ? Color.redOrange()
                            : Color.darkGray()};
                      `}
                    >
                      {item.trait}
                    </span>{' '}
                    {item.note}{' '}
                    {item.evidenceUrl && (
                      <a href={item.evidenceUrl}>evidence</a>
                    )}{' '}
                    <span className={mutedClass}>{timeSince(item.at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

const bodyClass = css`
  width: 100%;
  font-size: 1.5rem;
  line-height: 1.6;
  section {
    margin-top: 2rem;
  }
  h3 {
    margin: 0 0 0.6rem;
    font-size: 1.6rem;
    color: ${Color.black()};
  }
`;

const mutedClass = css`
  color: ${Color.gray()};
  font-size: 1.3rem;
`;

const changedClass = css`
  margin-top: 1rem;
  padding: 0.9rem 1.2rem;
  border-radius: ${borderRadius};
  background: ${Color.whiteBlueGray()};
  font-size: 1.4rem;
`;

const answerClass = css`
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const picksClass = css`
  margin: 0;
  padding-left: 2rem;
  li + li {
    margin-top: 0.4rem;
  }
`;

const listClass = css`
  margin: 0.6rem 0 0;
  padding-left: 2rem;
  li + li {
    margin-top: 0.5rem;
  }
`;
