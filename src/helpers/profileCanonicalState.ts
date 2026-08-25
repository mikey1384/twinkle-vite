function getCanonicalUserId(payload: unknown) {
  const userId = (payload as { userId?: unknown } | null)?.userId;
  if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
    throw new Error('Profile response did not include a canonical user ID');
  }
  return userId;
}

export function getCanonicalProfileGreeting(payload: unknown) {
  const greeting = (payload as { greeting?: unknown } | null)?.greeting;
  if (typeof greeting !== 'string') {
    throw new Error('Profile response did not include a canonical greeting');
  }
  return { userId: getCanonicalUserId(payload), greeting };
}

export function getCanonicalProfileStatus(payload: unknown) {
  const canonicalPayload = payload as {
    statusMsg?: unknown;
    statusColor?: unknown;
  } | null;
  const statusMsg = canonicalPayload?.statusMsg;
  const statusColor = canonicalPayload?.statusColor;
  if (
    (typeof statusMsg !== 'string' && statusMsg !== null) ||
    (typeof statusColor !== 'string' && statusColor !== null)
  ) {
    throw new Error('Profile response did not include canonical status data');
  }
  return {
    userId: getCanonicalUserId(payload),
    statusMsg: statusMsg as string | null,
    statusColor: statusColor as string | null
  };
}

export function getCanonicalProfileTheme(payload: unknown) {
  const profileTheme = (payload as { profileTheme?: unknown } | null)
    ?.profileTheme;
  if (typeof profileTheme !== 'string' || !profileTheme) {
    throw new Error('Profile response did not include a canonical theme');
  }
  return { userId: getCanonicalUserId(payload), profileTheme };
}

export function getCanonicalProfilePictureState(payload: unknown) {
  const pictures = (payload as { pictures?: unknown } | null)?.pictures;
  if (!Array.isArray(pictures)) {
    throw new Error(
      'Profile picture response did not include canonical picture data'
    );
  }
  return { userId: getCanonicalUserId(payload), pictures };
}

export function getCanonicalDeletedProfilePicture(payload: unknown) {
  const rawPictureId = (payload as { deletedPictureId?: unknown } | null)
    ?.deletedPictureId;
  if (
    typeof rawPictureId !== 'number' ||
    !Number.isInteger(rawPictureId) ||
    rawPictureId <= 0
  ) {
    throw new Error(
      'Profile picture response did not confirm the canonical deletion'
    );
  }
  return { userId: getCanonicalUserId(payload), pictureId: rawPictureId };
}

export function getCanonicalProfilePictureUrl(payload: unknown) {
  const profilePicUrl = (payload as { profilePicUrl?: unknown } | null)
    ?.profilePicUrl;
  if (typeof profilePicUrl !== 'string' || !profilePicUrl) {
    throw new Error(
      'Profile picture response did not include the canonical profile picture'
    );
  }
  return { userId: getCanonicalUserId(payload), profilePicUrl };
}
