export interface AiImageRecoveryLocation {
  objectKey: string;
  format: string;
}

export function shouldRecoverAIImageFromSocket({
  reachedServer,
  hasServerProgress,
  hasPendingCompletion = false
}: {
  reachedServer: unknown;
  hasServerProgress: boolean;
  hasPendingCompletion?: boolean;
}) {
  return (
    reachedServer === false && (hasServerProgress || hasPendingCompletion)
  );
}

export async function resolveAIImageStatusImageUrl({
  imageUrl,
  recovery,
  loadResult
}: {
  imageUrl?: string;
  recovery?: AiImageRecoveryLocation;
  loadResult: (args: {
    recovery: AiImageRecoveryLocation;
  }) => Promise<{ imageUrl?: string } | undefined>;
}) {
  if (typeof imageUrl === 'string' && imageUrl) return imageUrl;
  if (!recovery) return undefined;

  const recovered = await loadResult({ recovery });
  return typeof recovered?.imageUrl === 'string' && recovered.imageUrl
    ? recovered.imageUrl
    : undefined;
}
