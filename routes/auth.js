import express from 'express';
import { body } from 'express-validator';
import { signup, login } from '../controllers/auth.js';
import User from '../models/user.js';

const router = express.Router();

router.post('/signup', [
    body('email').isEmail().withMessage('Please enter a valid email.').custom(async (value, {req}) => {
        const userDoc = await User.findOne({ email: value });
        if (userDoc) {
            return Promise.reject('Email already exists!');
        }
    }).normalizeEmail(),
    body('password').trim().isLength({min: 5}),
    body('username').trim().notEmpty()
], signup);

router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
    body('password').trim().isLength({min: 5})
],login);
export default router;