import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { COMPILER_URL } from '~/constants/defaultValues';
import { useBuildContext } from '~/contexts';

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const projectId = useBuildContext((v) => v.state.projectId);
  const projectType = useBuildContext((v) => v.state.projectType);

  useEffect(() => {
    if (!projectId) return;
    const socket = io(`${COMPILER_URL || 'http://localhost:3600'}`);
    socket.on('connect', () => {
      console.log(`Connected to compiler server with socket ID: ${socket.id}`);
      socket.emit('join_project', { projectId });
      if (projectType) {
        socket.emit('initialize_dev_session', { projectId, projectType });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [projectId, projectType]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}
