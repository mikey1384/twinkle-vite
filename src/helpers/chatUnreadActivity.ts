// Module-scope revision counter for confirmed unread-affecting chat activity
// (message receipt, deletion, reaction changes, read-watermark writes). A
// canonical unread snapshot the server captured before one of these events
// landed must not be applied after it: producers capture the revision at
// request start and re-read the writer on mismatch instead of applying the
// older snapshot. The counter lives at module scope because only the chat
// socket hook observes most of these events, while last-read reconcilers in
// Chat Main and the AI socket hook must honor the same invalidations.
let chatUnreadActivityRevision = 0;

export function markChatUnreadActivity() {
  chatUnreadActivityRevision += 1;
  return chatUnreadActivityRevision;
}

export function getChatUnreadActivityRevision() {
  return chatUnreadActivityRevision;
}
