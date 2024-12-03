import React, { useRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import AlertModal from '~/components/Modals/AlertModal';
import Icon from '~/components/Icon';
import jsQR from 'jsqr';
import { mb, returnMaxUploadSize } from '~/constants/defaultValues';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { v1 as uuidv1 } from 'uuid';
import SectionToScreenshot from './SectionToScreenshot';

TakeScreenshot.propTypes = {
  attachment: PropTypes.object,
  missionId: PropTypes.number,
  style: PropTypes.object
};

export default function TakeScreenshot({
  attachment,
  missionId,
  style
}: {
  attachment: any;
  missionId: number;
  style?: React.CSSProperties;
}) {
  const [isReady, setIsReady] = useState(false);
  const [buttonShown, setButtonShown] = useState(false);
  const uploadMissionAttempt = useAppContext(
    (v) => v.requestHelpers.uploadMissionAttempt
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const { fileUploadLvl, userId } = useKeyContext((v) => v.myState);
  const [isChecking, setIsChecking] = useState(false);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const FileInputRef: React.RefObject<any> = useRef(null);
  const verificationCodeRef = useRef(uuidv1());
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '1.7rem',
        ...style
      }}
    >
      {!isReady ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            {`Take a screenshot of the box that appears after you press the "I am ready" button`}
          </div>
          <div
            style={{
              marginBottom: '3rem',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          >
            Are you ready?
          </div>
          <Button
            skeuomorphic
            color="logoBlue"
            style={{ fontSize: '2rem' }}
            onClick={() => setIsReady(true)}
          >
            <span style={{ marginLeft: '1rem' }}>I am ready</span>
          </Button>
        </div>
      ) : (
        <>
          <div>
            Take a screenshot of{' '}
            <b style={{ color: Color.green() }}>
              this QR Code <Icon icon="arrow-down" />
            </b>
            <div
              className={css`
                font-size: 1.3rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                }
              `}
              style={{
                marginTop: '3rem',
                marginBottom: '2rem',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <SectionToScreenshot
                code={verificationCodeRef.current}
                onSetButtonShown={setButtonShown}
              />
            </div>
          </div>
          {attachment?.preview && (
            <div style={{ marginTop: '1rem' }}>
              <img
                loading="lazy"
                fetchPriority="low"
                style={{ width: '100%' }}
                src={attachment?.preview}
              />
              <div style={{ marginTop: '1.5rem' }}>
                <b>3.</b>{' '}
                {`If you've selected the correct screenshot image file, tap "Submit"`}
              </div>
            </div>
          )}
        </>
      )}
      {buttonShown && !isChecking && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '2rem',
            animation: 'fadeIn 3s'
          }}
        >
          {!attachment?.preview && (
            <Button
              skeuomorphic
              color="logoBlue"
              style={{ fontSize: '2rem' }}
              onClick={() => FileInputRef.current.click()}
            >
              <Icon icon="arrow-up" />
              <span style={{ marginLeft: '1rem' }}>I took the screenshot</span>
            </Button>
          )}
          <input
            ref={FileInputRef}
            style={{ display: 'none' }}
            type="file"
            accept="image/*"
            onChange={handleFileSelection}
          />
        </div>
      )}
      {isChecking && (
        <div
          style={{
            display: 'flex',
            lineHeight: 1,
            alignItems: 'center',
            height: '7rem',
            color: Color.darkerGray()
          }}
        >
          <div>Checking</div>
          <div>
            <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
          </div>
        </div>
      )}
      {isFailed && (
        <div style={{ marginTop: '2rem', color: 'red', fontWeight: 'bold' }}>
          Your image did not include the yellow box above
        </div>
      )}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div style={{ marginTop: '5rem' }}>
          <span>
            <>
              If you {`don't`} know what the word <b>{`"screenshot"`}</b> means,{' '}
            </>
            press the <b style={{ color: Color.magenta() }}>button</b> below
          </span>
          <Icon
            style={{ marginLeft: '1rem', color: Color.magenta() }}
            icon="arrow-down"
          />
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
    </div>
  );

  function handleFileSelection(event: any) {
    const fileObj = event.target.files[0];
    if (fileObj.size / mb > maxSize) {
      return setAlertModalShown(true);
    }
    const { fileType } = getFileInfoFromFileName(fileObj.name);
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (upload: any) => {
        const payload = upload.target.result;
        setIsFailed(false);
        setIsChecking(true);
        window.loadImage(
          payload,
          async function (img) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context?.drawImage(img, 0, 0, img.width, img.height);
            const imageData = context?.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            ) as any;
            const qrCode = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: 'dontInvert'
              }
            );
            if (qrCode && qrCode.data === verificationCodeRef.current) {
              const { success, newXpAndRank, newCoins } =
                await uploadMissionAttempt({
                  missionId,
                  attempt: { status: 'pass' }
                });
              if (!success) {
                return setIsChecking(false);
              }
              if (newXpAndRank.xp) {
                onSetUserState({
                  userId,
                  newState: {
                    twinkleXP: newXpAndRank.xp,
                    rank: newXpAndRank.rank
                  }
                });
              }
              if (newCoins) {
                onSetUserState({
                  userId,
                  newState: { twinkleCoins: newCoins }
                });
              }
              onUpdateMissionAttempt({
                missionId,
                newState: { status: 'pass' }
              });
            } else {
              setIsChecking(false);
              setIsFailed(true);
            }
          },
          { orientation: true, canvas: true }
        );
      };
      reader.readAsDataURL(fileObj);
    }
    event.target.value = null;
  }
}
