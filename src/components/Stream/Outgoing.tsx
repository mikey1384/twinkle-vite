import React, { useEffect, useRef } from 'react';
import { useChatContext } from '~/contexts';

export default function Outgoing() {
  const myStreamRef: React.MutableRefObject<any> = useRef(null);
  const myStream = useChatContext((v) => v.state.myStream);
  const onSetMyStream = useChatContext((v) => v.actions.onSetMyStream);
  useEffect(() => {
    init();
    async function init() {
      const options = { audio: true };
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia(options);
        onSetMyStream(stream);
      }
    }

    return function cleanUp() {
      onSetMyStream(null);
      myStreamRef.current?.getTracks()?.[0]?.stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    myStreamRef.current = myStream;
  }, [myStream]);

  return <></>;
}
