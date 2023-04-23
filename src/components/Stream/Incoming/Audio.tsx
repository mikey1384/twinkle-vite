import React, { useEffect, useRef } from 'react';

export default function Audio({ stream }: { stream: any }) {
  const audioRef = useRef(stream);
  useEffect(() => {
    const currentAudio = audioRef.current;
    if (audioRef.current && !audioRef.current.srcObject) {
      const clonedStream = stream.clone();
      audioRef.current.srcObject = clonedStream;
    }
    return function cleanUp() {
      currentAudio.srcObject?.getTracks()?.forEach?.((track: any) => {
        track.stop();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <audio
      autoPlay
      style={{ display: 'none', height: 0, width: 0 }}
      ref={audioRef}
    />
  );
}
