import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import jsQR from 'jsqr';
import { Color } from '~/constants/css';

// The live camera for a Bridge Builder check-in: reads the first QR code it
// sees and hands its text over once. Live camera only (no uploaded image), so
// a code has to be on a screen in front of it. The phone's back camera when
// there is one; frames are read a few times a second, and the camera stops as
// soon as a code is read or the scanner closes.
export default function QrScanner({
  onScan
}: {
  onScan: (text: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const doneRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [problem, setProblem] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    start();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setProblem(
          "This browser can't open the camera. Try Chrome or Safari on your phone."
        );
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
      } catch (error: any) {
        setProblem(
          error?.name === 'NotAllowedError'
            ? 'Allow the camera to scan your friend’s code (your browser asks first).'
            : 'The camera could not start. Close other apps using it and try again.'
        );
        return;
      }
      if (stopped || !videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => undefined);
      tick();
    }

    function tick() {
      if (stopped || doneRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth) {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvasRef.current = canvas;
        // a smaller frame reads just as well and keeps phones cool
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(image.data, image.width, image.height, {
            inversionAttempts: 'dontInvert'
          });
          if (code?.data) {
            doneRef.current = true;
            stream?.getTracks().forEach((track) => track.stop());
            onScanRef.current(code.data);
            return;
          }
        }
      }
      timer = window.setTimeout(tick, 160);
    }
  }, []);

  return (
    <div
      className={css`
        position: relative;
        width: 100%;
        max-width: 32rem;
        aspect-ratio: 1 / 1;
        margin: 0 auto;
        border-radius: 1.6rem;
        overflow: hidden;
        background: ${Color.black()};
      `}
    >
      {problem ? (
        <div
          className={css`
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            text-align: center;
            font-size: 1.4rem;
            line-height: 1.5;
            color: #fff;
          `}
        >
          {problem}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
            `}
          />
          <div
            aria-hidden
            className={css`
              position: absolute;
              inset: 14%;
              border: 0.35rem solid rgba(255, 255, 255, 0.9);
              border-radius: 1.4rem;
              box-shadow: 0 0 0 100rem rgba(0, 0, 0, 0.35);
            `}
          />
        </>
      )}
    </div>
  );
}
