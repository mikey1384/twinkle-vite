import React, { useMemo, useState } from 'react';
import TitleSelectionModal from './TitleSelectionModal';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function UserTitle({
  user = {
    id: 0,
    userType: '',
    title: '',
    authLevel: 0,
    level: 0
  },
  className,
  style
}: {
  user: {
    id: number;
    authLevel?: number;
    level?: number;
    userType?: string;
    title?: string;
  };
  style?: React.CSSProperties;
  className?: string;
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const [titleSelectionModalShown, setTitleSelectionModalShown] =
    useState(false);
  const appliedUserLevel = useMemo(() => {
    if (user.authLevel) return user.authLevel + 1;
    return user.level || 0;
  }, [user.authLevel, user.level]);
  const userTitle = useMemo(() => {
    if (user.title) return user.title;
    if (user.userType) {
      return user.userType.includes('teacher') ? 'teacher' : user.userType;
    }
    return '';
  }, [user.title, user.userType]);

  const appliedUserTitle = useMemo(() => {
    if (userTitle) {
      return `${userTitle} (lv ${appliedUserLevel})`;
    }
    return appliedUserLevel > 1 ? `level ${appliedUserLevel}` : '';
  }, [userTitle, appliedUserLevel]);

  return userTitle ? (
    <div className={className} style={style}>
      <span
        onClick={
          user.id === myId ? () => setTitleSelectionModalShown(true) : undefined
        }
        className={css`
          cursor: ${user.id === myId ? 'pointer' : 'default'};
          &:hover {
            text-decoration: ${user.id === myId ? 'underline' : 'none'};
          }
        `}
      >
        {appliedUserTitle}
      </span>
      {titleSelectionModalShown && (
        <TitleSelectionModal
          currentTitle={userTitle}
          onHide={() => setTitleSelectionModalShown(false)}
        />
      )}
    </div>
  ) : null;
}
