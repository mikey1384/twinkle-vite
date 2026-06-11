export const LEGACY_THREE_VENDOR_PREFIX = '/build/vendor/three/0.160.0/';
export const CURRENT_THREE_VENDOR_PREFIX = '/build/vendor/three/0.184.0/';
export const CURRENT_THREE_VENDOR_VERSION_LABEL = '0.184';

interface ProjectFileLike {
  path?: string;
  content?: string;
}

export function getLegacyThreeVendorPaths(
  projectFiles: ProjectFileLike[] | null | undefined
): string[] {
  if (!Array.isArray(projectFiles)) return [];
  const paths: string[] = [];
  for (const file of projectFiles) {
    const path = String(file?.path || '').trim();
    const content = String(file?.content || '');
    if (path && content.includes(LEGACY_THREE_VENDOR_PREFIX)) {
      paths.push(path);
    }
  }
  return paths;
}
