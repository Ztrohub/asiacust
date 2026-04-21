import { type IJob, JOB_STATUS } from '@shared/types/job.js';
import mongoose, { type AggregatePaginateModel, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import MongooseDelete, {
	type SoftDeleteDocument,
	type SoftDeleteModel
} from 'mongoose-delete';

const jobSchema = new mongoose.Schema(
	{
		customer: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'Customer',
			index: true
		},
		description: { type: String, required: true },
		workerDescription: { type: String, required: false },
		scheduleDate: { type: Date, required: false, index: true },
		startDate: { type: Date, required: false },
		endDate: { type: Date, required: false },
		price: { type: Number, required: false },
		status: {
			type: String,
			enum: JOB_STATUS,
			required: true,
			default: JOB_STATUS.SCHEDULED,
			index: true
		},
		paymentDate: { type: Date, required: false },
		paymentStatus: {
			type: String,
			enum: ['unpaid', 'cash', 'transfer'],
			required: true,
			default: 'unpaid',
			index: true
		},
		workers: [{ type: String, ref: 'User', index: true }]
	},
	{ timestamps: true }
);

// TODO: delete not working
jobSchema.plugin(MongooseDelete, {
	deletedBy: true,
	overrideMethods: 'all'
});
jobSchema.plugin(aggregatePaginate);

export interface IJobDocument
	extends Omit<IJob, '_id' | 'customer' | 'workers'>,
		SoftDeleteDocument {
	_id: mongoose.Types.ObjectId;
	customer: mongoose.Types.ObjectId;
	workers: string[];
}

export const Job = model<
	IJobDocument,
	SoftDeleteModel<IJobDocument> & AggregatePaginateModel<IJobDocument>
>('Job', jobSchema);
