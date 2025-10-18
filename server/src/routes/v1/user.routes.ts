import express from 'express';

const userRoutes = express.Router();

userRoutes.get('/', (_req, res) => {
	res.send('User route is working!');
});

export default userRoutes;
