import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const assignmentQuestionTypeSchema = new Schema(
  {
    id: { type: Number, required: true },
    type: { type: String, required: true },
    questions: { type: Number, required: true },
    marks: { type: Number, required: true },
  },
  { _id: false },
);

const assignmentSchema = new Schema(
  {
    dueDate: {
      type: String,
      required: true,
    },
    chapterName: {
      type: String,
      required: true,
      trim: true,
    },
    additionalInfo: {
      type: String,
      trim: true,
      default: '',
    },
    questionTypes: {
      type: [assignmentQuestionTypeSchema],
      required: true,
      default: [],
    },
    totals: {
      totalQuestions: { type: Number, required: true },
      totalMarks: { type: Number, required: true },
    },
    file: {
      name: { type: String, required: true },
      size: { type: Number, required: true },
      type: { type: String, required: true },
    },
    generatedContent: {
      title: { type: String, required: true, trim: true },
      body: { type: String, required: true, trim: true },
    },
    school: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type AssignmentDocument = HydratedDocument<InferSchemaType<typeof assignmentSchema>>;

export const AssignmentModel = model('Assignment', assignmentSchema);
