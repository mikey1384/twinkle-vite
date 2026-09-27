import { useEffect } from 'react';
import URL from '~/constants/URL';

// On www.twin-kle.com, /parents/guide and /parents/guide.md never reach the
// app: vercel.json serves them from the API as plain HTML and markdown, so AI
// assistants read them without running JavaScript. This route only catches
// the local dev server (and any host without that rewrite).
export default function ParentGuideRedirect({
  markdown = false
}: {
  markdown?: boolean;
}) {
  useEffect(() => {
    window.location.replace(
      `${URL}/parents/guide${markdown ? '.md' : ''}`
    );
  }, [markdown]);
  return null;
}
