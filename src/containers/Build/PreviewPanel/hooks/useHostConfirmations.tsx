import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { getImageModelLabel } from '~/helpers/aiImageModels';
import { useAppContext } from '~/contexts';
import useConfirmModal from '~/components/Modals/hooks/useConfirmModal';
import useCoinConfirm from '~/components/Build/Coins/useCoinConfirm';
import type { CoinConfirmRequest } from '~/components/Build/Coins/coinConfirmText';
import useAppLinkConfirm, {
  type AppLinkRequest,
  type AppLinkResult
} from '~/components/Build/AppLink/useAppLinkConfirm';
import { SITE_NAME } from '~/constants/siteBrand';
import type {
  BuildCardCraftSelectionRequest,
  BuildLiveSafetyHostSession,
  BuildLiveSafetyStopRequest,
  BuildMediaActionConfirmationRequest
} from '../types/previewHostBridgeTypes';
import type {
  BuildRuntimeImageGenerationConfirmationRequest,
  BuildRuntimeMusicGenerationConfirmationRequest
} from '../helpers/buildRuntimeImageGeneration';
import CardCraftModal from '../CardCraftModal';

const imageGenerationConfirmationClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 100%;
  text-align: left;
`;

const imageGenerationPromptClass = css`
  max-width: 100%;
  max-height: 12rem;
  overflow: auto;
  overflow-wrap: anywhere;
  padding: 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #f8fafc;
  font-size: 1.1rem;
`;

// Twinkle's own confirmation boxes for a running app (image and music
// generation, media actions, Coins, outside links, card crafting, live
// safety), shared by the twin-kle.com app frame (PreviewPanel) and the
// lumine.app lite host, so both ask the member the same way. Moved verbatim
// out of PreviewPanel/index.tsx.
export default function useHostConfirmations({
  build,
  keyUserId,
  previewRootRef
}: {
  build: any;
  keyUserId: number | null | undefined;
  previewRootRef: React.RefObject<HTMLDivElement | null>;
}) {
  const {
    confirmModal: imageGenerationConfirmModal,
    requestConfirm: requestImageGenerationConfirm
  } = useConfirmModal();
  const {
    confirmModal: musicGenerationConfirmModal,
    requestConfirm: requestMusicGenerationConfirm
  } = useConfirmModal();
  const {
    confirmModal: mediaActionConfirmModal,
    requestConfirm: requestMediaActionConfirm
  } = useConfirmModal();
  const [
    activeBuildLiveSafetyHostSessions,
    setActiveBuildLiveSafetyHostSessions
  ] = useState<BuildLiveSafetyHostSession[]>([]);
  const requestBuildLiveSafetyStopRef = useRef<
    ((request: BuildLiveSafetyStopRequest) => Promise<void>) | null
  >(null);
  const loadImageEstimate = useAppContext(
    (v) => v.requestHelpers.loadAIImageGenerationEstimate
  );
  const loadImageEstimateRef = useRef(loadImageEstimate);
  loadImageEstimateRef.current = loadImageEstimate;
  const requestBuildImageGenerationConfirmationRef = useRef<
    | ((
        request: BuildRuntimeImageGenerationConfirmationRequest
      ) => Promise<boolean>)
    | null
  >(null);
  useEffect(() => {
    requestBuildImageGenerationConfirmationRef.current = async ({
      prompt,
      engine,
      model,
      quality
    }) => {
      let estimatePercent: number | null = null;
      if (engine === 'openai' && model) {
        try {
          const estimate = await loadImageEstimateRef.current({
            model,
            quality
          });
          if (estimate.fullBatteryUnits > 0 && estimate.energyUnits >= 0)
            estimatePercent =
              (estimate.energyUnits / estimate.fullBatteryUnits) * 100;
        } catch {
          /* Confirmation can still explain that the estimate is unavailable. */
        }
      }
      return requestImageGenerationConfirm({
        title: 'Generate an image with AI Energy?',
        description: (
          <span className={imageGenerationConfirmationClass}>
            <span>
              <strong>{build.title || 'This Build app'}</strong> wants to
              generate an image using your AI Energy.
            </span>
            <span className={imageGenerationPromptClass}>
              <strong>Prompt:</strong> {prompt || '(empty prompt)'}
            </span>
            <span>
              Model:{' '}
              {engine === 'gemini'
                ? 'Nano Banana 2.1'
                : getImageModelLabel(model)}
              {engine === 'openai' ? `, ${quality} quality` : ''}. Each
              approval authorizes one generation.
            </span>
            <span>
              {estimatePercent !== null
                ? `Image estimate: ${estimatePercent < 1 ? '<1' : `~${Math.round(estimatePercent)}`}% of a full battery. Your prompt and reference image use additional energy.`
                : 'Final battery spending follows actual image usage.'}
            </span>
          </span>
        ),
        descriptionFontSize: '1.1rem',
        confirmButtonLabel: 'Generate image',
        modalOverModal: true
      });
    };
    return () => {
      requestBuildImageGenerationConfirmationRef.current = null;
    };
  }, [build.title, requestImageGenerationConfirm]);
  const loadMusicEstimate = useAppContext(
    (v) => v.requestHelpers.loadBuildRuntimeAiMusicEstimate
  );
  const loadMusicEstimateRef = useRef(loadMusicEstimate);
  loadMusicEstimateRef.current = loadMusicEstimate;
  const requestBuildMusicGenerationConfirmationRef = useRef<
    | ((
        request: BuildRuntimeMusicGenerationConfirmationRequest
      ) => Promise<boolean>)
    | null
  >(null);
  useEffect(() => {
    requestBuildMusicGenerationConfirmationRef.current = async ({
      prompt,
      length,
      instrumental
    }) => {
      let estimatePercent: number | null = null;
      let modelLabel = length === 'clip' ? 'Lyria 3 Clip' : 'Lyria 3.5';
      try {
        const estimate = await loadMusicEstimateRef.current({
          buildId: build.id,
          length
        });
        modelLabel = estimate.label || modelLabel;
        if (estimate.fullBatteryUnits > 0 && estimate.energyUnits >= 0)
          estimatePercent =
            (estimate.energyUnits / estimate.fullBatteryUnits) * 100;
      } catch {
        /* The confirmation still explains what is being generated. */
      }
      return requestMusicGenerationConfirm({
        title: 'Make music with AI Energy?',
        description: (
          <span className={imageGenerationConfirmationClass}>
            <span>
              <strong>{build.title || 'This Build app'}</strong> wants to
              make music using your AI Energy.
            </span>
            <span className={imageGenerationPromptClass}>
              <strong>Music:</strong> {prompt || '(empty description)'}
            </span>
            <span>
              {modelLabel}:{' '}
              {length === 'clip' ? 'a 30-second clip' : 'a full song'}
              {instrumental ? ', instrumental' : ''}. The music is saved to
              your files. Each approval makes one piece.
            </span>
            <span>
              {estimatePercent !== null
                ? `Cost: about ${estimatePercent < 1 ? '<1' : Math.round(estimatePercent)}% of a full battery, only if the music is made.`
                : 'Battery is used only if the music is made.'}
            </span>
          </span>
        ),
        descriptionFontSize: '1.1rem',
        confirmButtonLabel: length === 'clip' ? 'Make clip' : 'Make song',
        modalOverModal: true
      });
    };
    return () => {
      requestBuildMusicGenerationConfirmationRef.current = null;
    };
  }, [build.id, build.title, requestMusicGenerationConfirm]);
  // The app frame is inert while Twinkle's Coins box is open.
  const { coinConfirmModal, requestCoinConfirm } = useCoinConfirm({
    frameRootRef: previewRootRef
  });
  const requestBuildCoinConfirmationRef = useRef<
    ((request: CoinConfirmRequest) => Promise<boolean>) | null
  >(null);
  requestBuildCoinConfirmationRef.current = requestCoinConfirm;
  // Twinkle.app.openLink: "Open example.com?" outside the app frame.
  const { appLinkModal, handleAppLinkRequest } = useAppLinkConfirm({
    buildId: build.id,
    signedIn: Number(keyUserId || 0) > 0,
    frameRootRef: previewRootRef
  });
  const requestBuildAppLinkRef = useRef<
    ((request: AppLinkRequest) => Promise<AppLinkResult>) | null
  >(null);
  requestBuildAppLinkRef.current = handleAppLinkRequest;
  const requestBuildMediaActionConfirmationRef = useRef<
    | ((request: BuildMediaActionConfirmationRequest) => Promise<boolean>)
    | null
  >(null);
  useEffect(() => {
    requestBuildMediaActionConfirmationRef.current = ({
      kind,
      audio,
      saveReplay
    }) => {
      const appTitle = build.title || 'This Build app';
      const confirmation =
        kind === 'photo'
          ? {
              title: 'Allow camera use?',
              description: 'use your camera to take one photo',
              detail:
                `Nothing starts unless you approve. The photo is saved in your ${SITE_NAME} file storage so this app can use it. Your browser may also ask for camera permission.`,
              confirmButtonLabel: 'Take photo'
            }
          : kind === 'clip'
            ? {
                title: 'Allow camera use?',
                description:
                  'use your camera to record one short, camera-only clip',
                detail:
                  `Nothing starts unless you approve. The clip is saved in your ${SITE_NAME} file storage so this app can use it. Your browser may also ask for camera permission. Processing uses Media Energy.`,
                confirmButtonLabel: 'Record clip'
              }
            : kind === 'clip-upload'
              ? {
                  title: 'Use Media Energy?',
                  description: 'process and save one short video',
                  detail:
                    `Each approval authorizes one video saved in your ${SITE_NAME} file storage so this app can use it. Processing uses Media Energy.`,
                  confirmButtonLabel: 'Process video'
                }
              : kind === 'live'
                ? {
                    title: 'Allow camera use?',
                    description: `start a livestream using your camera${
                      audio ? ' and microphone' : ''
                    }`,
                    detail: `Nothing starts unless you approve. Livestreams last up to 15 minutes and use Media Energy.${
                      saveReplay
                        ? ' This stream will also be saved for this app as a replay for seven days. Replay storage and viewing use Media Energy; its creator or the app owner can remove it.'
                        : ''
                    } Your browser may also ask for ${
                      audio
                        ? 'camera and microphone permissions.'
                        : 'camera permission.'
                    }`,
                    confirmButtonLabel: 'Start livestream'
                  }
                : kind === 'live-watch'
                  ? {
                      title: 'Watch livestream?',
                      description: 'join one livestream',
                      detail:
                        'Each approval authorizes one viewer spot and uses Media Energy.',
                      confirmButtonLabel: 'Watch livestream'
                    }
                  : kind === 'replay-watch'
                      ? {
                          title: 'Watch replay?',
                          description: 'play one saved livestream',
                          detail:
                            'Each approval opens one private playback grant for up to 20 minutes and uses Media Energy.',
                          confirmButtonLabel: 'Watch replay'
                        }
                      : {
                          title: 'Remove replay?',
                          description:
                            'permanently remove this saved livestream',
                          detail:
                            `Only the replay creator or app owner can do this. ${SITE_NAME} will delete the private recording; this cannot be undone.`,
                          confirmButtonLabel: 'Remove replay'
                        };
      return requestMediaActionConfirm({
        title: confirmation.title,
        description: (
          <span className={imageGenerationConfirmationClass}>
            <span>
              <strong>{appTitle}</strong> wants to {confirmation.description}.
            </span>
            <span>{confirmation.detail}</span>
          </span>
        ),
        descriptionFontSize: '1.1rem',
        confirmButtonLabel: confirmation.confirmButtonLabel,
        modalOverModal: true
      });
    };
    return () => {
      requestBuildMediaActionConfirmationRef.current = null;
    };
  }, [build.title, requestMediaActionConfirm]);
  const [cardCraftSelection, setCardCraftSelection] = useState<
    | (BuildCardCraftSelectionRequest & {
        resolve: (cardId: number | null) => void;
      })
    | null
  >(null);
  const requestCardCraftSelectionRef = useRef<
    | ((request: BuildCardCraftSelectionRequest) => Promise<number | null>)
    | null
  >(null);
  useEffect(() => {
    let pending: ((cardId: number | null) => void) | null = null;
    requestCardCraftSelectionRef.current = (request) =>
      new Promise<number | null>((resolve) => {
        pending = resolve;
        setCardCraftSelection({ ...request, resolve });
      });
    return () => {
      requestCardCraftSelectionRef.current = null;
      // Leaving the app cancels an open crafting confirmation.
      pending?.(null);
      setCardCraftSelection(null);
    };
  }, []);
  const hostConfirmationModals = (
    <>
    {imageGenerationConfirmModal}
    {musicGenerationConfirmModal}
    {mediaActionConfirmModal}
    {coinConfirmModal}
    {appLinkModal}
    {cardCraftSelection ? (
      <CardCraftModal
        key={`${cardCraftSelection.mode}:${cardCraftSelection.cardId || 'pick'}`}
        request={cardCraftSelection}
        onDone={(cardId) => {
          cardCraftSelection.resolve(cardId);
          setCardCraftSelection(null);
        }}
      />
    ) : null}
    </>
  );
  return {
    activeBuildLiveSafetyHostSessions,
    setActiveBuildLiveSafetyHostSessions,
    requestBuildLiveSafetyStopRef,
    requestBuildImageGenerationConfirmationRef,
    requestBuildMusicGenerationConfirmationRef,
    requestBuildCoinConfirmationRef,
    requestBuildAppLinkRef,
    requestBuildMediaActionConfirmationRef,
    requestCardCraftSelectionRef,
    hostConfirmationModals
  };
}
