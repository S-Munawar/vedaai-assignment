import { createServer } from 'node:http';
import app from '@/app';
import { connectToDatabase } from '@/config/db';
import { env } from '@/config/env';
import { initializeRealtimeServer } from '@/socket/realtime.server';

async function startServer() {
  await connectToDatabase();
  const httpServer = createServer(app);
  initializeRealtimeServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
