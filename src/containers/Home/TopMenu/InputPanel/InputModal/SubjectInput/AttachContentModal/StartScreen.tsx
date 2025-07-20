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
  const level = useKeyContext((v) => v.myState.level);
  const fileUploadLvl = useKeyContext((v) => v.myState.fileUploadLvl);
  const twinkleXP = useKeyContext((v) => v.myState.twinkleXP);
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
            style={{ 
              fontSize: deviceIsMobile ? '1.8rem' : '3.5rem', 
              padding: deviceIsMobile ? '1rem' : '1.5rem' 
            }}
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
            marginTop: deviceIsMobile ? '1.5rem' : '2.5rem',
            display: 'flex',
            flexDirection: deviceIsMobile ? 'column' : 'row',
            gap: deviceIsMobile ? '0.75rem' : '0'
          }}
        >
          <Button
            skeuomorphic
            style={{ 
              fontSize: deviceIsMobile ? '1.2rem' : '2rem',
              padding: deviceIsMobile ? '0.75rem 1rem' : undefined
            }}
            color="logoBlue"
            onClick={() => navigateTo('selectVideo')}
          >
            <Icon icon="film" />
            <span style={{ marginLeft: deviceIsMobile ? '0.5rem' : '1rem' }}>{videoLabel}</span>
          </Button>
          <Button
            skeuomorphic
            style={{ 
              fontSize: deviceIsMobile ? '1.2rem' : '2rem',
              marginLeft: deviceIsMobile ? '0.75rem' : '1rem',
              padding: deviceIsMobile ? '0.75rem 1rem' : undefined
            }}
            color="pink"
            onClick={() => navigateTo('selectLink')}
          >
            <Icon icon="link" />
            <span style={{ marginLeft: deviceIsMobile ? '0.5rem' : '1rem' }}>{linkLabel}</span>
          </Button>
        </div>
      </div>
      <AlertModal
        isOpen={alertModalShown}
        title="File is too large"
        content={`The file size is larger than your limit of ${
          maxSize / mb
        } MB`}
        modalLevel={2}
        onHide={() => setAlertModalShown(false)}
      />
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
