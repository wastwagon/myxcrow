import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (socket) return socket;
  socket = io({
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionAttempts: 20,
  });
  return socket;
}

export function disconnectChatSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
