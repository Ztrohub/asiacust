import { UserRole } from '@shared/types/user.js';
import express from 'express';
import createHttpError from 'http-errors';
import admin from 'src/config/firebase.js';
import { validateZod } from 'src/handlers/zod.handler.js';
import z from 'zod';
import { User } from '../../database/models/user.models.js';

const userRoutes = express.Router();

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
	role: z.enum(UserRole, {
		message: `Role harus salah satu dari: ${Object.values(UserRole).join(', ')}`
	})
});

userRoutes.post('/', validateZod(registerSchema), async (req, res, next) => {
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
			role
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
});

export default userRoutes;
