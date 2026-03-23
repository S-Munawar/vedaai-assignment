import cors from 'cors';
import express from 'express';
import { env } from '@/config/env';
import assignmentsRouter from '@/routes/assignments.routes';
import authRouter from '@/routes/auth.routes';
import healthRouter from '@/routes/health.routes';
import notificationsRouter from '@/routes/notifications.routes';
import schoolsRouter from '@/routes/schools.routes';

const app = express();

function getAllowedOrigins() {
  return env.webOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(healthRouter);
app.use('/assignments', assignmentsRouter);
app.use('/auth', authRouter);
app.use('/notifications', notificationsRouter);
app.use('/schools', schoolsRouter);

export default app;
