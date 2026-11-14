// Restoring a version while Lumine is running stops the run first on the
// server. The server answers 409 `build_lumine_run_stopping` when the run has
// not finished stopping within its own wait; that is a "try again in a moment"
// answer, not a failure, so the website retries a few times on its own.
export const RESTORE_STILL_STOPPING_CODE = 'build_lumine_run_stopping';
export const RESTORE_STOPS_LUMINE_TEXT =
  "Lumine is working on your app right now. Restoring will stop it, and the changes it hasn't saved yet will be lost. Restore anyway?";
export const RESTORE_STILL_STOPPING_FAILED_TEXT =
  "Lumine is taking a little while to stop, so your version wasn't restored. Wait a moment and try again.";
export const RESTORE_FAILED_TEXT =
  "Your version couldn't be restored. Please try again.";
export const RESTORE_STOPPING_MAX_ATTEMPTS = 4;
export const RESTORE_STOPPING_RETRY_DELAY_MS = 3000;

export function isRestoreStillStoppingError(error: any) {
  return error?.status === 409 && error?.code === RESTORE_STILL_STOPPING_CODE;
}

export async function restoreWithStoppingRetry<T>({
  restore,
  wait,
  maxAttempts = RESTORE_STOPPING_MAX_ATTEMPTS,
  delayMs = RESTORE_STOPPING_RETRY_DELAY_MS
}: {
  restore: () => Promise<T>;
  wait: (ms: number) => Promise<void>;
  maxAttempts?: number;
  delayMs?: number;
}): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await restore();
    } catch (error) {
      if (!isRestoreStillStoppingError(error) || attempt >= maxAttempts) {
        throw error;
      }
      await wait(delayMs);
    }
  }
}

export function getRestoreErrorMessage(error: any) {
  if (isRestoreStillStoppingError(error)) {
    return RESTORE_STILL_STOPPING_FAILED_TEXT;
  }
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  return message || RESTORE_FAILED_TEXT;
}
