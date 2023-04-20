import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import SortableListItem from './SortableListItem';
import { borderRadius, Color } from '~/constants/css';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';

SortableListGroup.propTypes = {
  listItemObj: PropTypes.object.isRequired,
  listItemLabel: PropTypes.string,
  onMove: PropTypes.func.isRequired,
  itemIds: PropTypes.array.isRequired,
  numbered: PropTypes.bool,
  style: PropTypes.object
};

const Backend = isMobile(navigator) ? TouchBackend : HTML5Backend;

export default function SortableListGroup({
  listItemObj,
  listItemLabel = 'label',
  onMove,
  itemIds,
  numbered,
  style
}) {
  return (
    <DndProvider backend={Backend}>
      <div
        style={style}
        className={css`
          width: 100%;
          cursor: ns-resize;
          display: flex;
          flex-direction: column;
          nav {
            align-items: center;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            margin-bottom: -1px;
            border: 1px solid ${Color.borderGray()};
          }
          nav:first-of-type {
            border-top-left-radius: ${borderRadius};
            border-top-right-radius: ${borderRadius};
          }
          nav:last-child {
            border-bottom-left-radius: ${borderRadius};
            border-bottom-right-radius: ${borderRadius};
          }
        `}
      >
        {itemIds.map((id, index) => {
          return (
            <SortableListItem
              numbered={numbered}
              key={id}
              index={index}
              listItemId={id}
              listItemLabel={listItemObj[id]?.[listItemLabel]}
              onMove={onMove}
            />
          );
        })}
      </div>
    </DndProvider>
  );
}
