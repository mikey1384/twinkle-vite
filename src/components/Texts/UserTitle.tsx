import React, { useMemo } from 'react';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function UserTitle({
  userId,
  userType,
  level,
  className,
  style
}: {
  style?: React.CSSProperties;
  userId: number;
  userType: string;
  className?: string;
  level: number;
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const displayedUserTitle = useMemo(() => {
    if (userType) {
      return userType.includes('teacher')
        ? `teacher (lv${level})`
        : `${userType} (lv${level})`;
    }
    return level > 1 ? `level ${level}` : '';
  }, [level, userType]);

  return displayedUserTitle ? (
    <div className={className} style={style}>
      <span
        className={css`
          cursor: ${userId === myId ? 'pointer' : 'default'};
          &:hover {
            text-decoration: ${userId === myId ? 'underline' : 'none'};
          }
        `}
      >
        {displayedUserTitle}
      </span>
    </div>
  ) : null;
}
