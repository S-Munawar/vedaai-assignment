import { Types } from 'mongoose';

export type AuthenticatedUser = {
  _id: Types.ObjectId;
  school: Types.ObjectId;
};
