import React, { useMemo } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import { useExploreContext } from '~/contexts';

const categoryLabels: Record<string, string> = {
  'ai-cards': 'AI Cards',
  subjects: 'Subjects',
  videos: 'Videos',
  links: 'Links'
};

export default function SearchBox({
  category,
  innerRef,
  style
}: {
  category: string;
  innerRef: React.RefObject<any>;
  style: React.CSSProperties;
}) {
  const searchText = useExploreContext((v) => v.state.search.searchText);
  const onChangeSearchInput = useExploreContext(
    (v) => v.actions.onChangeSearchInput
  );
  const placeholderLabel = useMemo(() => {
    const displayedCategory = categoryLabels[category] || category || 'items';
    return `Search ${displayedCategory}...`;
  }, [category]);

  return category === 'ai-cards' ? null : (
    <SearchInput
      style={style}
      innerRef={innerRef}
      placeholder={placeholderLabel}
      onChange={onChangeSearchInput}
      value={searchText}
    />
  );
}
