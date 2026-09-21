import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react';
import { useAppContext } from '~/contexts';
import {
  formatBuildCommentFeedbackMessage,
  type BuildCommentFeedback
} from '~/helpers/buildCommentFeedback';
import {
  formatBuildAppReferenceMessage,
  MAX_BUILD_APP_REFERENCES,
  type BuildAppReference
} from '../../helpers/appReferences';

export default function useAppReferences({
  buildId,
  draftMessage,
  disabled,
  apps,
  setApps,
  feedback,
  setFeedback,
  onDraftMessageChange,
  onSendMessage
}: {
  buildId: number;
  draftMessage: string;
  disabled: boolean;
  apps: BuildAppReference[];
  setApps: Dispatch<SetStateAction<BuildAppReference[]>>;
  feedback: BuildCommentFeedback[];
  setFeedback: Dispatch<SetStateAction<BuildCommentFeedback[]>>;
  onDraftMessageChange: (value: string) => void;
  onSendMessage: (message: string) => Promise<boolean> | boolean;
}) {
  const prepareBuildChatAppReferences = useAppContext(
    (v) => v.requestHelpers.prepareBuildChatAppReferences
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const latestRef = useRef({ buildId, draftMessage, disabled });
  const sendTokenRef = useRef<object | null>(null);
  latestRef.current = { buildId, draftMessage, disabled };

  useEffect(() => {
    setSubmitting(false);
    setError('');
    sendTokenRef.current = null;
    return () => {
      sendTokenRef.current = null;
    };
  }, [buildId]);

  return {
    apps,
    submitting,
    error,
    addApp,
    removeApp,
    removeFeedback,
    submitMessage
  };

  function addApp(app: BuildAppReference) {
    if (sendTokenRef.current) return;
    setError('');
    setApps((current) =>
      current.length >= MAX_BUILD_APP_REFERENCES ||
      current.some((entry) => entry.id === app.id)
        ? current
        : [...current, app]
    );
  }

  function removeApp(id: number) {
    if (sendTokenRef.current) return;
    setApps((current) => current.filter((app) => app.id !== id));
    setError('');
  }

  function removeFeedback(commentId: number) {
    if (sendTokenRef.current) return;
    setFeedback((current) =>
      current.filter((entry) => entry.comment.id !== commentId)
    );
    setError('');
  }

  async function submitMessage() {
    const message = draftMessage.trim();
    if ((!message && !feedback.length) || disabled || sendTokenRef.current)
      return;
    const token = {};
    sendTokenRef.current = token;
    setSubmitting(true);
    setError('');
    const stillCurrent = () =>
      latestRef.current.buildId === buildId && sendTokenRef.current === token;
    try {
      let references = apps;
      if (apps.length) {
        const result = await prepareBuildChatAppReferences({
          buildId,
          referenceBuildIds: apps.map((app) => app.id)
        });
        if (!stillCurrent()) return;
        if (
          !Array.isArray(result?.apps) ||
          result.apps.length !== apps.length
        ) {
          throw new Error(
            'Could not check your app references. Please try again.'
          );
        }
        references = result.apps;
      }
      if (!stillCurrent() || latestRef.current.disabled) return;
      const accepted = await onSendMessage(
        formatBuildAppReferenceMessage(
          formatBuildCommentFeedbackMessage(message, feedback),
          references
        )
      );
      if (!stillCurrent()) return;
      if (accepted) {
        // Do not wipe a draft replaced by another composer action while the
        // request was awaiting acceptance.
        if (latestRef.current.draftMessage === draftMessage)
          onDraftMessageChange('');
        setApps((current) => current.filter((app) => !apps.includes(app)));
        setFeedback((current) =>
          current.filter((entry) => !feedback.includes(entry))
        );
      } else {
        setError('Your message was not sent. Try again when Lumine is ready.');
      }
    } catch (cause: any) {
      if (!stillCurrent()) return;
      setError(
        cause?.response?.data?.error ||
          cause?.message ||
          'Could not send your message. Please try again.'
      );
    } finally {
      if (stillCurrent()) {
        sendTokenRef.current = null;
        setSubmitting(false);
      }
    }
  }
}
