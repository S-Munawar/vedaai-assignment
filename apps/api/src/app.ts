import cors from 'cors';
import express from 'express';
import { env } from '@/config/env';
import authRouter from '@/routes/auth.routes';
import healthRouter from '@/routes/health.routes';

const app = express();

app.use(
  cors({
    origin: env.webOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(healthRouter);
app.use('/auth', authRouter);

export default app;
