import React, { useEffect, useState } from 'react';
import GroupItem from './GroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts/';

export default function Groups() {
  const { userId } = useKeyContext((v) => v.myState);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    init();
    async function init() {
      const groups = await loadPublicGroups();
      setGroups(groups);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Groups">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: 16px;
        `}
      >
        {groups.map(
          (group: {
            id: number;
            creatorId: number;
            description: string;
            channelName: string;
            allMemberIds: number[];
          }) => (
            <GroupItem
              key={group.id}
              allMemberIds={group.allMemberIds}
              groupName={group.channelName}
              description={group.description || 'No description'}
              isOwner={group.creatorId === userId}
              isMember={group.allMemberIds.includes(userId)}
            />
          )
        )}
      </div>
    </ErrorBoundary>
  );
}
