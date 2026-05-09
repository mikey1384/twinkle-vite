import type {
  BuildChatUploadRoute,
  BuildHiddenMessageContextOptions
} from '../types';

export const BUILD_CHAT_HIDDEN_REFERENCE_CONTEXT_PREFIX =
  '[[[reference_context]]]';

export function buildBuildChatUploadPendingMessage(files: File[]) {
  const normalizedFiles = normalizeUploadFiles(files);
  const imageFiles = normalizedFiles.filter(isImageChatReferenceFile);
  if (normalizedFiles.length === 1 && imageFiles.length === 1) {
    return 'Checking your image...';
  }
  if (
    normalizedFiles.length > 1 &&
    imageFiles.length === normalizedFiles.length
  ) {
    return 'Checking your images...';
  }
  return 'Checking your upload...';
}

export function buildBuildChatUploadRouteProgressMessage(
  route: BuildChatUploadRoute,
  files: File[]
) {
  const normalizedFiles = normalizeUploadFiles(files);
  const imageFiles = normalizedFiles.filter(isImageChatReferenceFile);
  if (route === 'project_files_import') {
    return normalizedFiles.length > 1
      ? 'Importing your files...'
      : 'Importing your file...';
  }
  if (route === 'runtime_asset_upload') {
    return imageFiles.length === normalizedFiles.length &&
      normalizedFiles.length > 0
      ? normalizedFiles.length === 1
        ? 'Uploading your image asset...'
        : 'Uploading your image assets...'
      : normalizedFiles.length > 1
        ? 'Uploading your assets...'
        : 'Uploading your asset...';
  }
  if (route === 'chat_reference') {
    if (
      imageFiles.length === normalizedFiles.length &&
      normalizedFiles.length > 0
    ) {
      return normalizedFiles.length === 1
        ? 'Using your image...'
        : 'Using your images...';
    }
    return 'Using your upload as reference...';
  }
  return 'Checking your upload...';
}

export function buildBuildChatUploadRouteProgressPercent(
  route: BuildChatUploadRoute
) {
  if (route === 'project_files_import') {
    return 28;
  }
  if (route === 'runtime_asset_upload') {
    return 26;
  }
  if (route === 'chat_reference') {
    return 20;
  }
  return 14;
}

export function isImageChatReferenceFile(file: File) {
  const mimeType = String(file?.type || '').toLowerCase();
  if (mimeType.startsWith('image/')) {
    return true;
  }
  const normalizedName = String(file?.name || '').toLowerCase();
  return (
    normalizedName.endsWith('.png') ||
    normalizedName.endsWith('.jpg') ||
    normalizedName.endsWith('.jpeg') ||
    normalizedName.endsWith('.gif') ||
    normalizedName.endsWith('.webp') ||
    normalizedName.endsWith('.bmp') ||
    normalizedName.endsWith('.svg') ||
    normalizedName.endsWith('.avif') ||
    normalizedName.endsWith('.heic') ||
    normalizedName.endsWith('.heif')
  );
}

export function buildImportedProjectFilesNote({
  importedCount,
  warningText
}: {
  importedCount: number;
  warningText?: string;
}) {
  const baseText = `Imported ${importedCount} project file${
    importedCount === 1 ? '' : 's'
  } into the workspace.`;
  return warningText ? `${baseText} ${warningText}` : baseText;
}

export function buildUploadedRuntimeAssetsNote({
  uploadedCount,
  warningText
}: {
  uploadedCount: number;
  warningText?: string;
}) {
  const baseText = `Uploaded ${uploadedCount} asset${
    uploadedCount === 1 ? '' : 's'
  } for this build.`;
  return warningText ? `${baseText} ${warningText}` : baseText;
}

export function buildBuildChatUploadRoutingMessage(
  ...parts: Array<string | undefined>
) {
  return parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

export function buildBuildChatHiddenMessageContext({
  messageText,
  references
}: BuildHiddenMessageContextOptions) {
  const trimmedMessageText = String(messageText || '').trim();
  const normalizedReferences = Array.isArray(references)
    ? references
        .map((reference) => ({
          fileName: String(reference?.fileName || '').trim(),
          url: String(reference?.url || '').trim()
        }))
        .filter((reference) => reference.fileName && reference.url)
    : [];

  const lines = [
    'The user uploaded images or mockups for this request.',
    'Treat them as visual evidence for what is wrong or what should change.',
    'Do not repeat them back as filler, chat clutter, or product UI.'
  ];
  if (trimmedMessageText) {
    lines.push(`User intent: ${trimmedMessageText}`);
  }
  if (normalizedReferences.length > 0) {
    lines.push('Reference image URLs:');
    for (const reference of normalizedReferences.slice(0, 4)) {
      lines.push(`- ${reference.fileName}: ${reference.url}`);
    }
    if (normalizedReferences.length > 4) {
      lines.push(
        `- plus ${normalizedReferences.length - 4} more reference image${
          normalizedReferences.length - 4 === 1 ? '' : 's'
        }`
      );
    }
  }
  return lines.join('\n').slice(0, 1800);
}

function normalizeUploadFiles(files: File[]) {
  return Array.isArray(files)
    ? files.filter((file) => file instanceof File)
    : [];
}
