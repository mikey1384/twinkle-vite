import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import zero from '~/assets/zero.png';
import Icon from '~/components/Icon';
import { ZERO_TWINKLE_ID, ZERO_PFP_URL } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';

export default function ZeroButton({ style }: { style?: React.CSSProperties }) {
  const navigate = useNavigate();
  const username = useKeyContext((v) => v.myState.username);
  const userId = useKeyContext((v) => v.myState.userId);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const [chatLoading, setChatLoading] = useState(false);

  return (
    <ErrorBoundary componentPath="TopMenu/InputPanel/ZeroButton">
      <div
        style={{
          position: 'relative',
          cursor: 'pointer',
          marginLeft: '0.5rem'
        }}
      >
        <Button
          style={{
            opacity: chatLoading ? 0.5 : 1,
            background: `no-repeat center/80% url(${zero})`,
            ...(chatLoading
              ? { boxShadow: 'none', border: `1px solid ${Color.black()}` }
              : {}),
            ...style
          }}
          skeuomorphic
          onClick={handleClick}
        >
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </Button>
        {chatLoading && (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Icon style={{ color: Color.darkGray() }} icon="spinner" pulse />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleClick() {
    setChatLoading(true);
    const { channelId, pathId } = await loadDMChannel({
      recipient: { id: ZERO_TWINKLE_ID }
    });
    if (!pathId) {
      onOpenNewChatTab({
        user: {
          username,
          id: userId,
          profilePicUrl
        },
        recipient: {
          username: 'Zero',
          id: ZERO_TWINKLE_ID,
          profilePicUrl: ZERO_PFP_URL
        }
      });
    }
    onUpdateSelectedChannelId(channelId);
    setTimeout(() => navigate(pathId ? `/chat/${pathId}` : `/chat/new`), 0);
    setChatLoading(false);
  }
}
