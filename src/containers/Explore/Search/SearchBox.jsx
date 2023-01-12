import { useMemo } from 'react';
import PropTypes from 'prop-types';
import SearchInput from '~/components/Texts/SearchInput';
import { useExploreContext, useKeyContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

SearchBox.propTypes = {
  category: PropTypes.string,
  className: PropTypes.string,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  style: PropTypes.object
};

export default function SearchBox({ category, className, innerRef, style }) {
  const {
    search: { color: searchColor }
  } = useKeyContext((v) => v.theme);
  const searchText = useExploreContext((v) => v.state.search.searchText);
  const onChangeSearchInput = useExploreContext(
    (v) => v.actions.onChangeSearchInput
  );
  const placeholderLabel = useMemo(() => {
    const displayedCategory = category === 'ai-cards' ? 'AI Cards' : category;
    return SELECTED_LANGUAGE === 'kr'
      ? `${localize(displayedCategory.slice(0, -1))}${
          displayedCategory === 'videos' ? '을' : '를'
        } 검색하세요...`
      : `Search ${displayedCategory}...`;
  }, [category]);

  return category === 'ai-cards' ? null : (
    <SearchInput
      className={className}
      style={style}
      addonColor={searchColor}
      borderColor={searchColor}
      innerRef={innerRef}
      placeholder={placeholderLabel}
      onChange={onChangeSearchInput}
      value={searchText}
    />
  );
}
