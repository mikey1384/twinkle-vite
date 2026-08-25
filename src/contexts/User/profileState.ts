export function applyCanonicalUserProfileStatePatch({
  profileState,
  user,
  userId
}: {
  profileState: { [key: string]: any };
  user: { [key: string]: any } | null | undefined;
  userId: number;
}) {
  const currentState =
    user?.state && typeof user.state === 'object' && !Array.isArray(user.state)
      ? user.state
      : {};
  const currentProfile =
    currentState.profile &&
    typeof currentState.profile === 'object' &&
    !Array.isArray(currentState.profile)
      ? currentState.profile
      : {};
  return {
    ...(user || {}),
    state: {
      ...currentState,
      profile: {
        ...currentProfile,
        ...profileState
      }
    },
    userId,
    contentId: userId
  };
}
