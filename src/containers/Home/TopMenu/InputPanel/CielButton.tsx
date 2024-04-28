import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import ciel from '~/assets/ciel.png';
import Icon from '~/components/Icon';
import { CIEL_TWINKLE_ID, CIEL_PFP_URL } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';

export default function CielButton({ style }: { style?: React.CSSProperties }) {
  const navigate = useNavigate();
  const { username, userId, profilePicUrl } = useKeyContext((v) => v.myState);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const [chatLoading, setChatLoading] = useState(false);

  return (
    <ErrorBoundary componentPath="TopMenu/InputPanel/CielButton">
      <div style={{ position: 'relative', cursor: 'pointer' }}>
        <Button
          style={{
            opacity: chatLoading ? 0.5 : 1,
            background: `no-repeat center/80% url(${ciel})`,
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
              top: 'CALC(50% - 11px)',
              left: 'CALC(50% - 8px)'
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
      recipient: { id: CIEL_TWINKLE_ID }
    });
    if (!pathId) {
      onOpenNewChatTab({
        user: {
          username,
          id: userId,
          profilePicUrl
        },
        recipient: {
          username: 'Ciel',
          id: CIEL_TWINKLE_ID,
          profilePicUrl: CIEL_PFP_URL
        }
      });
    }
    onUpdateSelectedChannelId(channelId);
    setTimeout(() => navigate(pathId ? `/chat/${pathId}` : `/chat/new`), 0);
    setChatLoading(false);
  }
}
