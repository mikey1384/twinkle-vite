import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ChannelDetail from './ChannelDetail';
import Button from '~/components/Button';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { parseChannelPath } from '~/helpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
const alreadyJoinedLabel = 'Already Joined';

export default function Invitation({
  invitationChannelId,
  invitePath,
  channelId: currentChannelId,
  messageId,
  onAcceptGroupInvitation,
  sender
}: {
  invitationChannelId: number;
  invitePath: string;
  channelId: number;
  messageId: number;
  onAcceptGroupInvitation: (channelId: string) => void | Promise<void>;
  sender: {
    id: number;
    username: string;
    profilePicUrl?: string;
  };
}) {
  const [accepting, setAccepting] = useState(false);
  // The server's reason when it refuses the card (for example, its sender
  // has left the group); the button is usable again.
  const [acceptError, setAcceptError] = useState('');
  const userId = useKeyContext((v) => v.myState.userId);
  const chatInvitationColor = useKeyContext(
    (v) => v.theme.chatInvitation.color
  );
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const channelPathIdHash = useChatContext((v) => v.state.channelPathIdHash);
  const channelsObj = useChatContext((v) => v.state.channelsObj);
  const onSetChatInvitationDetail = useChatContext(
    (v) => v.actions.onSetChatInvitationDetail
  );
  const onUpdateChannelPathIdHash = useChatContext(
    (v) => v.actions.onUpdateChannelPathIdHash
  );

  useEffect(() => {
    if (!invitationChannelId) {
      init();
    }
    async function init() {
      const channelId =
        channelPathIdHash[invitePath] || parseChannelPath(invitePath);
      if (!channelPathIdHash[invitePath]) {
        onUpdateChannelPathIdHash({
          channelId,
          pathId: invitePath
        });
      }
      const { channel } = await loadChatChannel({
        channelId,
        isForInvitation: true,
        invitationSourceChannelId: currentChannelId,
        invitationMessageId: messageId,
        skipUpdateChannelId: true
      });
      onSetChatInvitationDetail({
        channel,
        messageId,
        channelId: currentChannelId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitationChannelId]);

  const invitationChannelMemberCount =
    channelsObj[invitationChannelId]?.members?.length;
  const invitationChannelName = channelsObj[invitationChannelId]?.channelName;
  const invitationChannel = useMemo(
    () => channelsObj[invitationChannelId],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invitationChannelId, invitationChannelMemberCount, invitationChannelName]
  );

  const alreadyJoined = useMemo(() => {
    return invitationChannel?.allMemberIds?.includes(userId);
  }, [invitationChannel, userId]);

  const desktopHeight = useMemo(() => {
    if (userId === sender.id) {
      if (!invitationChannel || invitationChannel.members?.length > 3) {
        return '10rem';
      } else {
        return '8rem';
      }
    } else {
      if (!invitationChannel || invitationChannel.members?.length > 3) {
        return '15rem';
      } else {
        return '13rem';
      }
    }
  }, [invitationChannel, sender.id, userId]);

  const mobileHeight = useMemo(() => {
    if (userId === sender.id) {
      if (!invitationChannel || invitationChannel.members?.length > 3) {
        return '8rem';
      } else {
        return '6rem';
      }
    } else {
      if (!invitationChannel || invitationChannel.members?.length > 3) {
        return '13rem';
      } else {
        return '11rem';
      }
    }
  }, [invitationChannel, sender.id, userId]);

  const handleAcceptGroupInvitation = useCallback(async () => {
    setAccepting(true);
    setAcceptError('');
    try {
      await onAcceptGroupInvitation(invitePath);
    } catch (error: any) {
      // The server's own reason for a refusal (4xx); a server or network
      // failure gets a generic line instead of raw error text.
      const status = Number(error?.status || 0);
      setAcceptError(
        status >= 400 && status < 500 && error?.message
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitePath]);

  const acceptGroupInvitationLabel = useMemo(() => {
    return `Accept ${sender.username}'s Invitation`;
  }, [sender?.username]);

  return (
    <div
      className={css`
        height: ${acceptError ? 'auto' : desktopHeight};
        min-height: ${desktopHeight};
        @media (max-width: ${mobileMaxWidth}) {
          height: ${acceptError ? 'auto' : mobileHeight};
          min-height: ${mobileHeight};
        }
      `}
    >
      {invitationChannel?.channelName && (
        <ChannelDetail
          invitePath={invitePath}
          alreadyJoined={alreadyJoined}
          channelName={invitationChannel.channelName}
          members={invitationChannel.members}
          creatorId={invitationChannel.creatorId}
          allMemberIds={invitationChannel?.allMemberIds}
          channelId={invitationChannelId}
          sourceChannelId={currentChannelId}
          invitationMessageId={messageId}
        />
      )}
      {userId !== sender.id && (
        <Button
          variant="soft"
          tone="raised"
          color={chatInvitationColor}
          onClick={handleAcceptGroupInvitation}
          loading={accepting}
          disabled={alreadyJoined}
        >
          {alreadyJoined ? alreadyJoinedLabel : acceptGroupInvitationLabel}
        </Button>
      )}
      {userId !== sender.id && acceptError && !alreadyJoined && (
        <div
          role="alert"
          className={css`
            margin-top: 0.7rem;
            color: ${Color.rose()};
            font-size: 1.3rem;
            font-weight: 700;
          `}
        >
          {acceptError}
        </div>
      )}
    </div>
  );
}
