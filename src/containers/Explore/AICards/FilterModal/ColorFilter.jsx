import { useMemo } from 'react';
import PropTypes from 'prop-types';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { capitalize } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';

ColorFilter.propTypes = {
  selectedColor: PropTypes.string,
  onDropdownShown: PropTypes.func,
  onSelectColor: PropTypes.func,
  selectedFilter: PropTypes.string,
  style: PropTypes.object
};

export default function ColorFilter({
  selectedColor,
  onDropdownShown,
  onSelectColor,
  selectedFilter,
  style
}) {
  const menuProps = useMemo(() => {
    const colors = ['any', 'blue', 'pink', 'orange', 'magenta', 'gold'];
    const rearrangedColors = colors.filter((color) => color !== selectedColor);
    return rearrangedColors.map((color) => ({
      label: (
        <b
          style={{
            color:
              Color[
                color === 'any'
                  ? 'darkerGray'
                  : color === 'blue'
                  ? 'logoBlue'
                  : color
              ]()
          }}
        >
          {capitalize(color)}
        </b>
      ),
      onClick: () => onSelectColor(color)
    }));
  }, [onSelectColor, selectedColor]);

  return (
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div>
        <b>Color:</b>
      </div>
      <div style={{ marginLeft: '1rem' }}>
        <DropdownButton
          isMenuShownWhenMounted={selectedFilter === 'color'}
          skeuomorphic
          color={
            selectedColor === 'any'
              ? 'darkerGray'
              : selectedColor === 'blue'
              ? 'logoBlue'
              : selectedColor
          }
          icon="caret-down"
          text={selectedColor}
          onDropdownShown={onDropdownShown}
          menuProps={menuProps}
        />
      </div>
    </div>
  );
}
