import type { RewardSettings } from '../components/Build/Rewards/types';

// A read started after a save or review submission supersedes older reads.
// Callers must also receive the current response, not just display it: an old
// preflight must never mistake a newer draft for an already pending request.
export function createRewardStatusReader(
  onSettings: (scope: string, settings: RewardSettings) => void
) {
  const requests = new Map<
    string,
    { key: string; promise: Promise<RewardSettings> }
  >();
  return read;

  function read(
    scope: string,
    key: string,
    load: () => Promise<RewardSettings>,
    force = false
  ): Promise<RewardSettings> {
    const existing = requests.get(scope);
    if (!force && existing?.key === key) return existing.promise;
    const request = {
      key,
      promise: Promise.resolve().then(load).then(
        (settings): RewardSettings | Promise<RewardSettings> => {
          if (requests.get(scope) !== request) return latest();
          requests.delete(scope);
          onSettings(scope, settings);
          return settings;
        },
        (error) => {
          if (requests.get(scope) !== request) return latest();
          requests.delete(scope);
          throw error;
        }
      )
    };
    requests.set(scope, request);
    return request.promise;

    function latest() {
      return requests.get(scope)?.promise || read(scope, key, load);
    }
  }
}
