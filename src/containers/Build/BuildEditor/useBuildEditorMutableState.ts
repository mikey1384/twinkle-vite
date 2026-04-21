import { useEffect, useRef } from 'react';

interface UseBuildEditorMutableStateOptions<
  TBuild,
  TChatMessage,
  TCopilotPolicy
> {
  build: TBuild;
  chatMessages: TChatMessage[];
  copilotPolicy: TCopilotPolicy;
  onUpdateBuild: (build: TBuild) => void;
  onUpdateChatMessages: (messages: TChatMessage[]) => void;
  onUpdateCopilotPolicy: (policy: TCopilotPolicy) => void;
  areChatMessagesEqual: (
    currentMessages: TChatMessage[],
    nextMessages: TChatMessage[]
  ) => boolean;
}

interface BuildEditorMutableStateApi<TBuild, TChatMessage, TCopilotPolicy> {
  getLatestBuild(): TBuild;
  applyBuildUpdate(nextBuild: TBuild): TBuild;
  getLatestChatMessages(): TChatMessage[];
  replaceChatMessages(nextMessages: TChatMessage[]): TChatMessage[];
  getLatestCopilotPolicy(): TCopilotPolicy;
  replaceCopilotPolicy(nextPolicy: TCopilotPolicy): TCopilotPolicy;
}

export default function useBuildEditorMutableState<
  TBuild,
  TChatMessage,
  TCopilotPolicy
>({
  build,
  chatMessages,
  copilotPolicy,
  onUpdateBuild,
  onUpdateChatMessages,
  onUpdateCopilotPolicy,
  areChatMessagesEqual
}: UseBuildEditorMutableStateOptions<
  TBuild,
  TChatMessage,
  TCopilotPolicy
>): BuildEditorMutableStateApi<TBuild, TChatMessage, TCopilotPolicy> {
  const buildRef = useRef(build);
  const chatMessagesRef = useRef(chatMessages);
  const copilotPolicyRef = useRef(copilotPolicy);
  const onUpdateBuildRef = useRef(onUpdateBuild);
  const onUpdateChatMessagesRef = useRef(onUpdateChatMessages);
  const onUpdateCopilotPolicyRef = useRef(onUpdateCopilotPolicy);
  const areChatMessagesEqualRef = useRef(areChatMessagesEqual);
  const apiRef = useRef<
    BuildEditorMutableStateApi<TBuild, TChatMessage, TCopilotPolicy> | null
  >(null);

  onUpdateBuildRef.current = onUpdateBuild;
  onUpdateChatMessagesRef.current = onUpdateChatMessages;
  onUpdateCopilotPolicyRef.current = onUpdateCopilotPolicy;
  areChatMessagesEqualRef.current = areChatMessagesEqual;

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    // Only adopt authoritative merged chat state when it truly changes so
    // local optimistic mutations are not overwritten between parent syncs.
    if (
      !areChatMessagesEqualRef.current(chatMessagesRef.current, chatMessages)
    ) {
      chatMessagesRef.current = chatMessages;
    }
  }, [chatMessages]);

  useEffect(() => {
    copilotPolicyRef.current = copilotPolicy;
  }, [copilotPolicy]);

  if (!apiRef.current) {
    apiRef.current = {
      getLatestBuild() {
        return buildRef.current;
      },

      applyBuildUpdate(nextBuild) {
        buildRef.current = nextBuild;
        onUpdateBuildRef.current(nextBuild);
        return nextBuild;
      },

      getLatestChatMessages() {
        return chatMessagesRef.current;
      },

      replaceChatMessages(nextMessages) {
        chatMessagesRef.current = nextMessages;
        onUpdateChatMessagesRef.current(nextMessages);
        return nextMessages;
      },

      getLatestCopilotPolicy() {
        return copilotPolicyRef.current;
      },

      replaceCopilotPolicy(nextPolicy) {
        copilotPolicyRef.current = nextPolicy;
        onUpdateCopilotPolicyRef.current(nextPolicy);
        return nextPolicy;
      }
    };
  }

  return apiRef.current;
}
