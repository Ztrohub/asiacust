import { type IUser, UserRole } from '@shared/types/user.js';
import mongoose, { model } from 'mongoose';
import MongooseDelete, {
	type SoftDeleteDocument,
	type SoftDeleteModel
} from 'mongoose-delete';

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
		firebaseUid: { type: String, required: true, unique: true },
		role: {
			type: String,
			enum: UserRole,
			required: true
		}
	},
	{ timestamps: true }
);

userSchema.plugin(MongooseDelete, { deletedBy: true, overrideMethods: 'all' });

export interface IUserDocument extends Omit<IUser, '_id'>, SoftDeleteDocument {}

export const User = model<IUserDocument, SoftDeleteModel<IUserDocument>>(
	'User',
	userSchema
);
