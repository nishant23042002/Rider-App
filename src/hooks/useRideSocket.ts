import { useEffect } from 'react';
import { socket } from '../socket/socket';

export function useRideSocket(customerId: string) {
  useEffect(() => {
    const connectHandler = () => {
      console.log('🟢 SOCKET CONNECTED:', socket.id);

      socket.emit('register-customer', customerId);
      socket.emit('join-map-room');
    };

    socket.on('connect', connectHandler);

    return () => {
      socket.off('connect', connectHandler);
    };
  }, [customerId]);
}