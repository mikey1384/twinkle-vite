export function navigateToChatWithPendingChessModal({
  channelId,
  chatPath,
  navigate,
  onSetPendingChessModalChannelId,
  onUpdateSelectedChannelId
}: {
  channelId: number;
  chatPath: string;
  navigate: (path: string) => void;
  onSetPendingChessModalChannelId: (channelId: number | null) => void;
  onUpdateSelectedChannelId: (channelId: number) => void;
}) {
  onUpdateSelectedChannelId(channelId);
  onSetPendingChessModalChannelId(channelId);
  navigate(chatPath);
}
