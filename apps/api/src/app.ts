import cors from 'cors';
import express from 'express';
import { env } from '@/config/env';
import assignmentsRouter from '@/routes/assignments.routes';
import authRouter from '@/routes/auth.routes';
import healthRouter from '@/routes/health.routes';
import schoolsRouter from '@/routes/schools.routes';

const app = express();

app.use(
  cors({
    origin: env.webOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(healthRouter);
app.use('/assignments', assignmentsRouter);
app.use('/auth', authRouter);
app.use('/schools', schoolsRouter);

export default app;
