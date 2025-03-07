import express from 'express';
import { getPosts, createPost, getPost, updatePost, deletePost } from '../controllers/feed.js';
import {check} from 'express-validator';
import checkAuth from '../middleware/auth.js';

const router = express.Router();

router.get('/posts', checkAuth, getPosts);

router.post('/post', checkAuth, [
    check('title').trim().notEmpty().isLength({min: 5}).withMessage('Title must be at least 5 characters long'),
    check('content').trim().notEmpty().withMessage('Content is required')
    .isLength({min: 5}).withMessage('Content must be at least 5 characters long')
],createPost);

router.get('/post/:postId', checkAuth, getPost);

router.put('/post/:postId', [
    check('title').trim().notEmpty().isLength({min: 5}).withMessage('Title must be at least 5 characters long'),
    check('content').trim().notEmpty().withMessage('Content is required')
    .isLength({min: 5}).withMessage('Content must be at least 5 characters long')
], checkAuth, updatePost);

router.delete('/post/:postId', checkAuth, deletePost);

export default router;