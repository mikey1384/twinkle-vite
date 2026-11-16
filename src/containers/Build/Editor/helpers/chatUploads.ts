export const LUMINE_MESSAGE_MAX_CHARS = 50_000;
import type {
  BuildChatUploadHandling,
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
  handling: BuildChatUploadHandling,
  files: File[]
) {
  const normalizedFiles = normalizeUploadFiles(files);
  if (handling === 'reference_document') {
    return normalizedFiles.length === 1
      ? 'Reading your document...'
      : 'Reading your documents...';
  }
  if (handling === 'attachments') {
    return normalizedFiles.length === 1
      ? 'Sending your file to Lumine...'
      : 'Sending your files to Lumine...';
  }
  return 'Checking your upload...';
}

export function buildBuildChatUploadRouteProgressPercent(
  handling: BuildChatUploadHandling
) {
  if (handling === 'attachments') {
    return 20;
  }
  if (handling === 'reference_document') {
    return 22;
  }
  return 14;
}

const REFERENCE_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.txt',
  '.md',
  '.markdown',
  '.csv',
  '.tsv',
  '.json',
  '.html',
  '.htm',
  '.xml',
  '.yml',
  '.yaml',
  '.rtf',
  // Code files are read as text; Lumine writes them into the project with
  // its own edit tools when the member wants them there.
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.vue',
  '.svelte'
];

const CODE_FILE_EXTENSIONS = [
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.vue',
  '.svelte'
];

// Code files often arrive with a non-text type (or none); reference documents
// read them as plain text.
export function getReferenceDocumentUploadMimeType(file?: File | null) {
  const mimeType = String(file?.type || '').trim();
  const normalizedName = String(file?.name || '').toLowerCase();
  if (
    CODE_FILE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
  ) {
    return mimeType.startsWith('text/') ? mimeType : 'text/plain';
  }
  return mimeType || null;
}

const AUDIO_FILE_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
  '.aac',
  '.flac',
  '.aif',
  '.aiff'
];

export function isAudioChatAttachmentFile(file: File) {
  const mimeType = String(file?.type || '').toLowerCase();
  if (mimeType.startsWith('audio/')) return true;
  if (mimeType) return false;
  const normalizedName = String(file?.name || '').toLowerCase();
  return AUDIO_FILE_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension)
  );
}

export function isReferenceDocumentChatFile(file: File) {
  const mimeType = String(file?.type || '').toLowerCase();
  if (
    mimeType === 'application/pdf' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType.startsWith('text/')
  ) {
    return true;
  }
  const normalizedName = String(file?.name || '').toLowerCase();
  return REFERENCE_DOCUMENT_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension)
  );
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
    'The creator attached files with this request.',
    'Use their words and the conversation to decide whether a file belongs inside the app (add_attachment_to_app) or only shows what to build or fix (view_reference_image).'
  ];
  if (trimmedMessageText) {
    lines.push(`User intent: ${trimmedMessageText.slice(0, 600)}`);
  }
  if (normalizedReferences.length > 0) {
    lines.push('Attached files:');
    for (const reference of normalizedReferences.slice(0, 8)) {
      lines.push(`- ${reference.fileName}: ${reference.url}`);
    }
    if (normalizedReferences.length > 8) {
      lines.push(
        `- plus ${normalizedReferences.length - 8} more file${
          normalizedReferences.length - 8 === 1 ? '' : 's'
        }`
      );
    }
  }
  return lines.join('\n');
}

function normalizeUploadFiles(files: File[]) {
  return Array.isArray(files)
    ? files.filter((file) => file instanceof File)
    : [];
}
