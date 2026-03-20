import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { assignmentIntakeRequestSchema, mongoIdSchema } from '@repo/shared/assignment';
import { AssignmentModel } from '@/models/assignment.model';
import { UserModel } from '@/models/user.model';
import { generateAssignmentFromLlm } from '@/services/assignment-generator.service';
import { verifyAuthToken } from '@/services/auth-token.service';
import {
  createAssignmentCreatedNotification,
  createAssignmentDeletedNotification,
} from '@/services/notification.service';
import { emitAssignmentCreatedEvent, emitAssignmentDeletedEvent } from '@/socket/realtime.context';
import type {
  AssignmentDetailsDoc,
  AssignmentListDoc,
  AuthenticatedUser,
} from '@/types/assignments.types';
import { parseCookie } from '@/utils/cookie.util';

async function requireAuthenticatedUser(req: Request, res: Response): Promise<AuthenticatedUser | null> {
  const token = parseCookie(req.headers.cookie);

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }

  const authPayload = await verifyAuthToken(token);

  if (!authPayload) {
    res.status(401).json({ success: false, error: 'Invalid authentication token' });
    return null;
  }

  const creator = await UserModel.findById(authPayload.sub).select('_id school username');

  if (!creator) {
    res.status(401).json({ success: false, error: 'Authenticated user no longer exists' });
    return null;
  }

  return creator as AuthenticatedUser;
}

export async function intakeAssignmentDetails(req: Request, res: Response) {
  try {
    const creator = await requireAuthenticatedUser(req, res);

    if (!creator) {
      return;
    }

    const parsed = assignmentIntakeRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid assignment intake payload',
      });
    }

    const payload = parsed.data;
    const generatedContent = await generateAssignmentFromLlm(payload);

    const assignment = await AssignmentModel.create({
      ...payload,
      generatedContent,
      school: creator.school,
      createdBy: creator._id,
    });

    emitAssignmentCreatedEvent(creator.school.toString(), {
      type: 'assignment:created',
      assignment: {
        id: assignment._id.toString(),
        classLevel: assignment.classLevel,
        subject: assignment.subject,
        chapterName: assignment.chapterName,
        dueDate: assignment.dueDate,
        totalQuestions: payload.totals.totalQuestions,
        totalMarks: payload.totals.totalMarks,
        questionTypeCount: assignment.questionTypes.length,
        createdBy: {
          id: creator._id.toString(),
          username: creator.username,
        },
        createdAt: assignment.createdAt.toISOString(),
      },
    });

    // Create realtime notifications for all users in the school.
    try {
      const schoolUsers = await UserModel.find({ school: creator.school }).select('_id');

      for (const schoolUser of schoolUsers) {
        void createAssignmentCreatedNotification(
          schoolUser._id,
          creator.school,
          assignment.chapterName,
          creator.username,
          assignment._id,
          creator._id,
        );
      }
    } catch (notificationError) {
      console.error('⚠️ Error creating assignment created notifications:', notificationError);
    }

    console.log('📥 Assignment intake received:', JSON.stringify(payload, null, 2));
    
    return res.status(200).json({
      success: true,
      message: 'Assignment generated successfully',
      assignmentId: assignment._id.toString(),
      receivedData: {
        dueDate: payload.dueDate,
        classLevel: payload.classLevel,
        subject: payload.subject,
        chapterName: payload.chapterName,
        totalQuestions: payload.totals?.totalQuestions,
        totalMarks: payload.totals?.totalMarks,
        questionsCount: payload.questionTypes?.length,
        hasFile: !!payload.file,
      },
    });
  } catch (error) {
    // Check if error is from LLM generation
    if (error instanceof Error && error.message.includes('LLM generation failed')) {
      console.error('❌ LLM generation error:', error);
      return res.status(503).json({
        success: false,
        error: error.message,
        errorType: 'llm_generation_failed',
      });
    }
    
    if (error instanceof Error && error.message.includes('LLM API key not configured')) {
      console.error('❌ LLM API key missing:', error);
      return res.status(503).json({
        success: false,
        error: error.message,
        errorType: 'llm_not_configured',
      });
    }

    console.error('❌ Error processing assignment intake:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process assignment intake',
    });
  }
}

export async function listAssignments(req: Request, res: Response) {
  try {
    const user = await requireAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const assignments = (await AssignmentModel.find({ school: user.school })
      .sort({ createdAt: -1 })
      .select('_id classLevel subject chapterName dueDate totals questionTypes createdBy createdAt')
      .populate({ path: 'createdBy', select: '_id username' })) as unknown as AssignmentListDoc[];

    return res.json({
      success: true,
      assignments: assignments.map((assignment) => ({
        id: assignment._id.toString(),
        classLevel: assignment.classLevel ?? '',
        subject: assignment.subject ?? '',
        chapterName: assignment.chapterName,
        dueDate: assignment.dueDate,
        totalQuestions: assignment.totals.totalQuestions,
        totalMarks: assignment.totals.totalMarks,
        questionTypeCount: assignment.questionTypes.length,
        createdBy: {
          id: assignment.createdBy._id.toString(),
          username: assignment.createdBy.username,
        },
        createdAt: assignment.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('❌ Error listing assignments:', error);
    return res.status(500).json({ success: false, error: 'Failed to list assignments' });
  }
}

export async function getAssignmentById(req: Request, res: Response) {
  try {
    const user = await requireAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const idParsed = mongoIdSchema.safeParse(req.params.assignmentId);

    if (!idParsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid assignment id' });
    }

    const assignment = (await AssignmentModel.findOne({
      _id: idParsed.data,
      school: user.school,
    })
      .select(
        '_id classLevel subject chapterName dueDate additionalInfo totals questionTypes file generatedContent school createdBy createdAt',
      )
      .populate({ path: 'school', select: '_id name' })
      .populate({ path: 'createdBy', select: '_id username' })) as unknown as AssignmentDetailsDoc | null;

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    const resolvedSchoolId =
      assignment.school instanceof Types.ObjectId
        ? assignment.school.toString()
        : assignment.school._id.toString();

    const resolvedSchoolName =
      assignment.school instanceof Types.ObjectId
        ? ''
        : (assignment.school.name ?? '');

    return res.json({
      success: true,
      assignment: {
        id: assignment._id.toString(),
        classLevel: assignment.classLevel ?? '',
        subject: assignment.subject ?? '',
        schoolName: resolvedSchoolName,
        chapterName: assignment.chapterName,
        dueDate: assignment.dueDate,
        additionalInfo: assignment.additionalInfo ?? '',
        totals: assignment.totals,
        questionTypes: assignment.questionTypes,
        file: assignment.file,
        generatedContent: assignment.generatedContent,
        schoolId: resolvedSchoolId,
        createdBy: {
          id: assignment.createdBy._id.toString(),
          username: assignment.createdBy.username,
        },
        createdAt: assignment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching assignment:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
  }
}

export async function deleteAssignment(req: Request, res: Response) {
  try {
    const user = await requireAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const idParsed = mongoIdSchema.safeParse(req.params.assignmentId);

    if (!idParsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid assignment id' });
    }

    const assignment = await AssignmentModel.findOne({
      _id: idParsed.data,
      school: user.school,
    })
      .select('_id createdBy school chapterName')
      .populate({ path: 'createdBy', select: 'username' });

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    // Check if the user is the creator
    if (assignment.createdBy._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only delete assignments you created' });
    }

    // Delete the assignment
    await AssignmentModel.deleteOne({ _id: idParsed.data });

    // Emit real-time delete event
    emitAssignmentDeletedEvent(user.school.toString(), {
      type: 'assignment:deleted',
      assignmentId: idParsed.data,
      deletedByUserId: user._id.toString(),
      deletedAt: new Date().toISOString(),
    });

    // Create notifications for all users in the school
    try {
      const schoolUsers = await UserModel.find({ school: user.school }).select('_id');

      for (const schoolUser of schoolUsers) {
        void createAssignmentDeletedNotification(
          schoolUser._id,
          user.school,
          assignment.chapterName,
          user.username,
          assignment._id,
          user._id,
        );
      }
    } catch (notificationError) {
      console.error('⚠️ Error creating notifications:', notificationError);
      // Don't fail the delete if notifications fail
    }

    console.log('🗑️ Assignment deleted:', idParsed.data);

    return res.json({
      success: true,
      assignmentId: idParsed.data,
    });
  } catch (error) {
    console.error('❌ Error deleting assignment:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete assignment' });
  }
}
