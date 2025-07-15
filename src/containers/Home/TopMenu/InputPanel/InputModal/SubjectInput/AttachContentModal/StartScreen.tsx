import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import UploadButton from '~/components/Buttons/UploadButton';
import Icon from '~/components/Icon';
import AlertModal from '~/components/Modals/AlertModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { isMobile, returnImageFileFromUrl } from '~/helpers';
import { Color } from '~/constants/css';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { useInputContext, useKeyContext } from '~/contexts';
import {
  FILE_UPLOAD_XP_REQUIREMENT,
  mb,
  returnMaxUploadSize,
  SELECTED_LANGUAGE,
  MOD_LEVEL
} from '~/constants/defaultValues';
import localize from '~/constants/localize';

const fromTwinkleWebsiteLabel = localize('fromTwinkleWebsite');
const videoLabel = localize('video');
const linkLabel = localize('link');
const deviceIsMobile = isMobile(navigator);

export default function StartScreen({
  navigateTo,
  onHide
}: {
  navigateTo: (arg0: string) => void;
  onHide: () => void;
}) {
  const onSetSubjectAttachment = useInputContext(
    (v) => v.actions.onSetSubjectAttachment
  );
  const { level, fileUploadLvl, twinkleXP } = useKeyContext((v) => v.myState);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const disabled = useMemo(() => {
    if (level >= MOD_LEVEL) return false;
    if (twinkleXP >= FILE_UPLOAD_XP_REQUIREMENT) return false;
    return true;
  }, [level, twinkleXP]);
  const fromYourLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>{deviceIsMobile ? '기기' : '컴퓨터'}에서 가져오기</>;
    }
    return <>from Your {deviceIsMobile ? 'Device' : 'Computer'}</>;
  }, []);

  return (
    <ErrorBoundary
      componentPath="Home/Stories/InputPanel/SubjectInput/AttachContentModal/StartScreen"
      style={{ display: 'flex', width: '100%' }}
    >
      <div
        style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '2rem',
            color: Color.black()
          }}
        >
          {fromYourLabel}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1.5rem'
          }}
        >
          <UploadButton
            onFileSelect={handleUpload}
            disabled={disabled}
            style={{ fontSize: '3.5rem', padding: '1.5rem' }}
            color="blue"
            skeuomorphic
          />
        </div>
      </div>
      <div
        style={{
          width: '50%',
          flexDirection: 'column',
          alignItems: 'center',
          display: 'flex',
          marginLeft: '1rem'
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '2rem',
            color: Color.black()
          }}
        >
          {fromTwinkleWebsiteLabel}
        </div>
        <div
          style={{
            marginTop: '2.5rem',
            display: 'flex'
          }}
        >
          <Button
            skeuomorphic
            style={{ fontSize: '2rem' }}
            color="logoBlue"
            onClick={() => navigateTo('selectVideo')}
          >
            <Icon icon="film" />
            <span style={{ marginLeft: '1rem' }}>{videoLabel}</span>
          </Button>
          <Button
            skeuomorphic
            style={{ fontSize: '2rem', marginLeft: '1rem' }}
            color="pink"
            onClick={() => navigateTo('selectLink')}
          >
            <Icon icon="link" />
            <span style={{ marginLeft: '1rem' }}>{linkLabel}</span>
          </Button>
        </div>
      </div>
      {alertModalShown && (
        <AlertModal
          title="File is too large"
          content={`The file size is larger than your limit of ${
            maxSize / mb
          } MB`}
          onHide={() => setAlertModalShown(false)}
        />
      )}
    </ErrorBoundary>
  );

  function handleUpload(fileObj: File) {
    if (fileObj.size / mb > maxSize) {
      return setAlertModalShown(true);
    }
    const { fileType } = getFileInfoFromFileName(fileObj.name);
    if (fileType === 'image') {
      const reader = new FileReader();
      const extension = fileObj.name.split('.').pop();
      reader.onload = (upload: any) => {
        const payload = upload.target.result;
        if (extension === 'gif') {
          onSetSubjectAttachment({
            file: fileObj,
            contentType: 'file',
            fileType,
            imageUrl: payload
          });
          onHide();
        } else {
          window.loadImage(
            payload,
            function (img) {
              const imageUrl = img.toDataURL(
                `image/${extension === 'png' ? 'png' : 'jpeg'}`
              );
              const file = returnImageFileFromUrl({
                imageUrl,
                fileName: fileObj.name
              });
              onSetSubjectAttachment({
                file,
                contentType: 'file',
                fileType,
                imageUrl
              });
              onHide();
            },
            { orientation: true, canvas: true }
          );
        }
      };
      reader.readAsDataURL(fileObj);
    } else {
      onSetSubjectAttachment({
        file: fileObj,
        contentType: 'file',
        fileType
      });
      onHide();
    }
  }
}
