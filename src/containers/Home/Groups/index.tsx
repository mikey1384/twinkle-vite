import React from 'react';
import GroupItem from './GroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Groups() {
  return (
    <ErrorBoundary componentPath="Home/Groups">
      <div>
        <GroupItem />
      </div>
    </ErrorBoundary>
  );
}
