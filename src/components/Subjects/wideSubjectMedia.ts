export type WideSubjectMediaDescriptor =
  | {
      kind: 'attachment';
      filePath: string;
    }
  | {
      kind: 'videoRoot';
      rewardLevel: number;
      videoCode: string;
      videoId: number;
    }
  | {
      kind: 'urlRoot';
      actualDescription: string;
      actualTitle: string;
      siteUrl: string;
      thumbUrl: string;
      url: string;
      urlId: number;
    };

export function resolveWideSubjectMedia(
  subject: any
): WideSubjectMediaDescriptor | null {
  const filePath = String(
    subject?.filePath || subject?.actualFilePath || ''
  ).trim();
  if (filePath) {
    return {
      kind: 'attachment',
      filePath
    };
  }

  const root = subject?.rootObj || {};
  const rootId = Math.floor(
    Number(subject?.rootId || root?.id || root?.contentId || 0)
  );
  const rootType = normalizeRootType(
    subject?.rootType || root?.contentType || root?.rootType
  );
  if (!rootId) return null;

  if (rootType === 'video') {
    return {
      kind: 'videoRoot',
      rewardLevel: Number(root?.rewardLevel || 0),
      videoCode: String(root?.content || root?.videoCode || '').trim(),
      videoId: rootId
    };
  }

  if (rootType === 'url') {
    return {
      kind: 'urlRoot',
      actualDescription: String(
        root?.actualDescription || root?.linkDescription || ''
      ).trim(),
      actualTitle: String(
        root?.actualTitle || root?.linkTitle || root?.title || ''
      ).trim(),
      siteUrl: String(root?.siteUrl || root?.linkUrl || '').trim(),
      thumbUrl: String(root?.thumbUrl || root?.thumbnailUrl || '').trim(),
      url: String(root?.content || root?.url || '').trim(),
      urlId: rootId
    };
  }

  return null;
}

function normalizeRootType(value: unknown) {
  const rootType = String(value || '').trim();
  return rootType === 'link' ? 'url' : rootType;
}
