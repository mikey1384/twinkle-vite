import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import FriendButton, { type FriendState } from '~/components/FriendButton';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Loading from '~/components/Loading';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { pageWidthClass, sectionClass } from '~/containers/BridgeBuilderQuest/pageStyles';

interface FriendRow {
  id: number;
  username: string;
  realName: string;
  profilePicUrl: string;
  since: number;
}
interface Overview {
  enabled: boolean;
  friends: FriendRow[];
  incoming: FriendRow[];
  outgoing: FriendRow[];
}

// The member's friends: requests waiting for them first, then friends, then
// requests they sent. Each row carries the same friend button as profiles
// (accept, two-tap unfriend / cancel), so there is one way to do each thing.
export default function Friends() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadFriendsOverview = useAppContext((v) => v.requestHelpers.loadFriendsOverview);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setData(null);
    setError('');
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function reload() {
    return loadFriendsOverview()
      .then((overview: Overview) => setData(overview))
      .catch((err: any) => setError(err?.message || 'Could not load your friends.'));
  }

  if (!userId) {
    return (
      <div style={{ padding: '2rem 1rem' }}>
        <HomeLoginPrompt />
      </div>
    );
  }

  return (
    <ErrorBoundary componentPath="Friends">
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: center;
          padding-bottom: 12rem;
        `}
      >
        <main className={pageWidthClass}>
          <h1
            className={css`
              font-size: 2.4rem;
              font-weight: bold;
              color: ${Color.black()};
              margin: 1.6rem 0 0;
              @media (max-width: ${mobileMaxWidth}) {
                margin: 1.2rem 1rem 0;
              }
            `}
          >
            My Friends
          </h1>
          {error && <p className={noteClass}>{error}</p>}
          {!data && !error && <Loading />}
          {data && !data.enabled && (
            <p className={noteClass}>Friends are turned off right now.</p>
          )}
          {data?.enabled && (
            <>
              {data.incoming.length > 0 && (
                <Section title="Friend requests" rows={data.incoming} state="incoming" onChange={reload} />
              )}
              <Section
                title={`Friends (${data.friends.length})`}
                rows={data.friends}
                state="friends"
                onChange={reload}
                empty="No friends yet. Add a friend from their profile or by hovering their username."
              />
              {data.outgoing.length > 0 && (
                <Section title="Requests you sent" rows={data.outgoing} state="requested" onChange={reload} />
              )}
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

function Section({
  title,
  rows,
  state,
  onChange,
  empty
}: {
  title: string;
  rows: FriendRow[];
  // every row in a section shares the state the overview already knows
  state: FriendState;
  onChange: () => void;
  empty?: string;
}) {
  return (
    <section className={sectionClass}>
      <h2
        className={css`
          font-size: 1.7rem;
          font-weight: bold;
          color: ${Color.black()};
          margin: 0 0 1rem;
        `}
      >
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className={noteClass} style={{ margin: 0 }}>
          {empty}
        </p>
      ) : (
        <ul
          className={css`
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
          `}
        >
          {rows.map((row) => (
            <li
              key={row.id}
              className={css`
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.6rem 0.8rem;
                border-radius: 1rem;
                background: ${Color.extraLightGray(0.5)};
              `}
            >
              <Link to={`/users/${encodeURIComponent(row.username)}`} style={{ flexShrink: 0 }}>
                <ProfilePic
                  userId={row.id}
                  profilePicUrl={row.profilePicUrl}
                  size="4rem"
                />
              </Link>
              <Link
                to={`/users/${encodeURIComponent(row.username)}`}
                className={css`
                  flex: 1;
                  min-width: 0;
                  display: flex;
                  flex-direction: column;
                  text-decoration: none;
                  color: ${Color.black()};
                `}
              >
                <b
                  className={css`
                    font-size: 1.5rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  `}
                >
                  {row.username}
                </b>
                {row.realName && (
                  <span
                    className={css`
                      font-size: 1.25rem;
                      color: ${Color.darkGray()};
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    `}
                  >
                    {row.realName}
                  </span>
                )}
              </Link>
              <span style={{ flexShrink: 0, maxWidth: '55%' }}>
                <FriendButton
                  userId={row.id}
                  variant="popup"
                  initialState={state}
                  onChange={onChange}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const noteClass = css`
  font-size: 1.4rem;
  color: ${Color.darkGray()};
  margin: 1.2rem 0 0;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 1.2rem 1rem 0;
  }
`;
