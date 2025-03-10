import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import Post from '../models/post.js'
import deleteImage from '../util/file.js';

export default {
    async createUser({userInput}, req) {
        const errors = [];
        if (!validator.isEmail(userInput.email)) {
            const error = new Error('Email is invalid.');
            errors.push(error);
        }
        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
            const error = new Error('Password too short!');
            errors.push(error);
        }
        if (validator.isEmpty(userInput.username)) {
            const error = new Error('Username too short!');
            errors.push(error);
        }

        if (errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
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
        console.log(createdUser);
        return { ...createdUser._doc, _id: createdUser._id.toString() };
    },
    async login({email, password}) {
        const user = await User.findOne({email: email});
        console.log(user);
        if (!user) {
            const error = new Error('User not found');
            error.code = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Invalid Password');
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, 'somesupersecretsecret', {expiresIn: '1h'});

        return {
            userId: user._id.toString(),
            token: token,
            tokenExpiration: 3600
        }
    },
    async createPost({title, content, imageUrl}, req) {
        if (!req.isAuth) {
            const error = new Error('Unauthorized');
            error.code = 401;
            throw error;
        }
        const errors = [];
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
            const error = new Error('Title is invalid.');
            errors.push(error);
        }
        if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
            const error = new Error('Content is invalid.');
            errors.push(error);
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        const post = new Post({
            title: title,
            content: content,
            imageUrl: imageUrl,
            author: req.userId
        })
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Invalid user');
            error.code = 401;
            throw error;
        }
        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();
        return { ...createdPost._doc, _id: createdPost._id.toString(), createdAt: createdPost.createdAt.toISOString(), updatedAt: createdPost.updatedAt.toISOString() };
    },

    async getPosts({page, perPage}, req) {
        console.log(req.isAuth);
        if (!req.isAuth) {
            const error = new Error('Unauthorized');
            error.code = 401;
            throw error;
        }

        if (!page) {
            page = 1;
        }
        if (!perPage) {
            perPage = 2;
        }

        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find().sort({createdAt: -1})
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate('author');
        return { posts: posts.map(p => {
            return { ...p._doc, _id: p._id.toString(), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
        }), totalPosts: totalPosts }
    },

    async getOnePost({postId}, req) {
        if (!req.isAuth) {
            const error = new Error('Unauthorized');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(postId).populate('author');
        if (!post) {
            const error = new Error('Post not found');
            error.code = 404;
            throw error;
        }
        return { ...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString() };
    },

    async updatePost({postId, title, content, imageUrl}, req) {
        if (!req.isAuth) {
            const error = new Error('Unauthorized');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(postId).populate('author');
        if (!post) {
            const error = new Error('Post not found');
            error.code = 404;
            throw error;
        }
        if (post.author._id.toString() !== req.userId.toString()) {
            const error = new Error('Unauthorized');
            error.code = 403;
            throw error;
        }

        const errors = [];
        if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
            const error = new Error('Title is invalid.');
            errors.push(error);
        }
        if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
            const error = new Error('Content is invalid.');
            errors.push(error);
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        post.title = title;
        post.content = content;
        if (post.imageUrl !== imageUrl) {
            post.imageUrl = imageUrl;
        }
        const updatedPost = await post.save();
        return { ...updatedPost._doc, _id: updatedPost._id.toString(), createdAt: updatedPost.createdAt.toISOString(), updatedAt: updatedPost.updatedAt.toISOString() };
    },

    async deletePost({postId}, req) {
        if (!req.isAuth) {
            const error = new Error('Unauthorized');
            error.code = 401;
            throw error;
        }
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Post not found');
            error.code = 404;
            throw error;
        }
        if (post.author.toString() !== req.userId.toString()) {
            const error = new Error('Unauthorized');
            error.code = 403;
            throw error;
        }
        deleteImage(post.imageUrl);
        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        return true;
    },

    async user(args, req) {
        if (!req.isAuth) {
            const error = new Error('Unauthorized');
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId).populate('posts');
        if (!user) {
            const error = new Error('User not found');
            error.code = 404;
            throw error;
        }
        return { ...user._doc, _id: user._id.toString() };
    },

    async updateStatus({status}, req) {
        if (!req.isAuth) {
            const error = new Error('Unauthorized');
            error.code = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found');
            error.code = 404;
            throw error;
        }
        user.status = status;
        await user.save();
        return { ...user._doc, _id: user._id.toString() };
    }
}