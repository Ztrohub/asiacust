import type { ICustomer } from '@shared/types/customer.js';
import mongoose, { type AggregatePaginateModel, model } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import MongooseDelete, {
	type SoftDeleteDocument,
	type SoftDeleteModel
} from 'mongoose-delete';

const customerSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true },
		address: { type: String, required: true },
		phone: { type: String, required: false }
	},
	{ timestamps: true }
);

// TODO: delete not working
customerSchema.plugin(MongooseDelete, {
	deletedBy: true,
	overrideMethods: 'all'
});
customerSchema.plugin(aggregatePaginate);

export interface ICustomerDocument
	extends Omit<ICustomer, '_id'>,
		SoftDeleteDocument {
	_id: mongoose.Types.ObjectId;
}

export const Customer = model<
	ICustomerDocument,
	SoftDeleteModel<ICustomerDocument> & AggregatePaginateModel<ICustomerDocument>
>('Customer', customerSchema);
