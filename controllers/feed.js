import { validationResult } from 'express-validator';
import Post from '../models/post.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.js';
import { io } from '../socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getPosts(req, res, next) {
    const postId = req.params.postId;
    const currentPage = req.query.page || 1;
    const perPage = req.query.per_page || 2;
    try {
        const totalItems = await Post.find().countDocuments()
        const posts = await Post.find().populate('author')
        .sort({createdAt: -1})
        .skip((currentPage - 1) * perPage).limit(perPage);
        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts: posts,
            totalItems: totalItems
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };

}

export async function createPost(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let author;
    try {
        const post = new Post({
            title: title,
            content: content,
            imageUrl: imageUrl,
            author: req.userId
        })
        await post.save()
        const savedUser = await User.findById(req.userId)
        if (!savedUser) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        author = savedUser;
        savedUser.posts.push(post);
        await savedUser.save();
        io.emit('posts', {
             action: 'create', 
             post: {
                ...post._doc,
                 author : {
                    _id: req.userId,
                    name: author.username
                 }
                }
            });
        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            author: { _id: author._id, name: author.name }
        });

        return savedUser;
    }catch(err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
    };
    
}

export function getPost(req, res, next) {
    Post.findById(postId).then(
        post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ message: 'Post fetched.', post: post });
        }
    ).catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
}

export async function updatePost(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        throw error;
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.file;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('File not found');
        error.statusCode = 422;
        throw error;
    }
    try {
        const post = await Post.findById(postId).populate('author')
        if (!post) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }
        if (post.author._id.toString() !== req.userId.toString()) {
            const error = new Error('unauthorized');
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            deleteImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        const result = await post.save();
        io.emit('posts', {
            action: 'update', 
            post: {
               ...result._doc,
                author : {
                   _id: req.userId,
                   name: post.author.username
                }
               }
        });
        res.status(200).json({ message: 'Post updated!', post: result });
    }catch(err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        };
}

export async function deletePost(req, res, next) {
    const postId = req.params.postId;
    try{
    const post = await Post.findById(postId)
            if (!post) {
                const error = new Error('Post not found');
                error.statusCode = 404;
                throw error;
            }
            if (post.author.toString() !== req.userId.toString()) {
                const error = new Error('unauthorized');
                error.statusCode = 403;
                throw error;
            }
            deleteImage(post.imageUrl);
            await Post.findByIdAndDelete(postId);
            const user = await User.findById(req.userId)
            user.posts.pull(postId);
            await user.save();
            io.emit('posts', { action: 'delete', post: postId
            });
            res.status(200).json({ message: 'Post deleted!' });
        } catch(err) {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        };
}

const deleteImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}

