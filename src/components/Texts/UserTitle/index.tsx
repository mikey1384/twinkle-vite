import React, { useMemo, useState } from 'react';
import TitleSelectionModal from './TitleSelectionModal';
import { useKeyContext } from '~/contexts';
import { useUserLevel } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { User } from '~/types';

export default function UserTitle({
  user = {
    id: 0,
    userType: '',
    title: '',
    authLevel: 0,
    username: ''
  },
  onTitleModalShown,
  className,
  style
}: {
  user: User;
  onTitleModalShown?: (shown: boolean) => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const { level } = useUserLevel(user);
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
        onClick={handleTitleSelectionModalShown}
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
          onHide={() => {
            onTitleModalShown?.(false);
            setTitleSelectionModalShown(false);
          }}
        />
      )}
    </div>
  ) : null;

  function handleTitleSelectionModalShown() {
    if (user.id === myId) {
      setTitleSelectionModalShown(true);
      onTitleModalShown?.(true);
    }
  }
}
