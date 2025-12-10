import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import ColorSelector from '~/components/ColorSelector';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { exceedsCharLimit } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';

export default function StatusInput({
  autoFocus,
  profile,
  editedStatusMsg,
  innerRef,
  onCancel,
  statusColor,
  onStatusSubmit,
  onTextChange,
  setColor
}: {
  autoFocus?: boolean;
  profile: any;
  editedStatusMsg: string;
  innerRef: React.RefObject<any>;
  onCancel: () => void;
  statusColor: string;
  onStatusSubmit: () => void;
  onTextChange: (text: string) => void;
  setColor: (color: string) => void;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColorKey = doneRole.colorKey || 'blue';
  const statusExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'statusMsg',
        text: editedStatusMsg
      }),
    [editedStatusMsg]
  );
  const statusMsgPlaceholder = useMemo(() => {
    return `Enter a ${profile.statusMsg ? 'new ' : ''}status message...`;
  }, [profile.statusMsg]);

  return (
    <ErrorBoundary componentPath="UserDetails/StatusInput">
      <div
        className={css`
          position: relative;
          width: 100%;
          margin-top: 1rem;
          background: #fff;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          overflow: hidden;
          transition: border-color 0.18s ease;
          &:focus-within {
            border-color: var(--ui-border-strong);
          }
        `}
      >
        <Icon
          icon="comment-alt"
          className={css`
            position: absolute;
            top: 0.9rem;
            left: 1rem;
            color: ${Color.gray()};
          `}
        />
        <Textarea
          autoFocus={autoFocus}
          hasError={!!statusExceedsCharLimit}
          innerRef={innerRef}
          minRows={1}
          value={editedStatusMsg}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={statusMsgPlaceholder}
          disableFocusGlow
          style={{
            paddingLeft: '3.2rem',
            border: 'none',
            boxShadow: 'none',
            background: 'transparent'
          }}
        />
      </div>
      <p
        style={{
          fontSize: '1.3rem',
          marginTop: '0.5rem',
          ...(statusExceedsCharLimit?.style || {})
        }}
      >
        {statusExceedsCharLimit?.message}
      </p>
      {editedStatusMsg && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginTop: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ColorSelector
              colors={[
                'purple',
                'pink',
                'rose',
                'red',
                'orange',
                'ivory',
                'green',
                'logoBlue',
                'darkBlue',
                'darkGray',
                'black',
                'vantaBlack'
              ]}
              twinkleXP={profile.twinkleXP || 0}
              setColor={setColor}
              selectedColor={statusColor}
            />
          </div>
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button
              variant="solid"
              tone="raised"
              color="darkerGray"
              onClick={onCancel}
              style={{ fontSize: '1rem' }}
            >
              Cancel
            </Button>
            <Button
              color={doneColorKey}
              variant="solid"
              tone="raised"
              disabled={
                !!exceedsCharLimit({
                  contentType: 'statusMsg',
                  text: editedStatusMsg
                })
              }
              style={{ marginLeft: '1rem', fontSize: '1rem' }}
              onClick={onStatusSubmit}
            >
              Enter
            </Button>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
