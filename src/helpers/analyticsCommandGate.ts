export type AnalyticsCommand = [command: string, ...args: unknown[]];

export function createAnalyticsCommandGate(initiallyResolved: boolean) {
  let resolved = initiallyResolved;
  let pendingCommands: AnalyticsCommand[] = [];

  return {
    enqueue(
      command: AnalyticsCommand,
      dispatch: (command: AnalyticsCommand) => void
    ) {
      if (!resolved) {
        pendingCommands.push(command);
        return false;
      }
      dispatch(command);
      return true;
    },
    resolve(dispatch: (command: AnalyticsCommand) => void) {
      if (resolved) return;
      resolved = true;
      const commandsToDispatch = pendingCommands;
      pendingCommands = [];
      for (const command of commandsToDispatch) dispatch(command);
    }
  };
}
