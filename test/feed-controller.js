import sinon from 'sinon';
import User from '../models/user.js';
import Post from '../models/post.js';
import { createPost } from '../controllers/feed.js';
import { json } from 'express';
import mongoose from 'mongoose';
import { expect } from 'chai';

describe('Feed Controller', function () {
    this.timeout(10000);
    before(async function () {
        await mongoose.connect('mongodb+srv://mofeoluwae:eK6TL4wf1nvQq99M@cluster0.ac0yd.mongodb.net/test-messages')
        const user = new User({
            email: "nupe@gmail.com",
            password: "levelup",
            username: "Jared",
            posts: [],
            _id: '5c0f66b979af55031b34728a'
        });
        await user.save();
    })

    it('should create a post for the user', async function () {
        const req = {
            body: {
                title: "Actual Post",
                content: "No time to waste",
            },
            file: {
                path: "abc"
            },
            userId: '5c0f66b979af55031b34728a'
        }

        const res = {
            status: function () {
                return this;
            },
            json: function () { }
        }

        const savedUser = await createPost(req, res, () => { })
            expect(savedUser).to.have.property('posts')
            expect(savedUser.posts).to.have.length(1)
    })

    after(async function () {
        await User.deleteMany({})
        await mongoose.disconnect();
    })
})