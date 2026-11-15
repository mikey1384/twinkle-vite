import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import type { UpdateNoteChatDraft } from '../ChatPanel/UpdateNoteChatCard';
import type { ChatMessage } from '../types';

// "Post an update note" in the build chat: Lumine's reply comes from the
// server's intent router, and the draft it wrote is read back from the
// server whenever a new Lumine reply lands. Posting needs the owner's Post.
export default function useUpdateNoteChat({
  buildId,
  enabled,
  messages
}: {
  buildId: number;
  enabled: boolean;
  messages: ChatMessage[];
}) {
  const loadState = useAppContext(
    (v) => v.requestHelpers.loadBuildUpdateNoteState
  );
  const postNote = useAppContext((v) => v.requestHelpers.postBuildUpdateNote);
  const skipNote = useAppContext((v) => v.requestHelpers.skipBuildUpdateNote);
  const [draft, setDraft] = useState<UpdateNoteChatDraft | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [posted, setPosted] = useState<{
    commentId: number;
    updateNumber: number;
  } | null>(null);
  const requestRef = useRef(0);

  const latestAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.role === 'assistant' && Number(message.id) > 0) {
        return Number(message.id);
      }
    }
    return 0;
  }, [messages]);

  useEffect(() => {
    setDraft(null);
    setPosted(null);
    setError('');
  }, [buildId]);

  useEffect(() => {
    if (!enabled || !buildId) return;
    const requestId = ++requestRef.current;
    loadState(buildId, 'chat')
      .then((state: any) => {
        if (requestId !== requestRef.current) return;
        const chatDraft = state?.chatDraft;
        setDraft(
          chatDraft && chatDraft.id && String(chatDraft.content || '').trim()
            ? {
                id: Number(chatDraft.id),
                source:
                  chatDraft.source === 'dialog' || chatDraft.source === 'link'
                    ? chatDraft.source
                    : 'chat',
                content: String(chatDraft.content),
                targetArtifactVersionId: Number(
                  chatDraft.targetArtifactVersionId || 0
                ),
                updateNumber: Number(state?.publishedVersion?.updateNumber || 0)
              }
            : null
        );
      })
      .catch(() => {
        // The card is optional; the chat reply already told the owner.
      });
  }, [buildId, enabled, latestAssistantMessageId, loadState]);

  return {
    draft: enabled ? draft : null,
    posting,
    error,
    posted,
    handlePost,
    handleDismiss
  };

  async function handlePost(content: string) {
    if (!draft || posting) return;
    setPosting(true);
    setError('');
    try {
      const result = await postNote({
        buildId,
        artifactVersionId: draft.targetArtifactVersionId,
        content,
        draftId: draft.id,
        source: draft.source
      });
      setPosted({
        commentId: Number(result?.commentId || 0),
        updateNumber: Number(result?.updateNumber || draft.updateNumber || 0)
      });
      setDraft(null);
    } catch (postError: any) {
      setError(
        postError?.response?.data?.error ||
          postError?.message ||
          'The note could not be posted. Try again.'
      );
    } finally {
      setPosting(false);
    }
  }

  async function handleDismiss() {
    if (!draft || posting) return;
    try {
      await skipNote({ buildId, draftId: draft.id });
    } catch {
      // "Not now" still closes the card on this page; a reload shows the
      // server's copy again.
    } finally {
      setDraft(null);
    }
  }
}
