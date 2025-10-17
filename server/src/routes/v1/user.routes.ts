import express from 'express';

const userRoutes = express.Router();

userRoutes.get('/', (req, res) => {
    res.send('User route is working!');
});

export default userRoutes;