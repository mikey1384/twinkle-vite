import React from 'react';
import SharedFilterPanel from '~/components/Modals/SelectAICardModal/FilterPanel';

export default function FilterPanel({
  filters,
  onDropdownShown,
  onSetFilters
}: {
  filters: any;
  onDropdownShown: (isShown: boolean) => void;
  onSetFilters: (filters: any) => void;
}) {
  return (
    <SharedFilterPanel
      filters={filters}
      onDropdownShown={(isShown) => onDropdownShown(Boolean(isShown))}
      onSetFilters={onSetFilters}
      variant="explore"
    />
  );
}
