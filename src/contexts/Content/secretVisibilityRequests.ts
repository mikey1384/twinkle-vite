interface SecretVisibilityRequest {
  generation: number;
  promise: Promise<boolean>;
}

const generations = new Map<string, number>();
const requests = new Map<string, SecretVisibilityRequest>();

function getRequestKey({
  subjectId,
  userId
}: {
  subjectId: number;
  userId: number;
}) {
  return `${userId}:${subjectId}`;
}

function getGeneration(key: string) {
  return generations.get(key) || 0;
}

export async function loadCanonicalSecretVisibility({
  load,
  subjectId,
  userId
}: {
  load: () => Promise<{ responded?: unknown }>;
  subjectId: number;
  userId: number;
}): Promise<boolean | null> {
  const normalizedSubjectId = Math.floor(Number(subjectId) || 0);
  const normalizedUserId = Math.floor(Number(userId) || 0);
  if (normalizedSubjectId <= 0 || normalizedUserId <= 0) return null;

  const key = getRequestKey({
    subjectId: normalizedSubjectId,
    userId: normalizedUserId
  });
  const generation = getGeneration(key);
  let request = requests.get(key);

  if (!request || request.generation !== generation) {
    let promise!: Promise<boolean>;
    promise = (async () => {
      try {
        const result = await load();
        return result?.responded === true;
      } finally {
        const currentRequest = requests.get(key);
        if (currentRequest?.promise === promise) {
          requests.delete(key);
        }
      }
    })();
    request = { generation, promise };
    requests.set(key, request);
  }

  const responded = await request.promise;
  return generation === getGeneration(key) ? responded : null;
}

// A confirmed subject reload after comment submission supersedes any
// response check that began before that reload. Invalidating here prevents a
// slower pre-comment `responded: false` result from hiding the secret again.
export function invalidateSecretVisibilityRequest({
  subjectId,
  userId
}: {
  subjectId: number;
  userId: number;
}) {
  const normalizedSubjectId = Math.floor(Number(subjectId) || 0);
  const normalizedUserId = Math.floor(Number(userId) || 0);
  if (normalizedSubjectId <= 0 || normalizedUserId <= 0) return;

  const key = getRequestKey({
    subjectId: normalizedSubjectId,
    userId: normalizedUserId
  });
  generations.set(key, getGeneration(key) + 1);
  requests.delete(key);
}

/** @internal exported for focused tests */
export function resetSecretVisibilityRequestsForTests() {
  generations.clear();
  requests.clear();
}
