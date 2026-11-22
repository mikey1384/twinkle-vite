import React from 'react';
import { Color } from '~/constants/css';
import { User } from '~/types';
import useUserPopupTrigger from '~/components/UserPopup/useUserPopupTrigger';
const deletedLabel = 'Deleted';

export default function UsernameText({
  className,
  color,
  onMenuShownChange,
  style = {},
  textStyle = {},
  user = {
    id: 0,
    username: '',
    profilePicUrl: '',
    profileTheme: '',
    profileFirstRow: '',
    rank: 0,
    twinkleXP: 0,
    xpThisMonth: 0
  },
  wordBreakEnabled,
  displayedName,
  wordMasterContext,
  wordMasterPoints,
  wordMasterLabel,
  activityContext,
  activityPoints
}: {
  className?: string;
  color?: string;
  onMenuShownChange?: (v: boolean) => void;
  style?: object;
  textStyle?: React.CSSProperties;
  user?: User;
  wordBreakEnabled?: boolean;
  displayedName?: string;
  wordMasterContext?: boolean;
  wordMasterPoints?: number;
  wordMasterLabel?: string;
  activityContext?: string;
  activityPoints?: number;
}) {
  const {
    triggerRef: UsernameTextRef,
    shown,
    popup,
    onMouseEnter,
    onMouseLeave,
    onClick
  } = useUserPopupTrigger<HTMLDivElement>({
    user,
    onShownChange: onMenuShownChange,
    popupProps: {
      wordMasterContext,
      wordMasterPoints,
      wordMasterLabel,
      activityContext,
      activityPoints
    }
  });

  return (
    <div
      ref={UsernameTextRef}
      data-feed-card-interactive="true"
      style={{
        display: 'inline',
        ...(shown ? {} : { overflow: 'hidden', textOverflow: 'ellipsis' }),
        position: 'relative',
        ...style
      }}
      className={className}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          width: '100%',
          display: 'inline'
        }}
      >
        <div
          style={{
            display: 'inline',
            cursor: 'pointer',
            fontWeight: 'bold',
            touchAction: 'manipulation',
            ...(wordBreakEnabled
              ? { overflowWrap: 'break-word', wordBreak: 'break-word' }
              : {}),
            color: user.username
              ? color || Color.darkerGray()
              : Color.lighterGray(),
            ...textStyle
          }}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
        >
          {displayedName || user.username || `(${deletedLabel})`}
        </div>
      </div>
      {popup}
    </div>
  );
}
