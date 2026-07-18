import http from 'http';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { app } from './app.js';
import { websocketService } from './services/websocket.js';

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket server
websocketService.init(server);

// Start server
server.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`WebSocket server available at ws://localhost:${config.port}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await websocketService.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await websocketService.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
export { server, websocketService };
