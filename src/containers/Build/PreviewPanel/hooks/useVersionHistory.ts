import {
  useEffect,
  useState,
  type RefObject
} from 'react';
import {
  buildEditableProjectFiles,
  getPreferredIndexPath
} from '../helpers/projectFiles';
import type {
  ArtifactVersion,
  Build,
  EditableProjectFile
} from '../types';

export default function useVersionHistory({
  build,
  buildRef,
  isOwnerRef,
  listBuildArtifactsRef,
  listBuildArtifactVersionsRef,
  onApplyRestoredProjectFiles,
  onReplaceCode,
  restoreBuildArtifactVersionRef,
  setActiveFilePath,
  setEditableProjectFiles,
  setHasLocalEditableProjectFileChanges,
  setProjectFileError
}: {
  build: Build;
  buildRef: RefObject<Build>;
  isOwnerRef: RefObject<boolean>;
  listBuildArtifactsRef: RefObject<(...args: any[]) => Promise<any>>;
  listBuildArtifactVersionsRef: RefObject<(...args: any[]) => Promise<any>>;
  onApplyRestoredProjectFiles: (
    projectFiles: any[],
    code: string | null,
    options: Record<string, any>
  ) => void;
  onReplaceCode: (code: string) => void;
  restoreBuildArtifactVersionRef: RefObject<(...args: any[]) => Promise<any>>;
  setActiveFilePath: (path: string) => void;
  setEditableProjectFiles: (files: EditableProjectFile[]) => void;
  setHasLocalEditableProjectFileChanges: (value: boolean) => void;
  setProjectFileError: (message: string) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(
    null
  );
  const [artifactId, setArtifactId] = useState<number | null>(
    build.primaryArtifactId ?? null
  );

  useEffect(() => {
    setArtifactId(build.primaryArtifactId ?? null);
  }, [build.primaryArtifactId]);

  useEffect(() => {
    if (historyOpen) {
      void loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, artifactId, build.currentArtifactVersionId]);

  async function loadVersions() {
    if (!isOwnerRef.current) {
      setVersions([]);
      return;
    }
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setLoadingVersions(true);
    try {
      let activeArtifactId = artifactId;
      if (!activeArtifactId) {
        const artifactsData = await listBuildArtifactsRef.current(
          activeBuild.id
        );
        activeArtifactId = artifactsData?.artifacts?.[0]?.id ?? null;
        if (activeArtifactId) {
          setArtifactId(activeArtifactId);
        }
      }

      if (!activeArtifactId) {
        setVersions([]);
        return;
      }

      const data = await listBuildArtifactVersionsRef.current({
        buildId: activeBuild.id,
        artifactId: activeArtifactId,
        limit: 50
      });
      setVersions(data?.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  }

  async function handleRestoreVersion(versionId: number) {
    if (!isOwnerRef.current || !artifactId || restoringVersionId) return;
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setRestoringVersionId(versionId);
    try {
      const result = await restoreBuildArtifactVersionRef.current({
        buildId: activeBuild.id,
        artifactId,
        versionId
      });
      const restoredProjectFiles = Array.isArray(result?.projectFiles)
        ? result.projectFiles
        : [];
      if (restoredProjectFiles.length > 0) {
        const restoredCode =
          typeof result?.code === 'string' ? result.code : null;
        onApplyRestoredProjectFiles(restoredProjectFiles, restoredCode, {
          artifactVersionId: result?.versionId ?? versionId,
          primaryArtifactId: artifactId,
          contributionStatus: result?.contributionStatus
        });
        const restoredEditableFiles = buildEditableProjectFiles({
          code: restoredCode,
          projectFiles: restoredProjectFiles
        });
        setEditableProjectFiles(restoredEditableFiles);
        setHasLocalEditableProjectFileChanges(false);
        setActiveFilePath(
          getPreferredIndexPath(restoredEditableFiles) ||
            restoredEditableFiles[0]?.path ||
            '/index.html'
        );
        setProjectFileError('');
      } else if (result?.code) {
        onReplaceCode(result.code);
      }
      if (historyOpen) {
        await loadVersions();
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
    setRestoringVersionId(null);
  }

  return {
    historyOpen,
    loadingVersions,
    restoringVersionId,
    setHistoryOpen,
    versions,
    handleRestoreVersion
  };
}
