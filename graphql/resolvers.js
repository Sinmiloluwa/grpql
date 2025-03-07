import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';

export default {
    async createUser({userInput}, req) {
        if (!validator.isEmail(userInput.email)) {
            const error = new Error('E-Mail is invalid.');
            throw error;
        }
        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
            const error = new Error('Password too short!');
            throw error;
        }
        if (validator.isEmpty(userInput.username)) {
            const error = new Error('Username too short!');
            throw error;
        }
        const email = userInput.email;
        const password = userInput.password;
        const username = userInput.username;

        const existingUser = await User.findOne({email: email});
        if (existingUser) {
            const error = new Error('User already exists');
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPassword,
            username: username
        });
        const createdUser = await user.save();
        return { ...createdUser._doc, _id: createdUser._id.toString() };
    }
}