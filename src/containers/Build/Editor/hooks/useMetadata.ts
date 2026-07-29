import {
  useEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import { socket } from '~/constants/sockets/api';
import { returnImageFileFromUrl } from '~/helpers';
import type { PreviewPanelHandle } from '../../PreviewPanel/types';
import {
  canEditBuildProject
} from '../helpers/branches';
import {
  isBuildContributionFork
} from '~/helpers/buildRelationshipHelpers';
import type { ThumbnailOption } from '../ThumbnailModal';
import type {
  Build,
  PendingBranchThumbnailCapture
} from '../types';

const BRANCH_THUMBNAIL_CAPTURE_SETTLE_MS = 1600;

const THUMBNAIL_NUDGE_MODEL_LABELS: Record<string, string> = {
  'gpt-image-2': 'GPT Image 2',
  'gemini-3-pro-image-preview': 'Gemini Image (Nano Banana)'
};

function thumbnailNudgeDismissalKey(buildId: number) {
  return `build-thumbnail-nudge-dismissed:${buildId}`;
}

function readThumbnailNudgeDismissed(buildId: number) {
  try {
    return (
      window.localStorage.getItem(thumbnailNudgeDismissalKey(buildId)) === '1'
    );
  } catch {
    return false;
  }
}

function formatThumbnailNudgeBatteryDetail(energyUnits: number) {
  const percent = (Number(energyUnits) || 0) / 10_000;
  if (percent <= 0) return '';
  return percent < 1 ? '<1% battery' : `~${Math.round(percent)}% battery`;
}

export default function useMetadata({
  applyBuildUpdate,
  build,
  canEditCurrentBuildMetadata,
  canEditCurrentBuildThumbnail,
  generateBuildThumbnail,
  getLatestBuild,
  isOwner,
  loadBuildThumbnailOptions,
  previewPanelRef,
  suggestBuildThumbnailToOwner,
  syncAvailableBranchSummary,
  updateBuildMetadata,
  uploadBuildThumbnail
}: {
  applyBuildUpdate: (build: Build) => void;
  build: Build;
  canEditCurrentBuildMetadata: boolean;
  canEditCurrentBuildThumbnail: boolean;
  generateBuildThumbnail: (options: {
    buildId: number;
    model: string;
    quality?: string;
    prompt?: string;
    estimateOnly?: boolean;
  }) => Promise<any>;
  getLatestBuild: () => Build;
  isOwner: boolean;
  loadBuildThumbnailOptions: (buildId: number) => Promise<any>;
  previewPanelRef: RefObject<PreviewPanelHandle | null>;
  suggestBuildThumbnailToOwner: (options: {
    buildId: number;
    contributionBuildId: number;
  }) => Promise<any>;
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
  const [sendingThumbnailToOwner, setSendingThumbnailToOwner] = useState(false);
  const [thumbnailSentToOwnerAt, setThumbnailSentToOwnerAt] = useState(0);
  // Offering a thumbnail is the branch contributor's move, so the button only
  // exists on a branch, for the person editing it, when somebody else owns the
  // project. Editing rights on this build already mean it is theirs.
  const canSendThumbnailToOwner =
    canEditCurrentBuildThumbnail &&
    Number(build.contributionRootBuildId || 0) > 0 &&
    Number(build.rootBuildUserId || 0) > 0 &&
    Number(build.rootBuildUserId || 0) !==
      Number(build.contributionContributorId || 0);
  const autoBranchThumbnailTimeoutRef = useRef<number | null>(null);
  const autoBranchThumbnailInFlightRef = useRef(false);
  const pendingBranchThumbnailCaptureRef =
    useRef<PendingBranchThumbnailCapture | null>(null);
  const previewCaptureReadyRef = useRef<{
    ready: boolean;
    codeSignature: string | null;
  }>({ ready: false, codeSignature: null });
  const [thumbnailNudgeStage, setThumbnailNudgeStage] = useState<
    'choice' | 'model'
  >('choice');
  const [thumbnailNudgeBusyLabel, setThumbnailNudgeBusyLabel] = useState('');
  const [thumbnailNudgeError, setThumbnailNudgeError] = useState('');
  const [thumbnailNudgeModelOptions, setThumbnailNudgeModelOptions] = useState<
    Array<{ model: string; energyUnits: number }>
  >([]);
  const [thumbnailNudgeDismissed, setThumbnailNudgeDismissed] = useState(() =>
    readThumbnailNudgeDismissed(Number(build.id || 0))
  );

  useEffect(() => {
    savingThumbnailRef.current = savingThumbnail;
  }, [savingThumbnail]);

  useEffect(() => {
    setDescriptionModalShown(false);
    setThumbnailModalShown(false);
    setSavingThumbnail(false);
    setThumbnailSaveError('');
    setThumbnailNudgeStage('choice');
    setThumbnailNudgeBusyLabel('');
    setThumbnailNudgeError('');
    setThumbnailNudgeModelOptions([]);
    setThumbnailNudgeDismissed(
      readThumbnailNudgeDismissed(Number(build.id || 0))
    );
  }, [build.id]);

  useEffect(() => {
    function handleBuildThumbnailUpdated({
      buildId,
      thumbnailUrl,
      updatedAt
    }: {
      buildId?: number;
      thumbnailUrl?: string | null;
      updatedAt?: number;
    }) {
      const latestBuild = getLatestBuild();
      // null/empty means the thumbnail was removed; only an absent field is ignored
      const normalizedThumbnailUrl = String(thumbnailUrl || '').trim() || null;
      if (
        Number(buildId || 0) !== Number(latestBuild.id || 0) ||
        thumbnailUrl === undefined ||
        String(latestBuild.thumbnailUrl || '') === (normalizedThumbnailUrl || '')
      ) {
        return;
      }
      const nextBuild = {
        ...latestBuild,
        thumbnailUrl: normalizedThumbnailUrl,
        ...(Number(updatedAt || 0) > 0 ? { updatedAt: Number(updatedAt) } : {})
      };
      applyBuildUpdate(nextBuild);
      syncAvailableBranchSummary(nextBuild);
    }
    socket.on('build_thumbnail_updated', handleBuildThumbnailUpdated);
    return () => {
      socket.off('build_thumbnail_updated', handleBuildThumbnailUpdated);
    };
    // getLatestBuild/applyBuildUpdate/syncAvailableBranchSummary are stable helpers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // "Sent to owner" belongs to the image it was sent for. A fresh visit to
    // this modal is a fresh decision, so it does not inherit the last one's
    // confirmation.
    setThumbnailSentToOwnerAt(0);
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

  // Save, then offer. In that order and never the other way round: the route
  // reads the branch row rather than anything the client sends, so what the
  // owner is offered is whatever the branch actually ended up holding.
  async function handleSaveThumbnailAndSendToOwner(
    croppedImageUrl: string | null
  ) {
    if (
      !canSendThumbnailToOwner ||
      savingThumbnail ||
      sendingThumbnailToOwner ||
      !croppedImageUrl
    ) {
      return;
    }
    setSendingThumbnailToOwner(true);
    setThumbnailSaveError('');
    try {
      const savedBuild = await persistBuildThumbnailFromDataUrl(
        croppedImageUrl
      );
      const result = await suggestBuildThumbnailToOwner({
        buildId: Number(savedBuild.contributionRootBuildId || 0),
        contributionBuildId: Number(savedBuild.id || 0)
      });
      if (!result?.message) {
        throw new Error('Failed to send the thumbnail to the owner');
      }
      setThumbnailSentToOwnerAt(Date.now());
    } catch (error: any) {
      console.error('Failed to send build thumbnail to owner:', error);
      setThumbnailSaveError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to send the thumbnail to the owner'
      );
    } finally {
      setSendingThumbnailToOwner(false);
    }
  }

  function buildThumbnailNudgePromptForDisplay() {
    if (thumbnailNudgeStage === 'model') {
      return {
        question: 'Which image model should I use for the thumbnail?',
        options: [
          ...thumbnailNudgeModelOptions.map((option) => ({
            key: option.model,
            label:
              THUMBNAIL_NUDGE_MODEL_LABELS[option.model] || option.model,
            detail: formatThumbnailNudgeBatteryDetail(option.energyUnits),
            tone: 'neutral' as const
          })),
          { key: 'back', label: 'Back', tone: 'neutral' as const }
        ],
        busyLabel: thumbnailNudgeBusyLabel || null,
        footnote: thumbnailNudgeError || undefined
      };
    }
    return {
      question:
        "This build doesn't have a thumbnail yet — want to set one up now?",
      options: [
        {
          key: 'capture',
          label: 'Screenshot the app',
          tone: 'positive' as const
        },
        {
          key: 'generate',
          label: 'Generate one with AI',
          detail: 'uses battery',
          tone: 'neutral' as const
        },
        { key: 'dismiss', label: 'Not now', tone: 'neutral' as const }
      ],
      busyLabel: thumbnailNudgeBusyLabel || null,
      footnote: thumbnailNudgeError || undefined
    };
  }

  async function handleThumbnailNudgeSelect(key: string) {
    if (!canEditCurrentBuildThumbnail || thumbnailNudgeBusyLabel) return;
    setThumbnailNudgeError('');
    const latestBuild = getLatestBuild();
    if (thumbnailNudgeStage === 'choice') {
      if (key === 'dismiss') {
        try {
          window.localStorage.setItem(
            thumbnailNudgeDismissalKey(Number(latestBuild.id || 0)),
            '1'
          );
        } catch {
          // localStorage unavailable; session-only dismissal still applies.
        }
        setThumbnailNudgeDismissed(true);
        return;
      }
      if (key === 'capture') {
        setThumbnailNudgeBusyLabel('Capturing the preview...');
        try {
          const capturedImageUrl = await captureThumbnailFromPreview();
          await persistBuildThumbnailFromDataUrl(capturedImageUrl);
        } catch (error: any) {
          console.error('Thumbnail nudge capture failed:', error);
          setThumbnailNudgeError(
            'Preview capture failed — you can set a thumbnail from the settings menu instead.'
          );
        } finally {
          setThumbnailNudgeBusyLabel('');
        }
        return;
      }
      if (key === 'generate') {
        setThumbnailNudgeBusyLabel('Checking battery cost...');
        try {
          const result = await generateBuildThumbnail({
            buildId: Number(latestBuild.id || 0),
            model: 'gpt-image-2',
            estimateOnly: true
          });
          const options = Array.isArray(result?.estimate?.options)
            ? result.estimate.options
            : [];
          if (options.length === 0) {
            throw new Error('No model options returned');
          }
          setThumbnailNudgeModelOptions(options);
          setThumbnailNudgeStage('model');
        } catch (error: any) {
          console.error('Thumbnail nudge estimate failed:', error);
          setThumbnailNudgeError(
            'Could not load image model options. Please try again.'
          );
        } finally {
          setThumbnailNudgeBusyLabel('');
        }
      }
      return;
    }
    if (key === 'back') {
      setThumbnailNudgeStage('choice');
      return;
    }
    setThumbnailNudgeBusyLabel(
      'Generating the thumbnail... this can take a minute.'
    );
    try {
      const result = await generateBuildThumbnail({
        buildId: Number(latestBuild.id || 0),
        model: key
      });
      if (!result?.success || !result?.build) {
        throw new Error(result?.error || 'Thumbnail generation failed');
      }
      const nextBuild = {
        ...getLatestBuild(),
        ...result.build
      };
      applyBuildUpdate(nextBuild);
      syncAvailableBranchSummary(nextBuild);
      setThumbnailNudgeStage('choice');
    } catch (error: any) {
      console.error('Thumbnail nudge generation failed:', error);
      setThumbnailNudgeError(
        String(error?.message || '').trim() ||
          'Thumbnail generation failed. Please try again.'
      );
    } finally {
      setThumbnailNudgeBusyLabel('');
    }
  }

  return {
    buildThumbnailNudgePromptForDisplay,
    canSendThumbnailToOwner,
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
    handleSaveThumbnailAndSendToOwner,
    handleThumbnailNudgeSelect,
    sendingThumbnailToOwner,
    thumbnailSentToOwnerAt,
    maybeAutoCaptureBranchThumbnailAfterProgressSave,
    savingDescription,
    savingThumbnail,
    thumbnailModalShown,
    thumbnailNudgeBusyLabel,
    thumbnailNudgeDismissed,
    thumbnailOptions,
    thumbnailOptionsLoading,
    thumbnailSaveError
  };
}
