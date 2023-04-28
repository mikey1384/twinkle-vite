import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { useDrag, useDrop } from 'react-dnd';
import ItemTypes from '~/constants/itemTypes';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';

const untitledQuestionLabel = localize('untitledQuestion');

QuestionsListItem.propTypes = {
  item: PropTypes.object,
  onMove: PropTypes.func.isRequired,
  questionId: PropTypes.number
};

export default function QuestionsListItem({
  item: listItem,
  onMove,
  questionId
}: {
  item: { title: string; deleted: boolean };
  onMove: (arg0: any) => any;
  questionId: number;
}) {
  const Draggable = useRef(null);
  const [{ opacity }, drag] = useDrag({
    type: ItemTypes.LIST_ITEM,
    item: { questionId: questionId },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0 : 1
    })
  });
  const [, drop] = useDrop({
    accept: ItemTypes.LIST_ITEM,
    hover(item: any) {
      if (!Draggable.current) {
        return;
      }
      if (item.questionId === questionId) {
        return;
      }
      onMove({ sourceId: item.questionId, targetId: questionId });
    }
  });
  const NavRef: any = drag(drop(Draggable));

  return (
    <nav
      ref={NavRef}
      style={{
        background: '#fff',
        opacity,
        color:
          !listItem.title || listItem.deleted ? Color.lighterGray() : undefined,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'ns-resize'
      }}
    >
      <div>
        {listItem.title
          ? `${listItem.title} ${listItem.deleted ? '(removed)' : ''}`
          : `${untitledQuestionLabel} ${questionId + 1} ${
              listItem.deleted ? '(removed)' : ''
            }`}
      </div>
      <div>
        <Icon icon="align-justify" style={{ color: Color.gray() }} />
      </div>
    </nav>
  );
}
