import { expect } from 'chai';
import sinon from 'sinon';
import User from '../models/user.js';
import { login } from '../controllers/auth.js';
import mongoose from 'mongoose';

describe('Auth Controller - Login', function() {
    afterEach(() => {
        sinon.restore();
    });

    it('should throw an error if database fails', function(done) {
        sinon.stub(User, 'findOne').rejects(new Error('Database connection failed'));
    
        const req = {
            body: {
                email: "test@test.gmail.com",
                password: "rivet"
            }
        };
        
        const res = {
            status: function() { return this; },
            json: function() {}
        };
        
        const next = function(error) {
            expect(error).to.be.an('error');
            expect(error).to.have.property('statusCode', 500);
            done();
        };
    
        login(req, res, next);
    });

})

