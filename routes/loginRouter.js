const {Router} = require('express');
const path = require('path');
const passport = require('passport');
const dotenv = require('dotenv');
const asyncHandler = require('../middlewares/async-handler');
const loginService = require('../services/loginService');
dotenv.config();
// 이메일 형식 및 입력되었는지 체크
const loginCheck = require('../middlewares/loginCheck');
const reqUserCheck = require('../middlewares/reqUserCheck');
const jwt = require('jsonwebtoken');
const secret = process.env.COOKIE_SECRET;

// 처음 로그인 했을 때 클라이언트에 줄 토큰에다가 signature(secret) 으로 서명 후 전달함.
const setUserToken = (res, user) => {
    const token = jwt.sign(user, secret);
    res.cookie('token', token);
};

const router = Router();

// page sendfile
router.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname + "/../src/FE/Login/Login.html"));
});

// login
router.post('/auth', loginCheck, passport.authenticate('local', {session: false}), (req, res, next) => {
    // 로그인 성공 했을 때 클라이언트에 줄 토큰에다가 signature(secret) 으로 서명 후 전달함.
    setUserToken(res, req.user);
    if(req.user && req.user.is_passwordReset){
        return res.status(200).json({message: "임시 비밀번호 로그인입니다. 비밀번호 변경이 필요합니다.", href: "/newpassword"});
    }

    if(req.user && req.user.is_admin){
        return res.status(200).json({message: "관리자 로그인에 성공하였습니다.", href: "/admin"});
    }
    // 일반 로그인 성공 알림
    return res.status(200).json({message: "로그인에 성공하였습니다.", href: "/"});
});

// 비밀번호 찾기 페이지에서 찾으려는 이메일을 입력 후 임시 비밀번호 발송
router.post('/temppw', asyncHandler(async (req, res) => {
    const {email} = req.body;
    const result = await loginService.tempPassword({email});
    return res.status(200).json(result);
}));

// 임시 비밀번호 첫 로그인 성공 후 비밀 번호 변경 요청
router.post('/temppw/change', reqUserCheck, asyncHandler(async (req, res) => {
    const {password, password_confirm} = req.body;
    const user = req.user;
    const result = await loginService.tempPasswordChange({user, password, password_confirm});
    return res.status(200).json(result);
}));


module.exports = router;