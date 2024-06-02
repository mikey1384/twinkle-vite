import React, { useEffect, useState } from 'react';
import GroupItem from './GroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts/';

export default function Groups() {
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
            channelName: string;
            allMemberIds: number[];
          }) => (
            <GroupItem
              key={group.id}
              allMemberIds={group.allMemberIds}
              groupName={group.channelName}
            />
          )
        )}
      </div>
    </ErrorBoundary>
  );
}
