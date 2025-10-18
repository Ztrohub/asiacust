import mongoose from 'mongoose';

mongoose.connection.on('error', (error) => {
	console.error('❌ MongoDB connection error:', error);
});

mongoose.connection.on('connecting', () => {
	console.log('🔄 Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
	console.log('✅ MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
	console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
	console.log('🔄 MongoDB reconnected');
});

export const connectDB = async () => {
	await mongoose.connect(process.env.MONGO_URI as string);
	if (process.env.NODE_ENV !== 'production') {
		mongoose.set('debug', true);
	}
};
