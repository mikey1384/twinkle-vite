import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useChatContext } from '~/contexts';

Audio.propTypes = {
  stream: PropTypes.object.isRequired
};

export default function Audio({ stream }) {
  const audioRef = useRef(stream);
  const callMuted = useChatContext((v) => v.state.callMuted);
  useEffect(() => {
    const currentAudio = audioRef.current;
    if (audioRef.current && !audioRef.current.srcObject) {
      const clonedStream = stream.clone();
      audioRef.current.srcObject = clonedStream;
    }
    return function cleanUp() {
      currentAudio.srcObject?.getTracks()?.forEach?.((track) => {
        track.stop();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    audioRef.current.muted = callMuted;
  }, [callMuted]);

  return (
    <audio
      autoPlay
      style={{ display: 'none', height: 0, width: 0 }}
      ref={audioRef}
    />
  );
}
