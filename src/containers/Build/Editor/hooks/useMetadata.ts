import {
  useEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import { returnImageFileFromUrl } from '~/helpers';
import type { PreviewPanelHandle } from '../../PreviewPanel/types';
import {
  canEditBuildProject
} from '../domain/branches';
import {
  isBuildContributionFork
} from '~/domains/Build/shared/domain/relationshipLabels';
import type { ThumbnailOption } from '../ThumbnailModal';
import type {
  Build,
  PendingBranchThumbnailCapture
} from '../types';

const BRANCH_THUMBNAIL_CAPTURE_SETTLE_MS = 1600;

export default function useMetadata({
  applyBuildUpdate,
  build,
  canEditCurrentBuildMetadata,
  canEditCurrentBuildThumbnail,
  getLatestBuild,
  isOwner,
  loadBuildThumbnailOptions,
  previewPanelRef,
  syncAvailableBranchSummary,
  updateBuildMetadata,
  uploadBuildThumbnail
}: {
  applyBuildUpdate: (build: Build) => void;
  build: Build;
  canEditCurrentBuildMetadata: boolean;
  canEditCurrentBuildThumbnail: boolean;
  getLatestBuild: () => Build;
  isOwner: boolean;
  loadBuildThumbnailOptions: (buildId: number) => Promise<any>;
  previewPanelRef: RefObject<PreviewPanelHandle | null>;
  syncAvailableBranchSummary: (nextBuild: Build) => void;
  updateBuildMetadata: (options: Record<string, any>) => Promise<any>;
  uploadBuildThumbnail: (options: {
    buildId: number;
    file: File;
  }) => Promise<any>;
}) {
  const [descriptionModalShown, setDescriptionModalShown] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [thumbnailModalShown, setThumbnailModalShown] = useState(false);
  const [savingThumbnail, setSavingThumbnail] = useState(false);
  const savingThumbnailRef = useRef(false);
  const [thumbnailOptions, setThumbnailOptions] = useState<
    ThumbnailOption[]
  >([]);
  const [thumbnailOptionsLoading, setThumbnailOptionsLoading] = useState(false);
  const [thumbnailSaveError, setThumbnailSaveError] = useState('');
  const autoBranchThumbnailTimeoutRef = useRef<number | null>(null);
  const autoBranchThumbnailInFlightRef = useRef(false);
  const pendingBranchThumbnailCaptureRef =
    useRef<PendingBranchThumbnailCapture | null>(null);
  const previewCaptureReadyRef = useRef<{
    ready: boolean;
    codeSignature: string | null;
  }>({ ready: false, codeSignature: null });

  useEffect(() => {
    savingThumbnailRef.current = savingThumbnail;
  }, [savingThumbnail]);

  useEffect(() => {
    setDescriptionModalShown(false);
    setThumbnailModalShown(false);
    setSavingThumbnail(false);
    setThumbnailSaveError('');
  }, [build.id]);

  useEffect(() => {
    return () => {
      if (autoBranchThumbnailTimeoutRef.current !== null) {
        window.clearTimeout(autoBranchThumbnailTimeoutRef.current);
        autoBranchThumbnailTimeoutRef.current = null;
      }
      pendingBranchThumbnailCaptureRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!thumbnailModalShown || !canEditCurrentBuildThumbnail || !build.id) {
      setThumbnailOptions([]);
      setThumbnailOptionsLoading(false);
      return;
    }
    let canceled = false;
    setThumbnailOptionsLoading(true);
    loadBuildThumbnailOptions(build.id)
      .then((result: any) => {
        if (canceled) return;
        setThumbnailOptions(
          Array.isArray(result?.thumbnailOptions)
            ? result.thumbnailOptions
            : []
        );
      })
      .catch((error: any) => {
        if (canceled) return;
        console.error('Failed to load build thumbnail options:', error);
        setThumbnailOptions([]);
      })
      .finally(() => {
        if (!canceled) {
          setThumbnailOptionsLoading(false);
        }
      });
    return () => {
      canceled = true;
    };
    // loadBuildThumbnailOptions is a stable context request helper.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, canEditCurrentBuildThumbnail, thumbnailModalShown]);

  function handleOpenDescriptionModal() {
    if (!canEditCurrentBuildMetadata) return;
    setDescriptionModalShown(true);
  }

  function handleCloseDescriptionModal() {
    if (savingDescription) return;
    setDescriptionModalShown(false);
  }

  function handleOpenThumbnailModal() {
    if (!canEditCurrentBuildThumbnail) return;
    setThumbnailSaveError('');
    setThumbnailModalShown(true);
  }

  function handleCloseThumbnailModal() {
    if (savingThumbnail) return;
    setThumbnailSaveError('');
    setThumbnailModalShown(false);
  }

  async function handleSaveMetadata({
    title,
    description
  }: {
    title: string;
    description: string;
  }) {
    if (!canEditCurrentBuildMetadata || savingDescription) return;
    const latestBuild = getLatestBuild();
    const nextTitle = title.trim();
    const nextDescription = description.trim();
    if (
      (latestBuild.title || '').trim() === nextTitle &&
      (latestBuild.description || '').trim() === nextDescription
    ) {
      setDescriptionModalShown(false);
      return;
    }
    setSavingDescription(true);
    try {
      const result = await updateBuildMetadata({
        buildId: latestBuild.id,
        title: nextTitle,
        description: nextDescription
      });
      if (result?.success && result?.build) {
        const nextBuild = {
          ...latestBuild,
          ...result.build
        };
        applyBuildUpdate(nextBuild);
        setDescriptionModalShown(false);
      }
    } catch (error) {
      console.error('Failed to update build metadata:', error);
    } finally {
      setSavingDescription(false);
    }
  }

  async function captureThumbnailFromPreview() {
    const previewPanel = previewPanelRef.current;
    if (!previewPanel) {
      throw new Error('Preview is unavailable right now');
    }
    return await previewPanel.captureThumbnail();
  }

  async function persistBuildThumbnailFromDataUrl(imageUrl: string) {
    const latestBuild = getLatestBuild();
    const file = returnImageFileFromUrl({
      imageUrl,
      fileName: `build-thumbnail-${latestBuild.id}.jpg`
    });
    const result = await uploadBuildThumbnail({
      buildId: latestBuild.id,
      file
    });
    if (!result?.success || !result?.build) {
      throw new Error('Failed to save build thumbnail');
    }
    const nextBuild = {
      ...latestBuild,
      ...result.build
    };
    applyBuildUpdate(nextBuild);
    syncAvailableBranchSummary(nextBuild);
    return nextBuild;
  }

  async function ensureBuildThumbnailBeforePublish() {
    const latestBuild = getLatestBuild();
    if (String(latestBuild.thumbnailUrl || '').trim()) {
      return latestBuild;
    }
    const capturedImageUrl = await captureThumbnailFromPreview();
    return await persistBuildThumbnailFromDataUrl(capturedImageUrl);
  }

  function maybeAutoCaptureBranchThumbnailAfterProgressSave(
    savedBuild: Build | null | undefined
  ) {
    if (!savedBuild || !isBuildContributionFork(savedBuild)) return;
    if (!isOwner || !canEditBuildProject(savedBuild)) return;
    const savedBuildId = Number(savedBuild.id || 0);
    if (!savedBuildId) return;
    if (buildHasOwnedThumbnail(savedBuild)) {
      if (
        Number(pendingBranchThumbnailCaptureRef.current?.buildId || 0) ===
        savedBuildId
      ) {
        pendingBranchThumbnailCaptureRef.current = null;
        if (autoBranchThumbnailTimeoutRef.current !== null) {
          window.clearTimeout(autoBranchThumbnailTimeoutRef.current);
          autoBranchThumbnailTimeoutRef.current = null;
        }
      }
      return;
    }
    const savedArtifactVersionId = Number(
      savedBuild.currentArtifactVersionId || 0
    );
    if (!savedArtifactVersionId) return;
    pendingBranchThumbnailCaptureRef.current = {
      buildId: savedBuildId,
      artifactVersionId: savedArtifactVersionId,
      codeSignature: `artifact:${savedArtifactVersionId}`
    };
    if (autoBranchThumbnailTimeoutRef.current !== null) {
      window.clearTimeout(autoBranchThumbnailTimeoutRef.current);
      autoBranchThumbnailTimeoutRef.current = null;
    }
    schedulePendingBranchThumbnailCaptureIfReady();
  }

  function handlePreviewCaptureReadyChange(
    ready: boolean,
    payload: { codeSignature: string | null; previewSrc: string | null }
  ) {
    previewCaptureReadyRef.current = {
      ready,
      codeSignature: payload?.codeSignature || null
    };
    if (!ready && autoBranchThumbnailTimeoutRef.current !== null) {
      window.clearTimeout(autoBranchThumbnailTimeoutRef.current);
      autoBranchThumbnailTimeoutRef.current = null;
      return;
    }
    schedulePendingBranchThumbnailCaptureIfReady();
  }

  function schedulePendingBranchThumbnailCaptureIfReady() {
    const pendingCapture = pendingBranchThumbnailCaptureRef.current;
    if (!pendingCapture) return;
    const previewReady = previewCaptureReadyRef.current;
    if (
      !previewReady.ready ||
      previewReady.codeSignature !== pendingCapture.codeSignature
    ) {
      return;
    }
    if (autoBranchThumbnailTimeoutRef.current !== null) return;
    autoBranchThumbnailTimeoutRef.current = window.setTimeout(async () => {
      autoBranchThumbnailTimeoutRef.current = null;
      const pendingCapture = pendingBranchThumbnailCaptureRef.current;
      if (!pendingCapture) return;
      const previewReady = previewCaptureReadyRef.current;
      if (
        !previewReady.ready ||
        previewReady.codeSignature !== pendingCapture.codeSignature
      ) {
        return;
      }
      if (
        autoBranchThumbnailInFlightRef.current ||
        savingThumbnailRef.current
      ) {
        schedulePendingBranchThumbnailCaptureIfReady();
        return;
      }
      const latestBuild = getLatestBuild();
      if (Number(latestBuild?.id || 0) !== pendingCapture.buildId) {
        pendingBranchThumbnailCaptureRef.current = null;
        return;
      }
      if (!isBuildContributionFork(latestBuild)) {
        pendingBranchThumbnailCaptureRef.current = null;
        return;
      }
      if (!canEditBuildProject(latestBuild)) {
        pendingBranchThumbnailCaptureRef.current = null;
        return;
      }
      if (buildHasOwnedThumbnail(latestBuild)) {
        pendingBranchThumbnailCaptureRef.current = null;
        return;
      }
      if (
        Number(latestBuild.currentArtifactVersionId || 0) !==
        pendingCapture.artifactVersionId
      ) {
        pendingBranchThumbnailCaptureRef.current = null;
        return;
      }
      autoBranchThumbnailInFlightRef.current = true;
      try {
        const capturedImageUrl = await captureThumbnailFromPreview();
        await persistBuildThumbnailFromDataUrl(capturedImageUrl);
        if (pendingBranchThumbnailCaptureRef.current === pendingCapture) {
          pendingBranchThumbnailCaptureRef.current = null;
        }
      } catch (error) {
        console.warn('Failed to auto-save branch thumbnail:', error);
      } finally {
        autoBranchThumbnailInFlightRef.current = false;
      }
    }, BRANCH_THUMBNAIL_CAPTURE_SETTLE_MS);
  }

  function buildHasOwnedThumbnail(candidate: Build | null | undefined) {
    const thumbnailUrl = String(candidate?.thumbnailUrl || '').trim();
    const buildId = Number(candidate?.id || 0);
    const userId = Number(candidate?.userId || 0);
    if (!thumbnailUrl || !buildId || !userId) return false;
    return thumbnailUrl.includes(`/thumbs/builds/${userId}/${buildId}/`);
  }

  async function handleSaveThumbnail(croppedImageUrl: string | null) {
    if (!canEditCurrentBuildThumbnail || savingThumbnail) return;
    const latestBuild = getLatestBuild();
    const currentThumbnailUrl = String(latestBuild.thumbnailUrl || '').trim();
    if (!croppedImageUrl && !currentThumbnailUrl) {
      setThumbnailSaveError('');
      setThumbnailModalShown(false);
      return;
    }
    setSavingThumbnail(true);
    setThumbnailSaveError('');
    try {
      if (!croppedImageUrl) {
        const result = await updateBuildMetadata({
          buildId: latestBuild.id,
          thumbnailUrl: null
        });
        if (!result?.success || !result?.build) {
          throw new Error('Failed to remove build thumbnail');
        }
        const nextBuild = {
          ...latestBuild,
          ...result.build
        };
        applyBuildUpdate(nextBuild);
        syncAvailableBranchSummary(nextBuild);
      } else {
        await persistBuildThumbnailFromDataUrl(croppedImageUrl);
      }
      setThumbnailModalShown(false);
    } catch (error: any) {
      console.error('Failed to save build thumbnail:', error);
      setThumbnailSaveError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save build thumbnail'
      );
    } finally {
      setSavingThumbnail(false);
    }
  }

  return {
    captureThumbnailFromPreview,
    descriptionModalShown,
    ensureBuildThumbnailBeforePublish,
    handleCloseDescriptionModal,
    handleCloseThumbnailModal,
    handleOpenDescriptionModal,
    handleOpenThumbnailModal,
    handlePreviewCaptureReadyChange,
    handleSaveMetadata,
    handleSaveThumbnail,
    maybeAutoCaptureBranchThumbnailAfterProgressSave,
    savingDescription,
    savingThumbnail,
    thumbnailModalShown,
    thumbnailOptions,
    thumbnailOptionsLoading,
    thumbnailSaveError
  };
}
