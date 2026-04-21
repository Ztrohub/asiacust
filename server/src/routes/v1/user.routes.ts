import { USER_ROLE } from '@shared/types/user.js';
import express from 'express';
import createHttpError from 'http-errors';
import admin from 'src/config/firebase.js';
import { validateZod } from 'src/handlers/zod.handler.js';
import { adminMiddleware } from 'src/middlewares/admin.middleware.js';
import { authMiddleware } from 'src/middlewares/auth.middleware.js';
import { buildQuery } from 'src/utils/queryBuilder.js';
import z from 'zod';
import { User } from '../../database/models/user.models.js';

const userRoutes = express.Router();

// schema
const registerSchema = z.object({
	username: z
		.string()
		.trim()
		.min(3, 'Username harus memiliki minimal 3 karakter')
		.max(20, 'Username maksimal 20 karakter')
		.regex(
			/^[a-zA-Z0-9_]+$/,
			'Username hanya boleh mengandung huruf, angka, dan underscore'
		),
	password: z.string().min(6, 'Password harus memiliki minimal 6 karakter'),
	role: z.enum(USER_ROLE, {
		message: `Role harus salah satu dari: ${Object.values(USER_ROLE).join(', ')}`
	})
});

const changePasswordSchema = z.object({
	password: z.string().min(6, 'Password harus memiliki minimal 6 karakter')
});

// global search
const USER_SEARCH_FIELDS = ['username', 'firebaseUid'];

userRoutes.post(
	'/',
	authMiddleware,
	adminMiddleware,
	validateZod(registerSchema),
	async (req, res, next) => {
		try {
			const { username, password, role } = req.body;

			const existingUser = await User.findOne({ username });

			if (existingUser) {
				return next(createHttpError(409, 'Username sudah terdaftar'));
			}

			const email = `${username}@asia.lokal`;

			// create user in firebase auth
			const fbUser = await admin.auth().createUser({
				email,
				password,
				displayName: username
			});

			// create user in mongodb
			const user = await User.create({
				username,
				firebaseUid: fbUser.uid,
				role,
				status: true
			});

			// set custom claims
			await admin.auth().setCustomUserClaims(fbUser.uid, { role });

			return res.status(201).json({
				message: 'User berhasil didaftarkan',
				data: user
			});
		} catch (error) {
			next(error);
		}
	}
);

userRoutes.get('/', authMiddleware, adminMiddleware, async (req, res, next) => {
	try {
		const options = {
			page: parseInt(req.query.page as string, 10) || 1,
			limit: parseInt(req.query.limit as string, 10) || 10
		};

		const sortQuery = (req.query.sort as string) || '-createdAt';

		const filterQuery = buildQuery(req.query, USER_SEARCH_FIELDS);

		console.log('filterQuery', JSON.stringify(filterQuery, null, 2));

		const aggregate = User.aggregate();

		aggregate.match(filterQuery);

		const sortOrder = sortQuery.startsWith('-') ? -1 : 1;
		const sortField = sortQuery.replace('-', '');

		aggregate.sort({ [sortField]: sortOrder });

		const users = await User.aggregatePaginate(aggregate, options);

		return res.status(200).json({
			message: 'Data berhasil didapatkan',
			data: users
		});
	} catch (error) {
		next(error);
	}
});

userRoutes.delete(
	'/:id',
	authMiddleware,
	adminMiddleware,
	async (req, res, next) => {
		try {
			const { id } = req.params;

			const user = await User.find({ firebaseUid: id });

			if (!user) {
				return next(createHttpError(404, 'User tidak ditemukan'));
			}

			await admin.auth().deleteUser(id);

			await User.updateOne({ firebaseUid: id }, { status: false });

			return res.status(200).json({
				message: 'User berhasil dihapus'
			});
		} catch (error) {
			next(error);
		}
	}
);

userRoutes.patch(
	'/:id/password',
	authMiddleware,
	adminMiddleware,
	validateZod(changePasswordSchema),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const { password } = req.body;

			const user = await User.findOne({ firebaseUid: id, status: true });

			if (!user) {
				return next(createHttpError(404, 'User tidak ditemukan'));
			}

			await admin.auth().updateUser(id, { password });

			return res.status(200).json({
				message: 'Password berhasil diubah'
			});
		} catch (error) {
			next(error);
		}
	}
);

export default userRoutes;
