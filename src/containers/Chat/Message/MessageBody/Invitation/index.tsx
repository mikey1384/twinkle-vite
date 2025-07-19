import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ChannelDetail from './ChannelDetail';
import Button from '~/components/Button';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { parseChannelPath } from '~/helpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const alreadyJoinedLabel = localize('alreadyJoined');

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
  onAcceptGroupInvitation: (channelId: string) => void;
  sender: {
    id: number;
    username: string;
    profilePicUrl?: string;
  };
}) {
  const [accepting, setAccepting] = useState(false);
  const userId = useKeyContext((v) => v.myState.userId);
  const {
    chatInvitation: { color: chatInvitationColor }
  } = useKeyContext((v) => v.theme);
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

  const invitationChannel = useMemo(
    () => channelsObj[invitationChannelId],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [invitationChannelId, channelsObj[invitationChannelId]?.members?.length]
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

  const handleAcceptGroupInvitation = useCallback(() => {
    setAccepting(true);
    onAcceptGroupInvitation(invitePath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitePath]);

  const acceptGroupInvitationLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${sender.username}님의 초대 수락`;
    }
    return `Accept ${sender.username}'s Invitation`;
  }, [sender?.username]);

  return (
    <div
      className={css`
        height: ${desktopHeight};
        @media (max-width: ${mobileMaxWidth}) {
          height: ${mobileHeight};
        }
      `}
    >
      {invitationChannel && (
        <ChannelDetail
          invitePath={invitePath}
          alreadyJoined={alreadyJoined}
          channelName={invitationChannel.channelName}
          members={invitationChannel.members}
          creatorId={invitationChannel.creatorId}
          allMemberIds={invitationChannel?.allMemberIds}
          channelId={invitationChannelId}
        />
      )}
      {userId !== sender.id && (
        <Button
          filled
          color={chatInvitationColor}
          onClick={handleAcceptGroupInvitation}
          loading={accepting}
          disabled={alreadyJoined}
        >
          {alreadyJoined ? alreadyJoinedLabel : acceptGroupInvitationLabel}
        </Button>
      )}
    </div>
  );
}
