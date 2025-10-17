import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

export default function MessagesButton({
  commentsShown,
  loading,
  profileId,
  myId,
  onMessagesButtonClick,
  numMessages,
  style = {},
  variant = 'button',
  className,
  iconColor,
  textColor,
  buttonColor,
  buttonVariant,
  buttonTone
}: {
  commentsShown: boolean;
  loading: boolean;
  profileId: number;
  myId: number;
  onMessagesButtonClick: () => void;
  numMessages: number;
  style?: React.CSSProperties;
  variant?: 'button' | 'action';
  className?: string;
  iconColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonVariant?: 'solid' | 'soft' | 'outline' | 'ghost';
  buttonTone?: 'flat' | 'raised';
}) {
  const leaveMessageLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          메시지
          {profileId === myId ? '' : ' 남기기'}
        </>
      );
    }
    return (
      <>
        {profileId === myId ? '' : 'Leave '}
        Message
      </>
    );
  }, [profileId, myId]);

  const disabled = loading || (commentsShown && profileId === myId);
  const iconTint = iconColor || undefined;
  const actionLabelStyle = {
    marginLeft: '0.6rem',
    ...(textColor ? { color: textColor } : {})
  } as React.CSSProperties;
  const buttonLabelStyle = {
    marginLeft: '0.6rem',
    ...(textColor ? { color: textColor } : {})
  } as React.CSSProperties;

  if (variant === 'action') {
    return (
      <button
        type="button"
        className={className}
        style={style}
        onClick={() => {
          if (!disabled) {
            onMessagesButtonClick();
          }
        }}
        disabled={disabled}
      >
        {loading ? (
          <Icon icon="spinner" pulse color={iconTint} />
        ) : (
          <Icon icon="comment-alt" color={iconTint} />
        )}
        <span style={actionLabelStyle}>
          {leaveMessageLabel}
          {profileId === myId && Number(numMessages) > 0 && !commentsShown
            ? `${numMessages > 1 ? 's' : ''}`
            : ''}
          {Number(numMessages) > 0 && !commentsShown ? ` (${numMessages})` : ''}
        </span>
      </button>
    );
  }

  return (
    <Button
      loading={loading}
      style={style}
      disabled={commentsShown && profileId === myId}
      color={buttonColor || 'logoBlue'}
      variant={buttonVariant}
      tone={buttonTone}
      uppercase={false}
      onClick={onMessagesButtonClick}
      className={className}
    >
      <Icon icon="comment-alt" color={iconTint} />
      <span style={buttonLabelStyle}>
        {leaveMessageLabel}
        {profileId === myId && Number(numMessages) > 0 && !commentsShown
          ? `${numMessages > 1 ? 's' : ''}`
          : ''}
        {Number(numMessages) > 0 && !commentsShown ? ` (${numMessages})` : ''}
      </span>
    </Button>
  );
}
