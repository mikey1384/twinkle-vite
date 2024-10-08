import React, { useContext, useMemo } from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import ProfilePic from '~/components/ProfilePic';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';
import LocalContext from '../../../Context';
import localize from '~/constants/localize';

const callingLabel = localize('calling');

export default function CallScreen({ style }: { style?: React.CSSProperties }) {
  const {
    state: { channelOnCall, chatStatus },
    actions: { onShowIncoming }
  } = useContext(LocalContext);

  const calling = useMemo(() => {
    return !channelOnCall.callReceived && channelOnCall.imCalling;
  }, [channelOnCall.callReceived, channelOnCall.imCalling]);

  const answerButtonShown = useMemo(
    () => !channelOnCall.imCalling && !channelOnCall.incomingShown,
    [channelOnCall.imCalling, channelOnCall.incomingShown]
  );

  const peers = useMemo(() => {
    return Object.keys(channelOnCall.members)?.map((memberId) => {
      return Number(memberId);
    });
  }, [channelOnCall.members]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 5,
        ...style
      }}
    >
      {peers.length > 0 && (
        <div
          style={{
            display: 'flex',
            height: 'CALC(70% - 1rem)',
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}
        >
          {peers.map((peerId, index) => {
            return (
              <div
                key={peerId}
                style={{ marginLeft: index === 0 ? 0 : '1.5rem' }}
              >
                <ProfilePic
                  className={css`
                    width: 10rem;
                  `}
                  userId={peerId}
                  profilePicUrl={chatStatus[peerId]?.profilePicUrl}
                />
              </div>
            );
          })}
        </div>
      )}
      {answerButtonShown && (
        <div
          style={{
            width: '100%',
            height: 'CALC(30% + 1rem)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Button filled color="green" onClick={handleShowIncoming}>
            <Icon icon="phone-volume" />
            <span style={{ marginLeft: '1rem' }}>Answer</span>
          </Button>
        </div>
      )}
      {calling && (
        <div
          style={{
            height: 'CALC(30% + 1rem)',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {callingLabel}...
        </div>
      )}
    </div>
  );

  function handleShowIncoming() {
    socket.emit('confirm_call_reception', channelOnCall.id);
    onShowIncoming();
  }
}
