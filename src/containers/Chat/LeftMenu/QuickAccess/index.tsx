import React, { useState } from 'react';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import QuickAccessPortrait from './Portrait';
import QuickAccessSettingsModal from './SettingsModal';
import useChatQuickAccessRefresh from '~/helpers/hooks/useChatQuickAccessRefresh';
import type { ChatQuickAccessMode, ChatQuickAccessPartner } from './types';

export default function ChatQuickAccess() {
  const banned = useKeyContext((v) => v.myState.banned);
  const username = useKeyContext((v) => v.myState.username);
  const userId = useKeyContext((v) => v.myState.userId);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const partners = useChatContext(
    (v) => v.state.quickAccess?.partners || EMPTY_PARTNERS
  ) as ChatQuickAccessPartner[];
  const mode = useChatContext(
    (v) => v.state.quickAccess?.mode || 'automatic'
  ) as ChatQuickAccessMode;
  const selectedChannelId = useChatContext((v) => v.state.selectedChannelId);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const refreshChatQuickAccess = useChatQuickAccessRefresh();
  const [loadingPartnerId, setLoadingPartnerId] = useState<number | null>(null);
  const [settingsShown, setSettingsShown] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.55rem;
          width: 100%;
          margin-top: 1rem;
          @container chat-channels (max-width: 180px) {
            flex-wrap: wrap;
            gap: 0.2rem;
          }
        `}
      >
        <div
          aria-label="Chat quick access"
          className={css`
            min-width: 0;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: safe center;
            gap: 0.7rem;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.3rem 0.15rem 0.45rem;
            touch-action: pan-x;
            scrollbar-width: thin;
            overscroll-behavior-x: contain;
            @container chat-channels (max-width: 180px) {
              flex-basis: 100%;
            }
            @media (pointer: coarse) {
              > button { width: 44px; height: 44px; }
            }
          `}
        >
          {partners.map((partner) => (
            <QuickAccessPortrait
              key={partner.id}
              partner={partner}
              loading={loadingPartnerId === partner.id}
              disabled={partner.isAi && !!banned?.aiChat}
              selected={
                !!partner.channelId &&
                Number(partner.channelId) === Number(selectedChannelId)
              }
              onClick={handlePartnerClick}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Customize chat quick access"
          title="Customize quick access"
          onClick={() => setSettingsShown(true)}
          className={css`
            width: 2.6rem;
            height: 2.6rem;
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 1px solid var(--ui-border);
            border-radius: 50%;
            background: #fff;
            color: ${Color.darkGray()};
            cursor: pointer;

            &:hover {
              color: ${Color.logoBlue()};
              border-color: ${Color.logoBlue(0.5)};
            }
            > span { display: none; }
            @container chat-channels (max-width: 180px) {
              width: 100%;
              min-height: 28px;
              height: auto;
              gap: 0.5rem;
              border: 0;
              border-radius: 5px;
              background: transparent;
              font-size: 12px;
              > span { display: inline; }
            }
            @media (pointer: coarse) {
              min-width: 44px;
              min-height: 44px;
            }
          `}
        >
          <Icon icon="cog" />
          <span>Shortcuts</span>
        </button>
      </div>
      {settingsShown ? (
        <QuickAccessSettingsModal
          mode={mode}
          initialPartners={partners}
          onHide={() => setSettingsShown(false)}
        />
      ) : null}
    </>
  );

  async function handlePartnerClick(partner: ChatQuickAccessPartner) {
    if (loadingPartnerId !== null) return;
    if (partner.pathId && partner.channelId) {
      onUpdateSelectedChannelId(partner.channelId);
      navigate(`/chat/${partner.pathId}`);
      return;
    }

    setLoadingPartnerId(partner.id);
    try {
      const { channelId, pathId } = await loadDMChannel({
        recipient: { id: partner.id }
      });
      if (pathId) {
        void refreshChatQuickAccess();
        onUpdateSelectedChannelId(channelId);
        navigate(`/chat/${pathId}`);
        return;
      }
      onOpenNewChatTab({
        user: { username, id: userId, profilePicUrl },
        recipient: {
          username: partner.username,
          id: partner.id,
          profilePicUrl: partner.profilePicUrl || undefined
        }
      });
      setTimeout(() => navigate('/chat/new'), 0);
    } catch (error) {
      console.error('Failed to open quick-access chat:', error);
    } finally {
      setLoadingPartnerId(null);
    }
  }
}

const EMPTY_PARTNERS: ChatQuickAccessPartner[] = [];
