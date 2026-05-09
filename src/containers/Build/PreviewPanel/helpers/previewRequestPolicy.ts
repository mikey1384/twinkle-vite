const MUTATING_PREVIEW_REQUEST_TYPES = new Set([
  'ai:chat',
  'ai:generate-object',
  'ai:generate-image',
  'characters:chat',
  'chat:create-room',
  'chat:delete-message',
  'chat:send-message',
  'files:delete',
  'files:save-as',
  'files:upload-selected',
  'private-db:remove',
  'private-db:set',
  'reminders:create',
  'reminders:get-due',
  'reminders:remove',
  'reminders:update',
  'shared-db:add-entry',
  'shared-db:create-topic',
  'shared-db:delete-entry',
  'shared-db:update-entry',
  'user-db:exec',
  'world:heartbeat',
  'world:join',
  'world:leave',
  'world:send',
  'world:update-presence'
]);

export function isMutatingPreviewRequestType(type: string) {
  return MUTATING_PREVIEW_REQUEST_TYPES.has(type);
}
