import React from 'react';
import BioEditModal from '~/components/Modals/BioEditModal';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import ProfilePicModal from '~/components/Modals/ProfilePicModal';
import { cloudFrontURL } from '~/constants/defaultValues';
import { replaceFakeAtSymbol } from '~/helpers/stringHelpers';

export default function EditModals({
  bioEditModalShown,
  imageEditModalShown,
  imageUri,
  onHideBioEditModal,
  onHideImageEditModal,
  onHideProfilePicModal,
  onImageEditDone,
  onSelectProfileImage,
  onSubmitBio,
  profileFirstRow,
  profilePicModalShown,
  profilePicUrl,
  profileSecondRow,
  profileThirdRow
}: {
  bioEditModalShown: boolean;
  imageEditModalShown: boolean;
  imageUri: any;
  onHideBioEditModal: () => void;
  onHideImageEditModal: () => void;
  onHideProfilePicModal: () => void;
  onImageEditDone: ({
    pictures,
    filePath
  }: {
    pictures?: any[];
    filePath?: string;
  }) => void;
  onSelectProfileImage: (selectedImageUri: any) => void;
  onSubmitBio: (params: object) => void | Promise<void>;
  profileFirstRow?: string;
  profilePicModalShown: boolean;
  profilePicUrl?: string;
  profileSecondRow?: string;
  profileThirdRow?: string;
}) {
  return (
    <>
      {bioEditModalShown ? (
        <BioEditModal
          firstLine={replaceFakeAtSymbol(profileFirstRow || '')}
          secondLine={replaceFakeAtSymbol(profileSecondRow || '')}
          thirdLine={replaceFakeAtSymbol(profileThirdRow || '')}
          onSubmit={onSubmitBio}
          onHide={onHideBioEditModal}
        />
      ) : null}
      {imageEditModalShown ? (
        <ImageEditModal
          isProfilePic
          imageUri={imageUri}
          onEditDone={onImageEditDone}
          onHide={onHideImageEditModal}
        />
      ) : null}
      {profilePicModalShown ? (
        <ProfilePicModal
          currentPicUrl={
            profilePicUrl ? `${cloudFrontURL}${profilePicUrl}` : undefined
          }
          onHide={onHideProfilePicModal}
          onSelectImage={onSelectProfileImage}
        />
      ) : null}
    </>
  );
}
