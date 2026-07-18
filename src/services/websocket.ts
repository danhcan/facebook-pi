import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  email?: string;
}

export interface WSNotification {
  type: string;
  data: any;
  timestamp: string;
}

/**
 * WebSocket server for realtime notifications
 */
export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedSocket>> = new Map();

  /**
   * Initialize WebSocket server
   */
  init(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      // Authenticate via query param token
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        logger.warn('WebSocket connection rejected: no token');
        ws.close(4001, 'Authentication required');
        return;
      }

      try {
        const payload = jwt.verify(token, config.jwt.secret) as {
          userId: string;
          email: string;
        };
        ws.userId = payload.userId;
        ws.email = payload.email;

        // Register client
        if (!this.clients.has(payload.userId)) {
          this.clients.set(payload.userId, new Set());
        }
        this.clients.get(payload.userId)!.add(ws);

        logger.info(
          { userId: ws.userId, email: ws.email, totalClients: this.getTotalClients() },
          'WebSocket client connected'
        );

        // Send welcome message
        this.sendToSocket(ws, {
          type: 'connected',
          data: { message: 'WebSocket connected successfully' },
          timestamp: new Date().toISOString(),
        });

        // Handle disconnect
        ws.on('close', () => {
          if (ws.userId && this.clients.has(ws.userId)) {
            this.clients.get(ws.userId)!.delete(ws);
            if (this.clients.get(ws.userId)!.size === 0) {
              this.clients.delete(ws.userId);
            }
          }
          logger.info(
            { userId: ws.userId, totalClients: this.getTotalClients() },
            'WebSocket client disconnected'
          );
        });

        // Handle ping/pong for keepalive
        ws.on('pong', () => {
          // Keep connection alive
        });
      } catch (error) {
        logger.warn({ error }, 'WebSocket connection rejected: invalid token');
        ws.close(4002, 'Invalid token');
      }
    });

    // Heartbeat to detect dead connections
    setInterval(() => {
      if (this.wss) {
        this.wss.clients.forEach((ws) => {
          if ((ws as AuthenticatedSocket).readyState === WebSocket.OPEN) {
            ws.ping();
          }
        });
      }
    }, 30000);

    logger.info('WebSocket server initialized on /ws');
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcastAll(notification: Omit<WSNotification, 'timestamp'>): void {
    const message: WSNotification = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    if (!this.wss) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    let sent = 0;
    this.wss.clients.forEach((ws) => {
      if ((ws as AuthenticatedSocket).readyState === WebSocket.OPEN) {
        this.sendToSocket(ws as AuthenticatedSocket, message);
        sent++;
      }
    });

    logger.info({ type: notification.type, sent }, 'Broadcast notification');
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: string, notification: Omit<WSNotification, 'timestamp'>): void {
    const message: WSNotification = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    const sockets = this.clients.get(userId);
    if (!sockets || sockets.size === 0) {
      logger.debug({ userId }, 'No active WebSocket connection for user');
      return;
    }

    let sent = 0;
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendToSocket(ws, message);
        sent++;
      }
    });

    logger.info({ type: notification.type, userId, sent }, 'Notification sent to user');
  }

  /**
   * Send message to a single socket
   */
  private sendToSocket(ws: AuthenticatedSocket, message: WSNotification): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error({ error, userId: ws.userId }, 'Failed to send WebSocket message');
    }
  }

  /**
   * Get total connected clients count
   */
  private getTotalClients(): number {
    let count = 0;
    this.clients.forEach((sockets) => {
      count += sockets.size;
    });
    return count;
  }

  /**
   * Close WebSocket server
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          logger.info('WebSocket server closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export const websocketService = new WebSocketService();
