import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import SectionPanel from '~/components/SectionPanel';
import UserSearchInput, { type UserSearchResult } from '~/components/UserSearchInput';
import { cloudFrontURL, MIKEY_USER_ID } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';

interface CoverMember {
  id: number;
  username: string;
  profileCoverUrl: string | null;
  profileCoverPosition?: string | null;
}

export default function ProfileCovers() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const removeMemberProfileCover = useAppContext(
    (v) => v.requestHelpers.removeMemberProfileCover
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [member, setMember] = useState<CoverMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmShown, setConfirmShown] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lookupSequence = useRef(0);

  if (Number(userId) !== MIKEY_USER_ID) return null;

  const coverUrl = member?.profileCoverUrl;
  const imageUrl = coverUrl?.startsWith('http')
    ? coverUrl
    : `${cloudFrontURL}${coverUrl || ''}`;
  const [x, y] = String(member?.profileCoverPosition || '50,50').split(',');

  return (
    <SectionPanel title="Profile covers" loaded>
      <div className={panelClass}>
        <p>Search for a member to review their current cover photo.</p>
        <UserSearchInput
          excludeUserIds={[MIKEY_USER_ID]}
          onSelect={handleSelectMember}
          placeholder="Search members..."
        />
        {loading && <p role="status">Loading cover photo...</p>}
        {error && <p role="alert" className="cover-error">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {member && !loading && (
          <div className="cover-member">
            <strong>{member.username}</strong>
            {coverUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={`${member.username}'s current cover photo`}
                  style={{ objectPosition: `${focalPoint(x)}% ${focalPoint(y)}%` }}
                />
                <Button color="red" onClick={() => setConfirmShown(true)}>
                  Remove cover
                </Button>
              </>
            ) : (
              <p>This member has no cover photo.</p>
            )}
          </div>
        )}
      </div>
      {confirmShown && member && coverUrl && (
        <ConfirmModal
          title="Remove cover photo"
          description={`Take down ${member.username}'s cover photo? They can add a new one.`}
          descriptionFontSize="1.7rem"
          confirmButtonLabel="Remove cover"
          confirmButtonColor="red"
          onHide={() => setConfirmShown(false)}
          onConfirm={() => handleRemoveCover(member, coverUrl)}
        />
      )}
    </SectionPanel>
  );

  async function handleSelectMember(selected: UserSearchResult) {
    const sequence = ++lookupSequence.current;
    setMember(null);
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const profile = await loadProfile(Number(selected.id));
      if (sequence !== lookupSequence.current) return;
      if (!profile?.id || Number(profile.id) !== Number(selected.id)) {
        throw new Error('This member could not be found.');
      }
      setMember({
        id: Number(profile.id),
        username: profile.username,
        profileCoverUrl: profile.profileCoverUrl || null,
        profileCoverPosition: profile.profileCoverPosition || null
      });
    } catch (caught: any) {
      if (sequence === lookupSequence.current) {
        setError(caught?.message || 'Could not load this cover photo. Try again.');
      }
    } finally {
      if (sequence === lookupSequence.current) setLoading(false);
    }
  }

  async function handleRemoveCover(target: CoverMember, expectedCoverUrl: string) {
    const sequence = lookupSequence.current;
    setError('');
    setNotice('');
    try {
      const result = await removeMemberProfileCover(target.id, expectedCoverUrl);
      if (
        !result?.success ||
        Number(result.userId) !== target.id ||
        (result.profileCoverUrl !== null && typeof result.profileCoverUrl !== 'string')
      ) {
        throw new Error('The removal could not be confirmed. Search for the member again.');
      }
      // A newer lookup may already have displayed a replacement cover. Do not
      // overwrite that selection or its cached state with this earlier result.
      if (sequence !== lookupSequence.current) return;
      const coverState = {
        profileCoverUrl: result.profileCoverUrl,
        profileCoverPosition: result.profileCoverPosition ?? null
      };
      onSetUserState({ userId: target.id, newState: coverState });
      setMember((current) =>
        current?.id === target.id ? { ...current, ...coverState } : current
      );
      setNotice(
        result.profileCoverUrl
          ? `The reviewed cover was removed. ${target.username} has since added another cover photo.`
          : `${target.username}'s cover photo was removed.`
      );
    } catch (caught: any) {
      if (sequence === lookupSequence.current) {
        if (caught?.code === 'profile_cover_changed') setMember(null);
        setError(caught?.message || 'The cover could not be removed. Try again.');
      }
    } finally {
      if (sequence === lookupSequence.current) setConfirmShown(false);
    }
  }
}

function focalPoint(value: string) {
  const number = Number(value);
  return value?.trim() && Number.isFinite(number)
    ? Math.max(0, Math.min(100, number))
    : 50;
}

const panelClass = css`
  display: grid;
  gap: 1.2rem;
  font-size: 1.5rem;
  line-height: 1.5;
  p { margin: 0; }
  .cover-member { display: grid; gap: 1rem; min-width: 0; }
  .cover-member strong { overflow-wrap: anywhere; }
  .cover-member img {
    width: 100%;
    height: 18rem;
    object-fit: cover;
    border-radius: 0.8rem;
  }
  .cover-member button { justify-self: start; }
  .cover-error { color: #a3262a; }
`;
