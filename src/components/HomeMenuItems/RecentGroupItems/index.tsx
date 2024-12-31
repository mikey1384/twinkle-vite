import React, { useEffect } from 'react';
import RecentGroupItem from './RecentGroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useAppContext, useHomeContext } from '~/contexts';

export default function RecentGroupItems() {
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const onSetGroupsPreview = useHomeContext(
    (v) => v.actions.onSetGroupsPreview
  );
  const previewGroups = useHomeContext((v) => v.state.previewGroups);

  useEffect(() => {
    init();
    async function init() {
      try {
        const { results } = await loadPublicGroups({
          limit: 2
        });
        onSetGroupsPreview(results);
      } catch (error) {
        console.error(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (previewGroups.length === 0) {
    return null;
  }

  return (
    <ErrorBoundary componentPath="Home/RecentGroupItems">
      <div
        className={css`
          margin-bottom: 0.5rem;
        `}
      >
        {previewGroups.map((group: any) => (
          <RecentGroupItem
            key={group.id}
            groupName={group.channelName}
            thumbPath={group.thumbPath}
          />
        ))}
      </div>
    </ErrorBoundary>
  );
}
