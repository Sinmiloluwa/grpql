import jwt from 'jsonwebtoken';

const checkAuth = (req, res, next) => {
    const authHeader = req.get('Authorization');
    console.log(authHeader);
    if (!authHeader) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'somesupersecretsecret');
        console.log(decodedToken);
    } catch (err) {
        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    // req.isAuth = true;
    next();
}

export default checkAuth;