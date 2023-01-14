import { useMemo } from 'react';
import PropTypes from 'prop-types';
import DropdownButton from '~/components/Buttons/DropdownButton';

QualityFilter.propTypes = {
  selectedQuality: PropTypes.string,
  onDropdownShown: PropTypes.func,
  onSelectQuality: PropTypes.func
};

export default function QualityFilter({
  selectedQuality,
  onDropdownShown,
  onSelectQuality
}) {
  const menuProps = useMemo(() => {
    const colors = ['any', 'common', 'superior', 'rare', 'elite', 'legendary'];
    const rearrangedColor = colors.filter(
      (quality) => quality !== selectedQuality
    );
    return rearrangedColor.map((quality) => ({
      label: quality,
      onClick: () => onSelectQuality(quality)
    }));
  }, [onSelectQuality, selectedQuality]);

  return (
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div>
        <b>Quality:</b>
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <DropdownButton
          skeuomorphic
          color="darkerGray"
          icon="caret-down"
          text={selectedQuality}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
        />
      </div>
    </div>
  );
}
