export interface BuildProjectFilesSocketUpdate {
  buildId: number;
  build: Record<string, any>;
  projectFiles: Array<{ path: string; content: string }>;
  filesHash: string;
  source: 'contribution_lumine_fix' | 'canonical_refresh';
  eventTimeMs: number;
}

function normalizeProjectFilePath(value: unknown) {
  const trimmed = String(value || '')
    .trim()
    .replace(/\\/g, '/');
  if (!trimmed) return '';
  return (trimmed.startsWith('/') ? trimmed : `/${trimmed}`).replace(
    /\/{2,}/g,
    '/'
  );
}

export function resolveBuildProjectFilesSocketUpdate(
  payload: unknown
): BuildProjectFilesSocketUpdate | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  const update = payload as Record<string, any>;
  const buildId = Number(update.buildId || 0);
  const eventTimeMs = Number(update.eventTimeMs || 0);
  const filesHash = String(update.filesHash || '').trim();
  const build = update.build;
  if (
    !Number.isFinite(buildId) ||
    buildId <= 0 ||
    !Number.isFinite(eventTimeMs) ||
    eventTimeMs <= 0 ||
    !filesHash ||
    (update.source !== 'contribution_lumine_fix' &&
      update.source !== 'canonical_refresh') ||
    !build ||
    typeof build !== 'object' ||
    Array.isArray(build) ||
    Number(build.id || 0) !== Math.floor(buildId) ||
    !Array.isArray(update.projectFiles)
  ) {
    return null;
  }
  const projectFiles = update.projectFiles
    .map((file: any) => {
      if (!file || typeof file !== 'object' || Array.isArray(file)) return null;
      const path = normalizeProjectFilePath(file.path);
      if (!path || typeof file.content !== 'string') return null;
      return { path, content: file.content };
    })
    .filter(
      (file: { path: string; content: string } | null): file is {
        path: string;
        content: string;
      } => Boolean(file)
    );
  if (
    projectFiles.length !== update.projectFiles.length ||
    !projectFiles.some((file) => {
      const path = file.path.toLowerCase();
      return path === '/index.html' || path === '/index.htm';
    })
  ) {
    return null;
  }
  return {
    buildId: Math.floor(buildId),
    build,
    projectFiles,
    filesHash,
    source: update.source,
    eventTimeMs: Math.floor(eventTimeMs)
  };
}

export function applyBuildProjectFilesSocketUpdate({
  currentBuild,
  currentEventTimeMs,
  update
}: {
  currentBuild: Record<string, any> | null;
  currentEventTimeMs: number;
  update: BuildProjectFilesSocketUpdate;
}) {
  const currentArtifactVersionId = Number(
    currentBuild?.currentArtifactVersionId || 0
  );
  const nextArtifactVersionId = Number(
    update.build.currentArtifactVersionId || 0
  );
  const currentUpdatedAt = Number(currentBuild?.updatedAt || 0);
  const nextUpdatedAt = Number(update.build.updatedAt || 0);
  if (
    !currentBuild ||
    Number(currentBuild.id || 0) !== update.buildId ||
    update.eventTimeMs <= Number(currentEventTimeMs || 0) ||
    (currentArtifactVersionId > 0 &&
      nextArtifactVersionId > 0 &&
      nextArtifactVersionId < currentArtifactVersionId) ||
    (currentArtifactVersionId > 0 && nextArtifactVersionId <= 0) ||
    (currentArtifactVersionId <= 0 &&
      nextArtifactVersionId <= 0 &&
      currentUpdatedAt > 0 &&
      nextUpdatedAt > 0 &&
      nextUpdatedAt < currentUpdatedAt)
  ) {
    return {
      build: currentBuild,
      eventTimeMs: Number(currentEventTimeMs || 0)
    };
  }
  const indexEntry = update.projectFiles.find((file) => {
    const path = file.path.toLowerCase();
    return path === '/index.html' || path === '/index.htm';
  });
  if (!indexEntry) {
    return {
      build: currentBuild,
      eventTimeMs: Number(currentEventTimeMs || 0)
    };
  }
  return {
    build: {
      ...currentBuild,
      ...update.build,
      id: update.buildId,
      code: indexEntry.content,
      projectFiles: update.projectFiles,
      projectFilesHash: update.filesHash,
      projectManifest: {
        ...(currentBuild.projectManifest || {}),
        entryPath: indexEntry.path,
        storageMode: 'project-files',
        fileCount: update.projectFiles.length
      }
    },
    eventTimeMs: update.eventTimeMs
  };
}
