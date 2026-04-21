import express from 'express';
import createHttpError from 'http-errors';
import { Customer } from 'src/database/models/customer.model.js';
import { Job } from 'src/database/models/job.model.js';
import { validateZod } from 'src/handlers/zod.handler.js';
import { adminMiddleware } from 'src/middlewares/admin.middleware.js';
import { authMiddleware } from 'src/middlewares/auth.middleware.js';
import { buildQuery } from 'src/utils/queryBuilder.js';
import z from 'zod';

const customerRoutes = express.Router();

// schema
const registerSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi'),
	address: z.string().trim().min(1, 'Alamat wajib diisi'),
	phone: z.string().trim().optional()
});

const CUSTOMER_SEARCH_FIELDS = ['name', 'address', 'phone'];

customerRoutes.post(
	'/',
	authMiddleware,
	adminMiddleware,
	validateZod(registerSchema),
	async (req, res, next) => {
		try {
			const { name, address, phone } = req.body;

			const existingCustomer = await Customer.findOne({ name });

			if (existingCustomer) {
				return next(createHttpError(409, 'Customer sudah terdaftar'));
			}

			const customer = await Customer.create({
				name,
				address,
				phone
			});

			return res.status(201).json({
				message: 'Customer berhasil didaftarkan',
				data: customer
			});
		} catch (error) {
			next(error);
		}
	}
);

customerRoutes.get(
	'/',
	authMiddleware,
	adminMiddleware,
	async (req, res, next) => {
		try {
			const options = {
				page: parseInt(req.query.page as string, 10) || 1,
				limit: parseInt(req.query.limit as string, 10) || 10
			};

			const sortQuery = (req.query.sort as string) || '-createdAt';

			const filterQuery = buildQuery(req.query, CUSTOMER_SEARCH_FIELDS);

			const aggregate = Customer.aggregate();

			aggregate.match(filterQuery);

			const sortOrder = sortQuery.startsWith('-') ? -1 : 1;
			const sortField = sortQuery.replace('-', '');

			aggregate.sort({ [sortField]: sortOrder });

			const customers = await Customer.aggregatePaginate(aggregate, options);

			return res.status(200).json({
				message: 'Data berhasil didapatkan',
				data: customers
			});
		} catch (error) {
			next(error);
		}
	}
);

customerRoutes.patch(
	'/:_id',
	authMiddleware,
	adminMiddleware,
	validateZod(registerSchema),
	async (req, res, next) => {
		try {
			const { _id } = req.params;
			const { name, address, phone } = req.body;

			const customer = await Customer.findOne({ _id: _id });

			if (!customer) {
				return next(createHttpError(404, 'Customer tidak ditemukan'));
			}

			const existingCustomer = await Customer.findOne({ name });

			if (existingCustomer && existingCustomer._id.toString() !== _id) {
				return next(createHttpError(409, 'Customer sudah terdaftar'));
			}

			customer.name = name;
			customer.address = address;
			customer.phone = phone;

			await customer.save();

			return res.status(200).json({
				message: 'Customer berhasil diubah'
			});
		} catch (error) {
			next(error);
		}
	}
);

customerRoutes.delete(
	'/:_id',
	authMiddleware,
	adminMiddleware,
	async (req, res, next) => {
		try {
			const { _id } = req.params;

			const customer = await Customer.findOne({ _id: _id });

			if (!customer) {
				return next(createHttpError(404, 'Customer tidak ditemukan'));
			}

			const job = await Job.findOne({ customer: _id });

			if (job) {
				return next(createHttpError(400, 'Customer sudah pernah dijadwalkan'));
			}

			await customer.delete();

			return res.status(200).json({
				message: 'Customer berhasil dihapus'
			});
		} catch (error) {
			next(error);
		}
	}
);

export default customerRoutes;
