import React, { useMemo, useState } from 'react';
import TitleSelectionModal from './TitleSelectionModal';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function UserTitle({
  userId,
  userType,
  level,
  className,
  title,
  style
}: {
  style?: React.CSSProperties;
  userId: number;
  userType: string;
  className?: string;
  title?: string;
  level: number;
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const [titleSelectionModalShown, setTitleSelectionModalShown] =
    useState(false);
  const displayedUserTitle = useMemo(() => {
    if (title) return title;
    if (userType) {
      return userType.includes('teacher') ? 'teacher' : userType;
    }
    return level > 1 ? `level ${level}` : '';
  }, [level, title, userType]);

  return displayedUserTitle ? (
    <div className={className} style={style}>
      <span
        onClick={
          userId === myId ? () => setTitleSelectionModalShown(true) : undefined
        }
        className={css`
          cursor: ${userId === myId ? 'pointer' : 'default'};
          &:hover {
            text-decoration: ${userId === myId ? 'underline' : 'none'};
          }
        `}
      >
        {displayedUserTitle}
      </span>
      {titleSelectionModalShown && (
        <TitleSelectionModal
          currentTitle={displayedUserTitle}
          onHide={() => setTitleSelectionModalShown(false)}
        />
      )}
    </div>
  ) : null;
}
