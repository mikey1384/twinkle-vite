import React, { useEffect, useState } from 'react';
import RecentGroupItem from './RecentGroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';

export default function RecentGroupItems() {
  const { userId } = useKeyContext((v) => v.myState);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { results } = await loadPublicGroups({
          limit: 3
        });
        setGroups(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }, [loadPublicGroups]);

  if (loading) {
    return <Loading />;
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Home/RecentGroupItems">
      <div
        className={css`
          padding-left: 1rem;
          margin-bottom: 0.5rem;
          border-left: 2px solid ${Color.borderGray()};
        `}
      >
        {groups.map((group: any) => (
          <RecentGroupItem
            key={group.id}
            groupName={group.channelName}
            thumbPath={group.thumbPath}
            isMember={group.allMemberIds.includes(userId)}
            pathId={group.pathId}
          />
        ))}
      </div>
    </ErrorBoundary>
  );
}
