import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthContext } from './auth-context';

interface SocketContextType {
  socket: Socket | null;
  activities: any[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  activities: []
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const { user } = useAuthContext();

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const socketInstance = io('http://localhost:5000');

      // Listen for new activities
      socketInstance.on('newActivity', (activity) => {
        setActivities((prev) => [activity, ...prev].slice(0, 10));
      });

      setSocket(socketInstance);

      // Cleanup on unmount
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, activities }}>
      {children}
    </SocketContext.Provider>
  );
}; 