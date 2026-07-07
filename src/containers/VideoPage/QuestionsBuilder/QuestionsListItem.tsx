import React from 'react';
import Icon from '~/components/Icon';
import { useDragSort } from '~/helpers/hooks';
import { Color } from '~/constants/css';
const untitledQuestionLabel = 'Untitled Question';

export default function QuestionsListItem({
  item: listItem,
  onMove,
  questionId
}: {
  item: { title: string; deleted: boolean };
  onMove: (arg0: any) => any;
  questionId: number;
}) {
  const { isDragging, dragProps } = useDragSort({
    group: 'questionList',
    id: questionId,
    onMove
  });

  return (
    <nav
      {...dragProps}
      style={{
        background: '#fff',
        opacity: isDragging ? 0 : 1,
        color:
          !listItem.title || listItem.deleted ? Color.lighterGray() : undefined,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'ns-resize',
        touchAction: 'none'
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
