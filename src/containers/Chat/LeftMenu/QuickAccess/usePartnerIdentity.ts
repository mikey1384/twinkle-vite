import { useAppContext } from '~/contexts';
import type { ChatQuickAccessPartner } from './types';

export default function useQuickAccessPartnerIdentity(
  partner: ChatQuickAccessPartner
): ChatQuickAccessPartner {
  const liveUsername = useAppContext((v) =>
    partner.isAi
      ? undefined
      : v.user.state.userObj[partner.id]?.username
  );
  const liveProfilePicUrl = useAppContext((v) =>
    partner.isAi
      ? undefined
      : v.user.state.userObj[partner.id]?.profilePicUrl
  );

  if (partner.isAi) return partner;

  // Quick-access snapshots own ordering/channel metadata. Identity remains a
  // live profile concern, with the snapshot used only until that profile is
  // present in userObj.
  return {
    ...partner,
    username: liveUsername ?? partner.username,
    profilePicUrl:
      liveProfilePicUrl === undefined
        ? partner.profilePicUrl
        : liveProfilePicUrl || null
  };
}
