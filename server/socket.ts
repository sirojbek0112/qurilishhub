import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken, getAuthUserById } from './auth.ts';
import { db } from './db.ts';

let ioInstance: SocketIOServer | null = null;
const onlineUserSockets = new Map<number, Set<string>>();

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function getOnlineUserIds(): number[] {
  return Array.from(onlineUserSockets.keys());
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token =
      typeof socket.handshake.auth?.token === 'string'
        ? socket.handshake.auth.token
        : typeof socket.handshake.query?.token === 'string'
        ? socket.handshake.query.token
        : '';

    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = getAuthUserById(decoded.userId);
      if (!user) {
        next(new Error('User inactive'));
        return;
      }
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: number; fullName: string; role: string };
    const existing = onlineUserSockets.get(user.id) ?? new Set<string>();
    existing.add(socket.id);
    onlineUserSockets.set(user.id, existing);

    socket.join(`user:${user.id}`);
    io.emit('presence:update', { onlineUserIds: getOnlineUserIds() });

    socket.on('conversation:join', (conversationId: number) => {
      const conv = db
        .prepare('SELECT id FROM conversations WHERE id = ? AND (participant_one = ? OR participant_two = ?)')
        .get(conversationId, user.id, user.id);
      if (conv) {
        socket.join(`conv:${conversationId}`);
      }
    });

    socket.on('message:send', (payload: { conversationId: number; body: string; attachmentUrl?: string }) => {
      const convId = Number(payload?.conversationId);
      const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
      if (!convId || !body) return;

      const conv = db
        .prepare('SELECT participant_one, participant_two FROM conversations WHERE id = ? AND (participant_one = ? OR participant_two = ?)')
        .get(convId, user.id, user.id) as { participant_one: number; participant_two: number } | undefined;
      if (!conv) return;

      const info = db
        .prepare('INSERT INTO messages (conversation_id, sender_id, body, attachment_url) VALUES (?, ?, ?, ?)')
        .run(convId, user.id, body, payload.attachmentUrl ?? null);
      const msgId = Number(info.lastInsertRowid);
      db.prepare("UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?").run(convId);

      const saved = db
        .prepare(
          `SELECT m.*, u.full_name as sender_name
           FROM messages m JOIN users u ON u.id = m.sender_id
           WHERE m.id = ?`
        )
        .get(msgId);

      io.to(`conv:${convId}`).emit('message:new', saved);
      const peerId = conv.participant_one === user.id ? conv.participant_two : conv.participant_one;
      io.to(`user:${peerId}`).emit('message:new', saved);
    });

    socket.on('message:read', (conversationId: number) => {
      const convId = Number(conversationId);
      if (!convId) return;
      db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?').run(convId, user.id);
      io.to(`conv:${convId}`).emit('message:read_ack', { conversationId: convId, readerId: user.id });
    });

    socket.on('disconnect', () => {
      const set = onlineUserSockets.get(user.id);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUserSockets.delete(user.id);
        }
      }
      io.emit('presence:update', { onlineUserIds: getOnlineUserIds() });
    });
  });

  ioInstance = io;
  return io;
}
