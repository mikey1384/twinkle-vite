import React, { useMemo, useState } from 'react';
import TitleSelectionModal from './TitleSelectionModal';
import { useKeyContext } from '~/contexts';
import { useUserLevel } from '~/helpers/hooks';
import { css } from '@emotion/css';

export default function UserTitle({
  user = {
    id: 0,
    userType: '',
    title: '',
    authLevel: 0
  },
  className,
  style
}: {
  user: {
    id: number;
    authLevel?: number;
    userType?: string;
    title?: string;
  };
  style?: React.CSSProperties;
  className?: string;
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const { level } = useUserLevel(user.id);
  const [titleSelectionModalShown, setTitleSelectionModalShown] =
    useState(false);
  const appliedUserLevel = useMemo(() => {
    return level > 1 ? level : user.authLevel ? user.authLevel + 1 : 1;
  }, [level, user.authLevel]);
  const userTitle = useMemo(() => {
    if (user.title) return user.title;
    if (user.userType) {
      return user.userType.includes('teacher') ? 'teacher' : user.userType;
    }
    return '';
  }, [user.title, user.userType]);

  const appliedUserTitle = useMemo(() => {
    if ((user.authLevel || 0) + 1 > level || appliedUserLevel <= 1) {
      return userTitle;
    }
    if (userTitle) {
      return `${userTitle} (lv ${appliedUserLevel})`;
    }
    return appliedUserLevel > 1 ? `lv ${appliedUserLevel} user` : '';
  }, [appliedUserLevel, level, user.authLevel, userTitle]);

  return appliedUserTitle ? (
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
          userLevel={appliedUserLevel}
          onHide={() => setTitleSelectionModalShown(false)}
        />
      )}
    </div>
  ) : null;
}
