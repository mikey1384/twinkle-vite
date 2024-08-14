import React, { useEffect, useState } from 'react';
import RecentGroupItem from './RecentGroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';

export default function RecentGroupItems() {
  const { userId } = useKeyContext((v) => v.myState);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    init();
    async function init() {
      try {
        const { results } = await loadPublicGroups({
          limit: 3
        });
        setGroups(results);
      } catch (error) {
        console.error(error);
      }
    }
  }, [loadPublicGroups]);

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
