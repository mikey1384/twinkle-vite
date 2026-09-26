import {
  type AiImageQuality,
  type OpenAiImageModel
} from '~/helpers/aiImageModels';
export interface BuildRuntimeImageGenerationConfirmationRequest {
  prompt: string;
  model?: OpenAiImageModel;
  engine: 'gemini' | 'openai';
  quality: AiImageQuality;
}

interface BuildRuntimeImageGenerationUserActivation {
  isActive?: boolean;
}

interface BuildRuntimeImageGenerationDenied {
  authorized: false;
  code: string;
  message: string;
}

interface BuildRuntimeImageGenerationAuthorized {
  authorized: true;
  release: () => void;
}

type BuildRuntimeImageGenerationAuthorization =
  BuildRuntimeImageGenerationDenied | BuildRuntimeImageGenerationAuthorized;

// One consented AI generation at a time: it must start from a user action,
// the host asks the viewer to approve it, and each approval covers exactly
// one request. Shared by image and music generation.
interface ConsentedGenerationWording {
  inProgressCode: string;
  inProgressMessage: string;
  unavailableCode: string;
  unavailableMessage: string;
  cancelledCode: string;
  cancelledMessage: string;
  activationMessage: string;
}

function createConsentedGenerationController<Request>(
  wording: ConsentedGenerationWording
) {
  let state: 'idle' | 'confirming' | 'generating' = 'idle';

  return {
    async authorize({
      userActivation,
      request,
      requestConfirmation
    }: {
      userActivation:
        BuildRuntimeImageGenerationUserActivation | null | undefined;
      request: Request;
      requestConfirmation:
        | ((request: Request) => Promise<boolean>)
        | null
        | undefined;
    }): Promise<BuildRuntimeImageGenerationAuthorization> {
      if (userActivation?.isActive !== true) {
        return {
          authorized: false,
          code: 'USER_ACTIVATION_REQUIRED',
          message: wording.activationMessage
        };
      }

      if (state !== 'idle') {
        return {
          authorized: false,
          code: wording.inProgressCode,
          message: wording.inProgressMessage
        };
      }

      if (!requestConfirmation) {
        return {
          authorized: false,
          code: wording.unavailableCode,
          message: wording.unavailableMessage
        };
      }

      state = 'confirming';
      try {
        const confirmed = await requestConfirmation(request);
        if (!confirmed) {
          state = 'idle';
          return {
            authorized: false,
            code: wording.cancelledCode,
            message: wording.cancelledMessage
          };
        }

        state = 'generating';
        let released = false;
        return {
          authorized: true,
          release() {
            if (released) return;
            released = true;
            state = 'idle';
          }
        };
      } catch (error) {
        state = 'idle';
        throw error;
      }
    }
  };
}

export function createBuildRuntimeImageGenerationController() {
  return createConsentedGenerationController<BuildRuntimeImageGenerationConfirmationRequest>(
    {
      inProgressCode: 'ai_image_generation_in_progress',
      inProgressMessage: 'Another AI image generation is already in progress.',
      unavailableCode: 'IMAGE_GENERATION_CONFIRMATION_UNAVAILABLE',
      unavailableMessage: 'AI image generation confirmation is unavailable.',
      cancelledCode: 'IMAGE_GENERATION_CANCELLED',
      cancelledMessage: 'AI image generation was cancelled.',
      activationMessage: 'AI image generation must start from a user action.'
    }
  );
}

export interface BuildRuntimeMusicGenerationConfirmationRequest {
  prompt: string;
  length: 'full' | 'clip';
  instrumental: boolean;
}

export function createBuildRuntimeMusicGenerationController() {
  return createConsentedGenerationController<BuildRuntimeMusicGenerationConfirmationRequest>(
    {
      inProgressCode: 'ai_music_generation_in_progress',
      inProgressMessage: 'Another AI music generation is already in progress.',
      unavailableCode: 'MUSIC_GENERATION_CONFIRMATION_UNAVAILABLE',
      unavailableMessage: 'AI music generation confirmation is unavailable.',
      cancelledCode: 'MUSIC_GENERATION_CANCELLED',
      cancelledMessage: 'AI music generation was cancelled.',
      activationMessage: 'AI music generation must start from a user action.'
    }
  );
}
