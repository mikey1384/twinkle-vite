import { lazyWithRetry } from '~/helpers/lazyImportHelpers';

type DailyRewardModalModule = typeof import('./index');

let importPromise: Promise<DailyRewardModalModule> | undefined;

export function loadDailyRewardModal() {
  if (!importPromise) {
    importPromise = import('./index').catch((error) => {
      importPromise = undefined;
      throw error;
    });
  }
  return importPromise;
}

export const LazyDailyRewardModal = lazyWithRetry(loadDailyRewardModal);
