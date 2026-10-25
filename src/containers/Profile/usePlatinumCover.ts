import { useRef, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';
import { useAppContext } from '~/contexts';
import { returnImageFileFromUrl } from '~/helpers';

// A platinum member's cover photo: pick a picture, it is resized in the
// browser (the long side at most 2400px), uploaded through the profile-picture
// signer and saved with PUT /user/cover; then it can be dragged into place
// (focal point "x,y" percentages), switched shine on/off, or removed.
const MAX_COVER_SIDE = 2400;
const MAX_COVER_FILE_KB = 10_000;

export default function usePlatinumCover(profile: any) {
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const setProfileCover = useAppContext(
    (v) => v.requestHelpers.setProfileCover
  );
  const updateProfileCoverSettings = useAppContext(
    (v) => v.requestHelpers.updateProfileCoverSettings
  );
  const removeProfileCover = useAppContext(
    (v) => v.requestHelpers.removeProfileCover
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busyRef = useRef(false);

  function applyCover(data: any) {
    if (!data?.userId) return;
    onSetUserState({
      userId: data.userId,
      newState: {
        profileCoverUrl: data.profileCoverUrl ?? null,
        profileCoverPosition: data.profileCoverPosition ?? null,
        profileCoverShine: data.profileCoverShine ?? true
      }
    });
  }

  async function uploadCover(file: File) {
    if (busyRef.current) return false;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your cover.');
      return false;
    }
    if (file.size / 1000 > MAX_COVER_FILE_KB) {
      setError('That image is over 10 MB. Choose a smaller one.');
      return false;
    }
    busyRef.current = true;
    setUploading(true);
    setUploadProgress(0);
    try {
      const dataUrl = await resizeImage(file);
      const fileName = `${uuidv1()}.jpg`;
      let uploadToken: string | undefined;
      const src = await uploadFile({
        context: 'profilePic',
        filePath: `${profile.id}/${fileName}`,
        file: returnImageFileFromUrl({ imageUrl: dataUrl, fileName }),
        onSignedUploadMeta: ({
          profileUploadToken
        }: {
          profileUploadToken?: string;
        }) => {
          uploadToken = profileUploadToken;
        },
        onUploadProgress: ({
          loaded,
          total
        }: {
          loaded: number;
          total: number;
        }) => setUploadProgress(total ? loaded / total : 0)
      });
      if (
        typeof src !== 'string' ||
        !src.startsWith('/profile/') ||
        !uploadToken
      ) {
        throw new Error('The cover upload did not finish.');
      }
      applyCover(await setProfileCover({ uploadToken, position: '50,50' }));
      return true;
    } catch (caught: any) {
      setError(caught?.message || 'The cover could not be saved. Try again.');
      return false;
    } finally {
      busyRef.current = false;
      setUploading(false);
    }
  }

  async function saveSettings(settings: {
    position?: string;
    shine?: boolean;
  }) {
    setSaving(true);
    setError('');
    try {
      applyCover(await updateProfileCoverSettings(settings));
      return true;
    } catch (caught: any) {
      setError(caught?.message || 'That change could not be saved. Try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeCover() {
    setSaving(true);
    setError('');
    try {
      applyCover(await removeProfileCover());
      return true;
    } catch (caught: any) {
      setError(
        caught?.message || 'The cover photo could not be removed. Try again.'
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    uploadCover,
    saveSettings,
    removeCover,
    uploading,
    uploadProgress,
    saving,
    error,
    setError
  };
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('That image could not be read.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new Error('That image could not be opened.'));
      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_COVER_SIDE / Math.max(image.width, image.height)
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context)
          return reject(new Error('That image could not be prepared.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
