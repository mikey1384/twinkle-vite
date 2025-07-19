import React, { useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { TURN_USERNAME, TURN_PASSWORD } from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import { useChatContext, useKeyContext } from '~/contexts';

export default function useCallSocket({
  selectedChannelId,
  channelsObj
}: {
  selectedChannelId: number;
  channelsObj: { [key: string]: any };
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const myStream = useChatContext((v) => v.state.myStream);
  const channelOnCall = useChatContext((v) => v.state.channelOnCall);

  const onCallReceptionConfirm = useChatContext(
    (v) => v.actions.onCallReceptionConfirm
  );
  const onHangUp = useChatContext((v) => v.actions.onHangUp);
  const onSetCall = useChatContext((v) => v.actions.onSetCall);
  const onSetMembersOnCall = useChatContext(
    (v) => v.actions.onSetMembersOnCall
  );
  const onSetMyStream = useChatContext((v) => v.actions.onSetMyStream);
  const onSetPeerStreams = useChatContext((v) => v.actions.onSetPeerStreams);
  const onShowIncoming = useChatContext((v) => v.actions.onShowIncoming);
  const onShowOutgoing = useChatContext((v) => v.actions.onShowOutgoing);

  const membersOnCall: React.MutableRefObject<any> = useRef({});
  const peersRef: React.MutableRefObject<any> = useRef({});
  const prevIncomingShown = useRef(false);
  const prevMyStreamRef = useRef(null);
  const receivedCallSignals = useRef([]);

  useEffect(() => {
    if (
      !prevIncomingShown.current &&
      channelOnCall.incomingShown &&
      !channelOnCall.imCalling
    ) {
      for (const peerId in membersOnCall.current) {
        socket.emit('inform_peer_signal_accepted', {
          peerId,
          channelId: channelOnCall.id
        });
        socket.emit('join_call', { channelId: channelOnCall.id, userId });
        handleNewPeer({
          peerId: peerId,
          channelId: channelOnCall.id,
          initiator: true
        });
      }
    }
    prevIncomingShown.current = channelOnCall.incomingShown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelOnCall.id, channelOnCall.incomingShown, channelOnCall.imCalling]);

  useEffect(() => {
    socket.emit(
      'check_online_users',
      selectedChannelId,
      ({
        callData,
        onlineUsers
      }: {
        callData: any;
        onlineUsers: { [key: string]: any }[];
      }) => {
        if (callData && Object.keys(membersOnCall.current).length === 0) {
          const membersHash: { [key: string]: any } = {};
          for (const member of Object.values(onlineUsers).filter(
            (member) => !!callData.peers[member.socketId]
          )) {
            membersHash[member.id] = member.socketId;
          }
          onSetCall({
            channelId: selectedChannelId,
            isClass: channelsObj[selectedChannelId]?.isClass
          });
          onSetMembersOnCall(membersHash);
          membersOnCall.current = callData.peers;
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  useEffect(() => {
    if (myStream && !prevMyStreamRef.current) {
      if (channelOnCall.imCalling) {
        socket.emit('start_new_call', channelOnCall.id);
      } else {
        for (const peerId in membersOnCall.current) {
          try {
            if (peersRef.current[peerId]) {
              peersRef.current[peerId].addStream(myStream);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
    }
    prevMyStreamRef.current = myStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelOnCall.isClass, myStream]);

  useEffect(() => {
    socket.on('call_terminated', handleCallTerminated);
    socket.on('call_reception_confirmed', handleCallReceptionConfirm);
    socket.on('signal_received', handleCallSignal);
    socket.on('new_call_member', handleNewCallMember);
    socket.on('new_call_started', handleNewCall);
    socket.on('peer_accepted', handlePeerAccepted);
    socket.on('peer_hung_up', handlePeerHungUp);

    return function cleanUp() {
      socket.off('call_terminated', handleCallTerminated);
      socket.off('call_reception_confirmed', handleCallReceptionConfirm);
      socket.off('new_call_member', handleNewCallMember);
      socket.off('new_call_started', handleNewCall);
      socket.off('peer_accepted', handlePeerAccepted);
      socket.off('peer_hung_up', handlePeerHungUp);
      socket.off('signal_received', handleCallSignal);
    };

    function handleCallReceptionConfirm(channelId: number) {
      onCallReceptionConfirm(channelId);
    }

    function handleCallSignal({
      peerId,
      signal,
      to
    }: {
      peerId: string;
      signal: any;
      to: number;
    }) {
      if (to === userId && peersRef.current[peerId]) {
        if (peersRef.current[peerId].signal) {
          try {
            peersRef.current[peerId].signal(signal);
          } catch (error) {
            console.error(error);
          }
        }
      }
    }

    function handleCallTerminated() {
      onSetCall({});
      onSetMyStream(null);
      onSetPeerStreams({});
      onSetMembersOnCall({});
      membersOnCall.current = {};
      peersRef.current = {};
      prevMyStreamRef.current = null;
      prevIncomingShown.current = false;
      receivedCallSignals.current = [];
    }

    function handleNewCall({
      memberId,
      channelId,
      peerId
    }: {
      memberId: number;
      channelId: number;
      peerId: string;
    }) {
      if (!channelOnCall.id) {
        if (memberId !== userId && !membersOnCall.current[peerId]) {
          onSetCall({
            channelId,
            isClass: channelsObj[selectedChannelId]?.isClass
          });
        }
      }
      if (
        !channelOnCall.id ||
        (channelOnCall.id === channelId && channelOnCall.imCalling)
      ) {
        if (!channelOnCall.members?.[memberId]) {
          onSetMembersOnCall({ [memberId]: peerId });
        }
        membersOnCall.current[peerId] = true;
      }
    }

    function handleNewCallMember({
      socketId,
      memberId
    }: {
      socketId: string;
      memberId: number;
    }) {
      if (!channelOnCall.members?.[memberId]) {
        onSetMembersOnCall({ [memberId]: socketId });
      }
      membersOnCall.current[socketId] = true;
    }
  });

  function handleNewPeer({
    peerId,
    channelId,
    initiator,
    stream
  }: {
    peerId: string;
    channelId: number;
    initiator?: boolean;
    stream?: MediaStream;
  }) {
    if (initiator || channelOnCall.members[userId]) {
      peersRef.current[peerId] = new Peer({
        config: {
          iceServers: [
            {
              urls: 'turn:13.230.133.153:3478',
              username: TURN_USERNAME as string,
              credential: TURN_PASSWORD as string
            },
            {
              urls: 'stun:stun.l.google.com:19302'
            }
          ]
        },
        initiator,
        stream
      });

      peersRef.current[peerId].on('signal', (signal: any) => {
        socket.emit('send_signal', {
          socketId: peerId,
          signal,
          channelId
        });
      });

      peersRef.current[peerId].on('stream', (stream: any) => {
        onShowIncoming();
        onSetPeerStreams({ peerId, stream });
      });

      peersRef.current[peerId].on('connect', () => {
        onShowOutgoing();
      });

      peersRef.current[peerId].on('close', () => {
        delete peersRef.current[peerId];
      });

      peersRef.current[peerId].on('error', (e: any) => {
        console.error('Peer error %s:', peerId, e);
      });
    }
  }

  function handlePeerAccepted({
    channelId,
    to,
    peerId
  }: {
    channelId: number;
    to: number;
    peerId: string;
  }) {
    if (to === userId) {
      try {
        handleNewPeer({
          peerId,
          channelId,
          stream: myStream
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  function handlePeerHungUp({
    channelId,
    memberId,
    peerId
  }: {
    channelId: number;
    memberId: number;
    peerId: string;
  }) {
    if (
      Number(channelId) === Number(channelOnCall.id) &&
      membersOnCall.current[peerId]
    ) {
      delete membersOnCall.current[peerId];
      onHangUp({ peerId, memberId, iHungUp: memberId === userId });
    }
  }
}
