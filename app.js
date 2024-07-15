const express = require('express');
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const asyncHandler = require('./middlewares/async-handler');
const reqUserCheck = require('./middlewares/reqUserCheck');
// login strategy
const local = require('./strategy/loginStrategy');
const jwtlocal = require('./strategy/jwtStrategy');
const jwtMiddleware = require('./middlewares/jwtMiddleware');
// server router
const userRouter = require('./routes/userRouter');
const loginRouter = require('./routes/loginRouter');
const postRouter = require('./routes/postsRouter');

const app = express();

// dotenv
dotenv.config();

// 모든 도메인에서 cors 허용 (개발 및 테스트용)
// app.use(cors());

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));
// cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// passport initialize
app.use(passport.initialize());
passport.use(local);
passport.use(jwtlocal);
app.use(jwtMiddleware);

// mongoose connect
mongoose.connect(process.env.MONGO_URI,{
    dbName: process.env.MONGO_DBNAME
})
.then( res => console.log(`mongoDB ${process.env.MONGO_DBNAME} collection connected`))
.catch( err => console.log(err));
mongoose.connection.on('err', (err) => {
    console.log("mongoDB err");
});

// user, login, post router
app.use('/users', userRouter);
app.use('/login', loginRouter);
app.use('/post', postRouter);

// 서버에 로그인한 정보 확인 시 전달 라우터
app.get('/getuser', asyncHandler(async (req, res) => {
    // req.user 전달
    return res.json(req.user);
}));

// JWT LOGOUT : 쿠키에 있는 토큰을 비우고, 만료 기간 0 으로 설정
app.get('/logout', reqUserCheck, async (req, res, next) => {
    res.cookie('token', null, {
        maxAge: 0
    });
    return res.status(200).json("정상적으로 로그아웃 되었습니다.");
});

// app.get (front routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

// 예외 error 핸들러
app.use((err, req, res, next) => {
    if(err.code === 401){
        console.log(err.code + " Unauthorized error 발생 : " + err.message);
        return res.status(401).json(err);
    } else if(err.code === 404){
        console.log(err.code + " Not Found error 발생 : " + err.message);
        return res.status(404).json(err);
    } else {
        console.log("400 Bad Request error 발생 : " + err.message);
        return res.status(400).json(err);
    }
});


app.listen(process.env.PORT, () => {
    console.log(`${process.env.PORT} server port connected`);
});