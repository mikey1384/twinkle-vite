import React, { useEffect, useState } from 'react';
import GroupItem from './GroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
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
      <div>
        {groups.map((group: { id: number }) => (
          <GroupItem key={group.id} />
        ))}
      </div>
    </ErrorBoundary>
  );
}
