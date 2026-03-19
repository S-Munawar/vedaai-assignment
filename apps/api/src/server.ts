import app from '@/app';
import { connectToDatabase } from '@/config/db';
import { env } from '@/config/env';

async function startServer() {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
