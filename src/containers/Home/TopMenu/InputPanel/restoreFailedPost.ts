// A file post that didn't go through goes back into the post form, as it
// was, so it can be tried again (its attachment never left the form). The
// form then saves it as a draft again.
export function restoreFailedPost({
  post,
  actions
}: {
  post: {
    title: string;
    description: string;
    hasSecretAnswer: boolean;
    secretAnswer: string;
    byUser: boolean;
  };
  actions: {
    onSetSubjectTitle: (title: string) => void;
    onSetSubjectDescription: (description: string) => void;
    onSetSubjectDescriptionFieldShown: (shown: boolean) => void;
    onSetHasSecretAnswer: (has: boolean) => void;
    onSetSecretAnswer: (secretAnswer: string) => void;
    onSetIsMadeByUser: (is: boolean) => void;
  };
}) {
  actions.onSetSubjectTitle(post.title || '');
  actions.onSetSubjectDescription(post.description || '');
  actions.onSetSubjectDescriptionFieldShown(true);
  actions.onSetHasSecretAnswer(!!post.hasSecretAnswer);
  actions.onSetSecretAnswer(
    post.hasSecretAnswer ? post.secretAnswer || '' : ''
  );
  actions.onSetIsMadeByUser(!!post.byUser);
}
