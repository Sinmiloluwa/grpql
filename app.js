import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { graphqlHTTP } from 'express-graphql';
import schema from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';
import checkAuth from './middleware/auth.js';
import deleteImage from './util/file.js';
import authRoute from './routes/auth.js';
import postRoute from './routes/feed.js';
import schedule from 'node-schedule';
// import { io, server ,app} from './socket.js';

const app = express();


schedule.scheduleJob('my-job','* * * * *', () => {
    console.log('I ran ******')
    schedule.cancelJob('my-job')
})

app.use(bodyParser.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/auth', authRoute);
app.use('/feed', postRoute);

// app.use(checkAuth);
// app.put('/post-image', (req, res, next) => {
//     if (!req.isAuth) {
//         throw new Error('Unauthorized');
//     }
//     if(!req.file) {
//         return res.status(200).json({message: 'File not found'});
//     }
//     if (req.body.oldPath) {
//         deleteImage(req.body.oldPath);
//     }
//     return res.status(201).json({message: 'File saved.', filePath: req.file.path});
// });
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true,
    formatError(err) {  
        if (!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return {message: message, status: code, data: data};
    }
}));
app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data : data});
})

mongoose.connect('mongodb+srv://mofeoluwae:eK6TL4wf1nvQq99M@cluster0.ac0yd.mongodb.net/messages')
.then(result => {
    app.listen(3000);
})
.catch(err => console.log(err));