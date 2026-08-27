export interface PreviewRuntimeUploadAsset {
  id: number;
  buildId: number;
  fileName: string;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number;
  filePath: string;
  url: string;
  thumbUrl: string | null;
  fileType: 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'other';
  mediaKind?: 'file' | 'clip';
  durationMs?: number | null;
  uploadedByUserId: number;
  createdAt: number;
}

export interface PreviewRuntimeUploadUsage {
  totalBytes: number;
  fileCount: number;
  maxRuntimeFileStorageBytes: number;
  remainingBytes: number;
}

export interface PreviewRuntimeUploadsSyncPayload {
  assets: PreviewRuntimeUploadAsset[];
  nextCursor: number | null;
  usage: PreviewRuntimeUploadUsage | null;
}
