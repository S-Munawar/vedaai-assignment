import type { IncomingMessage } from 'node:http';
import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '@/config/env';
import { UserModel } from '@/models/user.model';
import { verifyAuthToken } from '@/services/auth-token.service';
import type { SocketAuthContext } from '@/types/realtime.types';
import { parseCookie } from '@/utils/cookie.util';
import { getSchoolRoomName, getUserRoomName, setRealtimeServer } from '@/socket/realtime.context';

function getTokenFromSocketRequest(request: IncomingMessage) {
  return parseCookie(request.headers.cookie);
}

function getAllowedOrigins() {
  return env.webOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function initializeRealtimeServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origin not allowed by Socket CORS'));
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocketRequest(socket.request);

      if (!token) {
        next(new Error('Authentication required'));
        return;
      }

      const authPayload = await verifyAuthToken(token);

      if (!authPayload) {
        next(new Error('Invalid authentication token'));
        return;
      }

      const user = await UserModel.findById(authPayload.sub).select('_id school');

      if (!user) {
        next(new Error('Authenticated user no longer exists'));
        return;
      }

      socket.data.auth = {
        userId: user._id.toString(),
        schoolId: user.school.toString(),
      } as SocketAuthContext;

      next();
    } catch {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const auth = socket.data.auth as SocketAuthContext | undefined;

    if (!auth?.schoolId || !auth?.userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(getSchoolRoomName(auth.schoolId));
    socket.join(getUserRoomName(auth.userId));
  });

  setRealtimeServer(io);

  return io;
}
