import { JOB_STATUS } from '@shared/types/job.js';
import { USER_ROLE } from '@shared/types/user.js';
import express from 'express';
import createHttpError from 'http-errors';
import type { PaginateOptions } from 'mongoose';
import { Customer } from 'src/database/models/customer.model.js';
import { Job } from 'src/database/models/job.model.js';
import { User } from 'src/database/models/user.models.js';
import { validateZod } from 'src/handlers/zod.handler.js';
import { adminMiddleware } from 'src/middlewares/admin.middleware.js';
import { authMiddleware } from 'src/middlewares/auth.middleware.js';
import { teknisiMiddleware } from 'src/middlewares/teknisi.middleware.js';
import { buildQuery } from 'src/utils/queryBuilder.js';
import z from 'zod';

const jobRoutes = express.Router();

// schema
const statusSchema = z.object({
	status: z
		.enum(JOB_STATUS, {
			message: `Status harus salah satu dari: ${Object.values(JOB_STATUS).join(', ')}`
		})
		.optional()
});

const registerSchema = z.object({
	customer: z.string().trim().min(1, 'Customer wajib dipilih'),
	description: z.string().trim().min(1, 'Deskripsi wajib diisi'),
	scheduleDate: z.coerce.date().optional(),
	price: z.number().optional(),
	workers: z.array(z.string()).optional(),
	status: z
		.enum(JOB_STATUS, {
			message: `Status harus salah satu dari: ${Object.values(JOB_STATUS).join(', ')}`
		})
		.optional()
});

const workerProcessSchema = z.object({
	status: z.enum([JOB_STATUS.SCHEDULED, JOB_STATUS.DONE, JOB_STATUS.CANCELLED]),
	price: z.number().min(0, 'Biaya tidak boleh negatif'),
	workerDescription: z.string().trim().min(1, 'Catatan wajib diisi')
});

const JOB_SEARCH_FIELDS = [
	'customer.name',
	'customer.address',
	'workers.username'
];

jobRoutes.post(
	'/',
	authMiddleware,
	adminMiddleware,
	validateZod(registerSchema),
	async (req, res, next) => {
		try {
			const { customer, description, scheduleDate, price, workers, status } =
				req.body;

			const checkCustomer = await Customer.findOne({ _id: customer });

			if (!checkCustomer) {
				return next(createHttpError(404, 'Customer tidak ditemukan'));
			}

			const checkWorkers = await User.findOne({
				firebaseUid: { $in: workers },
				$or: [
					{ status: false },
					{ role: { $nin: [USER_ROLE.TEKNISI, USER_ROLE.HELPER] } }
				]
			});

			if (checkWorkers) {
				return next(
					createHttpError(400, `${checkWorkers.username} tidak valid`)
				);
			}

			const job = await Job.create({
				customer,
				description,
				scheduleDate,
				price,
				workers,
				status
			});

			return res.status(201).json({
				message: 'Pekerjaan berhasil dijadwalkan',
				data: job
			});
		} catch (error) {
			next(error);
		}
	}
);

jobRoutes.get('/', authMiddleware, async (req, res, next) => {
	try {
		const options: PaginateOptions = {
			page: parseInt(req.query.page as string, 10) || 1,
			limit: parseInt(req.query.limit as string, 10) || 10
		};

		const sortQuery = (req.query.sort as string) || '-scheduleDate';

		const filterQuery = buildQuery(req.query, JOB_SEARCH_FIELDS);

		const aggregate = Job.aggregate();

		aggregate.lookup({
			from: 'customers',
			localField: 'customer',
			foreignField: '_id',
			as: 'customer'
		});

		aggregate.unwind({
			path: '$customer',
			preserveNullAndEmptyArrays: true
		});

		aggregate.lookup({
			from: 'users',
			localField: 'workers',
			foreignField: 'firebaseUid',
			as: 'workers'
		});

		aggregate.match(filterQuery);

		const sortOrder = sortQuery.startsWith('-') ? -1 : 1;
		const sortField = sortQuery.replace('-', '');

		aggregate.sort({ [sortField]: sortOrder });

		const jobs = await Job.aggregatePaginate(aggregate, options);

		return res.status(200).json({
			message: 'Data berhasil didapatkan',
			data: jobs
		});
	} catch (error) {
		next(error);
	}
});

jobRoutes.patch(
	'/:_id',
	authMiddleware,
	adminMiddleware,
	validateZod(registerSchema),
	async (req, res, next) => {
		try {
			const { _id } = req.params;
			const { customer, description, scheduleDate, price, workers, status } =
				req.body;

			const job = await Job.findOne({ _id: _id });

			if (!job) {
				return next(createHttpError(404, 'Pekerjaan tidak ditemukan'));
			}

			job.customer = customer;
			job.description = description;
			job.scheduleDate = scheduleDate;
			job.price = price;
			job.workers = workers;
			job.status = status;

			await job.save();

			return res.status(200).json({
				message: 'Pekerjaan berhasil diubah'
			});
		} catch (error) {
			next(error);
		}
	}
);

jobRoutes.patch(
	'/:_id/status',
	authMiddleware,
	validateZod(statusSchema),
	async (req, res, next) => {
		try {
			const { _id } = req.params;
			const { status } = req.body;

			const job = await Job.findOne({ _id: _id });

			if (!job) {
				return next(createHttpError(404, 'Pekerjaan tidak ditemukan'));
			}

			job.status = status;

			await job.save();

			return res.status(200).json({
				message: 'Status pekerjaan berhasil diubah'
			});
		} catch (error) {
			next(error);
		}
	}
);

jobRoutes.patch(
	'/:_id/process',
	authMiddleware,
	teknisiMiddleware,
	validateZod(workerProcessSchema),
	async (req, res, next) => {
		try {
			const { _id } = req.params;
			const { status, price, workerDescription } = req.body;

			const job = await Job.findOne({ _id: _id });

			if (!job) {
				return next(createHttpError(404, 'Pekerjaan tidak ditemukan'));
			}

			job.status = status;
			job.price = price;
			job.workerDescription = workerDescription;

			await job.save();

			return res.status(200).json({
				message: 'Pekerjaan berhasil diproses'
			});
		} catch (error) {
			next(error);
		}
	}
);

jobRoutes.delete(
	'/:_id',
	authMiddleware,
	adminMiddleware,
	async (req, res, next) => {
		try {
			const { _id } = req.params;

			const job = await Job.findOne({ _id: _id });

			if (!job) {
				return next(createHttpError(404, 'Pekerjaan tidak ditemukan'));
			}

			await job.delete();

			return res.status(200).json({
				message: 'Pekerjaan berhasil dihapus'
			});
		} catch (error) {
			next(error);
		}
	}
);

export default jobRoutes;
