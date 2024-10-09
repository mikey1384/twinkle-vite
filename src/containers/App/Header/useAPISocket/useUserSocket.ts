import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useKeyContext } from '~/contexts';

export default function useUserSocket() {
  const { userId } = useKeyContext((v) => v.myState);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  useEffect(() => {
    socket.on('approval_result_received', handleApprovalResultReceived);
    socket.on('ban_status_updated', handleBanStatusUpdate);
    socket.on('new_title_received', handleNewTitle);
    socket.on('profile_pic_changed', handleProfilePicChange);
    socket.on('username_changed', handleUsernameChange);
    socket.on('user_type_updated', handleUserTypeUpdate);

    return function cleanUp() {
      socket.removeListener(
        'approval_result_received',
        handleApprovalResultReceived
      );
      socket.removeListener('ban_status_updated', handleBanStatusUpdate);
      socket.removeListener('new_title_received', handleNewTitle);
      socket.removeListener('profile_pic_changed', handleProfilePicChange);
      socket.removeListener('username_changed', handleUsernameChange);
      socket.removeListener('user_type_updated', handleUserTypeUpdate);
    };

    function handleApprovalResultReceived({ type }: { type: string }) {
      if (type === 'mentor') {
        onSetUserState({
          userId,
          newState: { title: 'teacher' }
        });
      }
    }

    function handleBanStatusUpdate(banStatus: any) {
      onSetUserState({ userId, newState: { banned: banStatus } });
    }

    function handleNewTitle(title: string) {
      onSetUserState({ userId, newState: { title } });
    }

    function handleProfilePicChange({
      userId,
      profilePicUrl
    }: {
      userId: number;
      profilePicUrl: string;
    }) {
      onSetUserState({ userId, newState: { profilePicUrl } });
    }

    function handleUsernameChange({
      userId,
      newUsername
    }: {
      userId: number;
      newUsername: string;
    }) {
      onSetUserState({ userId, newState: { username: newUsername } });
    }

    function handleUserTypeUpdate({
      userId,
      userType,
      userTypeProps
    }: {
      userId: number;
      userType: string;
      userTypeProps: any;
    }) {
      onSetUserState({ userId, newState: { userType, ...userTypeProps } });
    }
  });
}
