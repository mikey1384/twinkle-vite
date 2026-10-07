// The user-facing chat message rule, in characters (UTF-16 units, as
// String.length counts them). The API accepts up to 128K (twinkle-api
// helpers/chatMessageLimits.ts).
export const CHAT_MESSAGE_MAX_CHARS = 50_000;

// Guard rail in bytes, independent of the character rule: 50,000 characters
// at the 4-byte UTF-8 worst case. A message is saved over HTTP (8 MB body
// limit) and only its ids travel over the socket, so this never trips while
// the character rule stays at 50,000 (at most 150,000 bytes). It keeps a
// future character-limit change from silently outgrowing the API budget
// (SOCKET_CHAT_MESSAGE_EVENT_MAX_BYTES in twinkle-api socket/ingressGuard.ts).
export const CHAT_MESSAGE_MAX_UTF8_BYTES = CHAT_MESSAGE_MAX_CHARS * 4;
