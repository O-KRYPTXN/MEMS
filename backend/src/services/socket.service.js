import { Server } from 'socket.io';
import { env } from '../config/env.js';

let io;

/**
 * Initialize the Socket.io server
 * @param {object} httpServer The Node HTTP server instance
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust this in production to match your frontend URL
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Allow clients to join specific rooms (e.g., 'admin-room', 'technician-room')
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get the initialized Socket.io instance to emit events from controllers/services
 * @returns {object} The Socket.io Server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};
