import React, { useEffect } from 'react';
import RecentGroupItem from './RecentGroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext, useHomeContext } from '~/contexts';
import { Color } from '~/constants/css';

export default function RecentGroupItems() {
  const { userId } = useKeyContext((v) => v.myState);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const onSetGroups = useHomeContext((v) => v.actions.onSetGroups);
  const groups = useHomeContext((v) => v.state.groups);

  useEffect(() => {
    init();
    async function init() {
      try {
        const { results } = await loadPublicGroups({
          limit: 1
        });
        onSetGroups(results);
      } catch (error) {
        console.error(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            groupId={group.id}
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
