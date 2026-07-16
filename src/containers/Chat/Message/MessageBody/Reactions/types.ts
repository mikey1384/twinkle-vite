export type PendingReactionMutation = 'add' | 'remove';

export type PendingReactionMutations = Partial<
  Record<string, PendingReactionMutation>
>;
