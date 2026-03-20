import { Types } from 'mongoose';

export type AuthenticatedUser = {
  _id: Types.ObjectId;
  school: Types.ObjectId;
  username: string;
};

export type AssignmentCreator = {
  _id: Types.ObjectId;
  username: string;
};

export type AssignmentListDoc = {
  _id: Types.ObjectId;
  classLevel: string;
  subject: string;
  chapterName: string;
  dueDate: string;
  totals: {
    totalQuestions: number;
    totalMarks: number;
  };
  questionTypes: Array<unknown>;
  createdBy: AssignmentCreator;
  createdAt: Date;
};

export type AssignmentDetailsDoc = {
  _id: Types.ObjectId;
  classLevel?: string;
  subject?: string;
  school:
    | Types.ObjectId
    | {
        _id: Types.ObjectId;
        name?: string;
      };
  chapterName: string;
  dueDate: string;
  additionalInfo?: string;
  totals: {
    totalQuestions: number;
    totalMarks: number;
  };
  questionTypes: Array<{ id: number; type: string; questions: number; marks: number }>;
  file: {
    name: string;
    size: number;
    type: string;
  };
  generatedContent: {
    title: string;
    body: string;
  };
  createdBy: AssignmentCreator;
  createdAt: Date;
};
