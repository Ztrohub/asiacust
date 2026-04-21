import { type IUser, USER_ROLE } from '@shared/types/user.js';
import mongoose, { type AggregatePaginateModel, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
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
			enum: USER_ROLE,
			required: true
		},
		status: { type: Boolean, required: true, default: true, index: true }
	},
	{ timestamps: true }
);

// TODO: delete not working
userSchema.plugin(MongooseDelete, { deletedBy: true, overrideMethods: 'all' });
userSchema.plugin(aggregatePaginate);

export interface IUserDocument extends Omit<IUser, '_id'>, SoftDeleteDocument {
	_id: mongoose.Types.ObjectId;
}

export const User = model<
	IUserDocument,
	SoftDeleteModel<IUserDocument> & AggregatePaginateModel<IUserDocument>
>('User', userSchema);
