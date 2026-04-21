import express from 'express';

const healthRoutes = express.Router();

healthRoutes.get('/', async (req, res, next) => {
	res.status(200).json({ status: 'ok' });
});

export default healthRoutes;
