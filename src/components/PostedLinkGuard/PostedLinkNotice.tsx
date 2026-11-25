import React, { useMemo } from 'react';
import { SITE_NAME } from '~/constants/siteBrand';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { AppLinkBlockedNote } from '~/components/Build/AppLink/useAppLinkConfirm';
import { describeAppLinkSite } from '~/containers/Build/PreviewPanel/helpers/appLinkPolicy';
import type { PostedLinkNoticeKind } from '~/helpers/postedLinkGuard';

// The note for a tapped posted link to a blocked site, in the app sheet's
// style (one OK button), or "Couldn't check this site" when the server
// refused the list. The site is shown the way the app sheet shows it:
// decoded from punycode, a look-alike name in its address-bar form.
export default function PostedLinkNotice({
  kind,
  url,
  onClose
}: {
  kind: PostedLinkNoticeKind;
  url: string;
  onClose: () => void;
}) {
  const site = useMemo(() => describeAppLinkSite(new URL(url)), [url]);
  const { colorKey } = useRoleColor('done', { fallback: 'blue' });
  const confirmColor = colorKey && colorKey in Color ? colorKey : 'blue';
  return (
    <AppLinkBlockedNote
      site={site}
      unchecked={kind === 'unchecked'}
      blockedTitle={`This site is blocked on ${SITE_NAME}.`}
      modalKey="PostedLinkBlockedModal"
      confirmColor={confirmColor}
      onClose={onClose}
    />
  );
}
