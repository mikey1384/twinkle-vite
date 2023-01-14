import { useMemo } from 'react';
import PropTypes from 'prop-types';
import DropdownButton from '~/components/Buttons/DropdownButton';

ColorFilter.propTypes = {
  selectedColor: PropTypes.string,
  onDropdownShown: PropTypes.func,
  onSelectColor: PropTypes.func
};

export default function ColorFilter({
  selectedColor,
  onDropdownShown,
  onSelectColor
}) {
  const menuProps = useMemo(() => {
    const colors = ['blue', 'pink', 'orange', 'gold'];
    const rearrangedColor = colors.filter((color) => color !== selectedColor);
    return rearrangedColor.map((color) => ({
      label: color,
      onClick: () => onSelectColor(color)
    }));
  }, [onSelectColor, selectedColor]);

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
        <b>Color:</b>
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <DropdownButton
          skeuomorphic
          color="darkerGray"
          icon="caret-down"
          text={selectedColor}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
        />
      </div>
    </div>
  );
}
