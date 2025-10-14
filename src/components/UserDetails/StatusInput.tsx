import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import ColorSelector from '~/components/ColorSelector';
import ErrorBoundary from '~/components/ErrorBoundary';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { exceedsCharLimit } from '~/helpers/stringHelpers';

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
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const statusExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'statusMsg',
        text: editedStatusMsg
      }),
    [editedStatusMsg]
  );
  const statusMsgPlaceholder = useMemo(() => {
    return SELECTED_LANGUAGE === 'kr'
      ? '상태 메시지를 입력하세요...'
      : `Enter a ${profile.statusMsg ? 'new ' : ''}status message...`;
  }, [profile.statusMsg]);

  return (
    <ErrorBoundary componentPath="UserDetails/StatusInput">
      <Textarea
        autoFocus={autoFocus}
        className={css`
          margin-top: 1rem;
          ${profile.statusMsg
            ? ''
            : `box-shadow: ${`0 0 1rem ${Color.logoBlue()}`}; border: 1px solid ${Color.logoBlue()}`};
        `}
        hasError={!!statusExceedsCharLimit}
        innerRef={innerRef}
        minRows={1}
        value={editedStatusMsg}
        onChange={onTextChange}
        placeholder={statusMsgPlaceholder}
      />
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
              variant="soft"
              tone="raised"
              color="darkerGray"
              onClick={onCancel}
              style={{ fontSize: '1rem' }}
            >
              Cancel
            </Button>
            <Button
              color={doneColor}
              filled
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
