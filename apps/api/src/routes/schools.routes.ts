import { Router } from 'express';
import { createSchool, listSchools } from '@/controllers/schools.controller';

const schoolsRouter = Router();

schoolsRouter.get('/', listSchools);
schoolsRouter.post('/', createSchool);

export default schoolsRouter;
