import { Router } from 'express';
import { createSchool, getSchoolById, listSchools } from '@/controllers/schools.controller';

const schoolsRouter = Router();

schoolsRouter.get('/', listSchools);
schoolsRouter.get('/:schoolId', getSchoolById);
schoolsRouter.post('/', createSchool);

export default schoolsRouter;
