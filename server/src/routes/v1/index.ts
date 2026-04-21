import express from 'express';
import customerRoutes from './customer.routes.js';
import healthRoutes from './health.routes.js';
import jobRoutes from './job.routes.js';
import userRoutes from './user.routes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/jobs', jobRoutes);
router.use('/health', healthRoutes);

export default router;
