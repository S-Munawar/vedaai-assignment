import { Router } from 'express';
import {
	getAssignmentById,
	intakeAssignmentDetails,
	listAssignments,
} from '@/controllers/assignments.controller';

const assignmentsRouter = Router();

assignmentsRouter.post('/intake', intakeAssignmentDetails);
assignmentsRouter.get('/', listAssignments);
assignmentsRouter.get('/:assignmentId', getAssignmentById);

export default assignmentsRouter;
