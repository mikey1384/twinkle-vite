export interface ConfirmedRealtimeMessage {
  id?: number | string;
  tempMessageId?: number | string;
  userId?: number | string;
  isNewMessage?: boolean;
}

export function getChatMessageIdentity(
  message?: ConfirmedRealtimeMessage | null
): number | string | null {
  return message?.id || message?.tempMessageId || null;
}

export function countConfirmedRealtimeMessageArrivals({
  messages,
  previousNewestMessageId,
  viewerUserId
}: {
  messages: ConfirmedRealtimeMessage[];
  previousNewestMessageId: number | string | null;
  viewerUserId: number | string;
}) {
  if (previousNewestMessageId === null) return 0;
  const previousNewestIndex = messages.findIndex(
    (message) => getChatMessageIdentity(message) === previousNewestMessageId
  );
  if (previousNewestIndex <= 0) return 0;
  return messages
    .slice(0, previousNewestIndex)
    .filter(
      (message) =>
        message.isNewMessage === true &&
        Number(message.userId) !== Number(viewerUserId)
    ).length;
}
