import React, { useEffect, useRef } from 'react';
import { TURN_USERNAME, TURN_PASSWORD } from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import { useChatContext, useKeyContext } from '~/contexts';

let peerConstructorPromise: Promise<any> | null = null;

function loadPeerConstructor() {
  if (!peerConstructorPromise) {
    peerConstructorPromise = import('simple-peer').then(
      (module) => module.default
    );
  }
  return peerConstructorPromise;
}

function signalPeer(peer: any, signal: any) {
  if (!peer?.signal) return;
  try {
    peer.signal(signal);
  } catch (error) {
    console.error(error);
  }
}

function getCallId(channelId: unknown) {
  const parsedChannelId = Number(channelId);
  return Number.isInteger(parsedChannelId) && parsedChannelId > 0
    ? parsedChannelId
    : null;
}

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

  // Refs for values used in socket handlers
  const selectedChannelIdRef = useRef(selectedChannelId);
  const channelsObjRef = useRef(channelsObj);
  const channelOnCallRef = useRef(channelOnCall);
  const userIdRef = useRef(userId);
  const myStreamRef = useRef(myStream);
  selectedChannelIdRef.current = selectedChannelId;
  channelsObjRef.current = channelsObj;
  channelOnCallRef.current = channelOnCall;
  userIdRef.current = userId;
  myStreamRef.current = myStream;

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

  const membersOnCall: React.RefObject<any> = useRef({});
  const peersRef: React.RefObject<any> = useRef({});
  const prevIncomingShown = useRef(false);
  const prevMyStreamRef = useRef(null);
  const pendingCallSignals = useRef<Record<string, any[]>>({});
  const callGenerationRef = useRef(0);
  const peerGenerationRef = useRef<Record<string, number>>({});
  const currentCallIdRef = useRef(getCallId(channelOnCall.id));

  const currentCallId = getCallId(channelOnCall.id);
  if (currentCallIdRef.current !== currentCallId) {
    callGenerationRef.current += 1;
    currentCallIdRef.current = currentCallId;
    if (!currentCallId) {
      pendingCallSignals.current = {};
      peerGenerationRef.current = {};
    }
  }

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
      to,
      toSocketId,
      channelId
    }: {
      channelId?: number;
      peerId: string;
      signal: any;
      to: number | null;
      toSocketId?: string;
    }) {
      if (to !== userIdRef.current && toSocketId !== socket.id) {
        return;
      }
      if (
        typeof channelId === 'number' &&
        getCallId(channelId) !== getCallId(channelOnCallRef.current.id)
      ) {
        return;
      }

      const peer = peersRef.current[peerId];
      if (peer) {
        signalPeer(peer, signal);
        return;
      }

      if (!pendingCallSignals.current[peerId]) {
        pendingCallSignals.current[peerId] = [];
      }
      pendingCallSignals.current[peerId].push(signal);
    }

    function handleCallTerminated() {
      callGenerationRef.current += 1;
      onSetCall({});
      onSetMyStream(null);
      onSetPeerStreams({});
      onSetMembersOnCall({});
      channelOnCallRef.current = {};
      destroyPeers();
      membersOnCall.current = {};
      prevMyStreamRef.current = null;
      prevIncomingShown.current = false;
      pendingCallSignals.current = {};
      peerGenerationRef.current = {};
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
      const currentChannelOnCall = channelOnCallRef.current;
      const currentUserId = userIdRef.current;
      const currentSelectedChannelId = selectedChannelIdRef.current;
      const currentChannelsObj = channelsObjRef.current;
      if (!currentChannelOnCall.id) {
        if (memberId !== currentUserId && !membersOnCall.current[peerId]) {
          onSetCall({
            channelId,
            isClass: currentChannelsObj[currentSelectedChannelId]?.isClass
          });
        }
      }
      if (
        !currentChannelOnCall.id ||
        (currentChannelOnCall.id === channelId && currentChannelOnCall.imCalling)
      ) {
        if (!currentChannelOnCall.members?.[memberId]) {
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
      const currentChannelOnCall = channelOnCallRef.current;
      if (!currentChannelOnCall.members?.[memberId]) {
        onSetMembersOnCall({ [memberId]: socketId });
      }
      membersOnCall.current[socketId] = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const requestCallGeneration = callGenerationRef.current;
    const requestPeerGeneration = peerGenerationRef.current[peerId] || 0;

    if (canCreatePeerForCurrentCall({ channelId, initiator })) {
      void loadPeerConstructor()
        .then((Peer) => {
          if (
            !isPeerCreationCurrent({
              callGeneration: requestCallGeneration,
              peerGeneration: requestPeerGeneration,
              channelId,
              peerId,
              initiator
            })
          ) {
            delete pendingCallSignals.current[peerId];
            return;
          }

          const existingPeer = peersRef.current[peerId];
          if (existingPeer) {
            replayPendingCallSignals(peerId, existingPeer);
            return;
          }

          const peer = new Peer({
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

          peer.on('signal', (signal: any) => {
            socket.emit('send_signal', {
              socketId: peerId,
              signal,
              channelId
            });
          });

          peer.on('stream', (stream: any) => {
            onShowIncoming();
            onSetPeerStreams({ peerId, stream });
          });

          peer.on('connect', () => {
            onShowOutgoing();
          });

          peer.on('close', () => {
            delete peersRef.current[peerId];
            delete pendingCallSignals.current[peerId];
            bumpPeerGeneration(peerId);
          });

          peer.on('error', (e: any) => {
            console.error('Peer error %s:', peerId, e);
          });

          peersRef.current[peerId] = peer;
          replayPendingCallSignals(peerId, peer);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }

  function canCreatePeerForCurrentCall({
    channelId,
    initiator
  }: {
    channelId: number;
    initiator?: boolean;
  }) {
    const currentChannelOnCall = channelOnCallRef.current;
    if (getCallId(currentChannelOnCall.id) !== getCallId(channelId)) {
      return false;
    }
    if (initiator) return true;
    return !!currentChannelOnCall.members?.[userIdRef.current];
  }

  function isPeerCreationCurrent({
    callGeneration,
    peerGeneration,
    channelId,
    peerId,
    initiator
  }: {
    callGeneration: number;
    peerGeneration: number;
    channelId: number;
    peerId: string;
    initiator?: boolean;
  }) {
    return (
      callGeneration === callGenerationRef.current &&
      peerGeneration === (peerGenerationRef.current[peerId] || 0) &&
      canCreatePeerForCurrentCall({ channelId, initiator })
    );
  }

  function replayPendingCallSignals(peerId: string, peer: any) {
    const signals = pendingCallSignals.current[peerId];
    if (!signals?.length) return;

    delete pendingCallSignals.current[peerId];
    for (const signal of signals) {
      signalPeer(peer, signal);
    }
  }

  function bumpPeerGeneration(peerId: string) {
    peerGenerationRef.current[peerId] =
      (peerGenerationRef.current[peerId] || 0) + 1;
  }

  function destroyPeer(peerId: string) {
    const peer = peersRef.current[peerId];
    if (peer?.destroy) {
      try {
        peer.destroy();
      } catch (error) {
        console.error(error);
      }
    }
    delete peersRef.current[peerId];
    delete pendingCallSignals.current[peerId];
  }

  function destroyPeers() {
    for (const peerId of Object.keys(peersRef.current)) {
      destroyPeer(peerId);
    }
  }

  function handlePeerAccepted({
    channelId,
    to,
    peerId,
    toSocketId
  }: {
    channelId: number;
    to: number | null;
    peerId: string;
    toSocketId?: string;
  }) {
    if (to === userIdRef.current || toSocketId === socket.id) {
      try {
        handleNewPeer({
          peerId,
          channelId,
          stream: myStreamRef.current
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
    if (Number(channelId) !== Number(channelOnCallRef.current.id)) return;

    bumpPeerGeneration(peerId);
    destroyPeer(peerId);
    if (membersOnCall.current[peerId]) {
      delete membersOnCall.current[peerId];
      onHangUp({ peerId, memberId, iHungUp: memberId === userIdRef.current });
    }
  }
}
