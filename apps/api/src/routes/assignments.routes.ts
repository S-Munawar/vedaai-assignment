import { Router } from 'express';
import {
	deleteAssignment,
	getAssignmentById,
	intakeAssignmentDetails,
	listAssignments,
} from '@/controllers/assignments.controller';

const assignmentsRouter = Router();

assignmentsRouter.post('/intake', intakeAssignmentDetails);
assignmentsRouter.get('/', listAssignments);
assignmentsRouter.get('/:assignmentId', getAssignmentById);
assignmentsRouter.delete('/:assignmentId', deleteAssignment);

export default assignmentsRouter;
