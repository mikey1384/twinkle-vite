export interface SubjectSecretSignal {
  hasSecretAnswer?: unknown;
  hasSecretAttachment?: unknown;
  secretAnswer?: unknown;
  secretAttachment?: unknown;
  [key: string]: unknown;
}

export function hasSubjectSecretSignal(
  subject?: SubjectSecretSignal | null
) {
  return Boolean(
    subject?.hasSecretAnswer ||
      subject?.hasSecretAttachment ||
      subject?.secretAnswer ||
      subject?.secretAttachment
  );
}
