export interface BuildRuntimeImageGenerationConfirmationRequest {
  prompt: string;
  engine: 'gemini' | 'openai';
  quality: 'low' | 'medium' | 'high';
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
  | BuildRuntimeImageGenerationDenied
  | BuildRuntimeImageGenerationAuthorized;

export function authorizeBuildRuntimeImageGenerationUserActivation(
  userActivation: BuildRuntimeImageGenerationUserActivation | null | undefined
): BuildRuntimeImageGenerationDenied | null {
  if (userActivation?.isActive === true) return null;
  return {
    authorized: false,
    code: 'USER_ACTIVATION_REQUIRED',
    message: 'AI image generation must start from a user action.'
  };
}

export function createBuildRuntimeImageGenerationController() {
  let state: 'idle' | 'confirming' | 'generating' = 'idle';

  return {
    async authorize({
      userActivation,
      request,
      requestConfirmation
    }: {
      userActivation:
        | BuildRuntimeImageGenerationUserActivation
        | null
        | undefined;
      request: BuildRuntimeImageGenerationConfirmationRequest;
      requestConfirmation:
        | ((
            request: BuildRuntimeImageGenerationConfirmationRequest
          ) => Promise<boolean>)
        | null
        | undefined;
    }): Promise<BuildRuntimeImageGenerationAuthorization> {
      const activationDenied =
        authorizeBuildRuntimeImageGenerationUserActivation(userActivation);
      if (activationDenied) return activationDenied;

      if (state !== 'idle') {
        return {
          authorized: false,
          code: 'ai_image_generation_in_progress',
          message: 'Another AI image generation is already in progress.'
        };
      }

      if (!requestConfirmation) {
        return {
          authorized: false,
          code: 'IMAGE_GENERATION_CONFIRMATION_UNAVAILABLE',
          message: 'AI image generation confirmation is unavailable.'
        };
      }

      state = 'confirming';
      try {
        const confirmed = await requestConfirmation(request);
        if (!confirmed) {
          state = 'idle';
          return {
            authorized: false,
            code: 'IMAGE_GENERATION_CANCELLED',
            message: 'AI image generation was cancelled.'
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
