import authMiddleware from '../middleware/auth.js';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import sinon from 'sinon';

describe('Auth Middleware', () => {
    it('should throw an error if no authorization header is present', () => {
        const req = {
            get: () => null
        };
        expect(() => {
            authMiddleware(req, {}, () => {});
        }).throws('Unauthorized');
    });

    it('should throw an error if the authorization header is only one string', () => {
        const req = {
            get: () => 'xyz'
        };
        expect(() => {
            authMiddleware(req, {}, () => {});
        }).throws();
    });

    it('should throw an error if the token cannot be verified', () => {
        const req = {
            get: () => 'Bearer xyz'
        }

        expect(() => {
            authMiddleware(req, {}, () => {});
        }).throws();
    });

    it('should yield a userId after decoding the token', () => {
        const req = {  
            get : () => 'Bearer xyz'
        }
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({ userId: 'abc' });
        authMiddleware(req, {}, () => {});
        expect(req).to.have.property('userId');
        jwt.verify.restore();
    });
});
