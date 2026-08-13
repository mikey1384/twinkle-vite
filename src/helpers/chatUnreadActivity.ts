// Module-scope revision counter for confirmed unread-affecting chat activity
// (message receipt, deletion, reaction changes, read-watermark writes). A
// canonical unread snapshot the server captured before one of these events
// landed must not be applied after it: producers capture the revision at
// request start and re-read the writer on mismatch instead of applying the
// older snapshot. The counter lives at module scope because only the chat
// socket hook observes most of these events, while last-read reconcilers in
// Chat Main and the AI socket hook must honor the same invalidations.
let chatUnreadActivityRevision = 0;
let chatProjectionActivityRevision = 0;

// These are confirmed server events whose reducers can update state that a
// concurrent /chat/channel response also replaces. Mark them at packet ingress
// so recovery can discard a writer snapshot captured before the event instead
// of overwriting newer messages, edits, membership, settings, AI stream state,
// or game state after the packet has already been applied.
const CHAT_PROJECTION_SOCKET_EVENTS = new Set([
  'ai_file_generated',
  'ai_message_delta_streamed',
  'ai_message_done',
  'ai_message_error',
  'ai_thinking_status_updated',
  'ai_thought_streamed',
  'canceled_chess_rewind',
  'channel_settings_changed',
  'chat_attachment_thumbnail_updated',
  'chat_invitation_received',
  'chat_message_deleted',
  'chat_message_edited',
  'chat_reaction_added',
  'chat_reaction_removed',
  'chat_reaction_updated',
  'chat_sidebar_state_updated',
  'chat_subject_purchased',
  'chess_move_made',
  'chess_rewind_requested',
  'declined_chess_rewind',
  'human_topic_state_changed',
  'left_chat_from_another_tab',
  'member_joined',
  'member_left',
  'message_attachment_hid',
  'new_ai_message_received',
  'new_message_received',
  'new_wordle_attempt_received',
  'removed_from_channel',
  'rewound_chess_game',
  'subject_changed',
  'subtitle_translation_progress_update',
  'topic_featured',
  'topic_settings_changed'
]);

export function markChatUnreadActivity() {
  chatUnreadActivityRevision += 1;
  return chatUnreadActivityRevision;
}

export function getChatUnreadActivityRevision() {
  return chatUnreadActivityRevision;
}

export function markChatProjectionSocketEvent(eventName: string) {
  if (!CHAT_PROJECTION_SOCKET_EVENTS.has(eventName)) return false;
  chatProjectionActivityRevision += 1;
  return true;
}

export function getChatProjectionActivityRevision() {
  return chatProjectionActivityRevision;
}
