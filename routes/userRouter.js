const {Router} = require('express');
const asyncHandler = require('../middlewares/async-handler');
const userService = require('../services/userService');
// 현재 사용자가 로그인했는지 체크하는 미들웨어 적용
const reqUserCheck = require('../middlewares/reqUserCheck');
const isAdminNanoid = require('../middlewares/isAdminNanoid');
const isAdminEmail = require('../middlewares/isAdminEmail');

const router = Router();

/* create (bodyData : required: true -> email, name, password */
router.post('/', asyncHandler(async (req, res) => {
    const bodyData = req.body;
    const result = await userService.createUser(bodyData);
    return res.status(201).json(result);
}));

// find all
router.get('/', asyncHandler(async (req, res) => {
    const result = await userService.findAllUser();
    return res.status(200).json(result);
}));

// findOne by nanoid
router.get('/:nanoid', asyncHandler(async (req, res) => {
    const {nanoid} = req.params;
    const result = await userService.findById({nanoid});
    return res.status(200).json(result);
}));

// findOne by email
router.post('/email', asyncHandler(async (req, res) => {
    const {email} = req.body;
    const result = await userService.findByEmail({email});
    return res.status(200).json(result);
}));

// update by nanoid (bodyData : name or password)
router.put('/:nanoid', asyncHandler(async (req, res) => {
    const {nanoid} = req.params;

    const bodyData = req.body;
    const result = await userService.updateById({nanoid}, bodyData);
    return res.status(200).json(result);
}));

// update by email (bodyData : name or password)
router.put('/', asyncHandler(async (req, res) => {
    const {email} = req.body;
    const bodyData = req.body;

    const result = await userService.updateByEmail({email}, bodyData);
    return res.status(200).json(result);
}));

// delete by nanoid
router.delete('/:nanoid', reqUserCheck, asyncHandler(async (req,res) => {
    const {nanoid} = req.params;

    const result = await userService.deleteById({nanoid});
    return res.status(200).json(result);
}));

// delete by email
router.post('/deleteByEmail', asyncHandler(async (req,res) => {
    const {email} = req.body;

    const result = await userService.deleteByEmail({email});
    return res.status(200).json(result);
}));

// 회원가입 시 이메일 인증 코드 발급 진행
router.post('/verify', asyncHandler(async (req, res) => {
    const {email} = req.body;
    const result = await userService.joinVerify({email});
    return res.status(201).json(result);
}));

// 회원가입 시 이메일 인증 확인 요청 진행
router.post('/verify/confirm', asyncHandler(async (req, res) => {
    const {email, secret} = req.body;
    const result = await userService.joinVerifyConfirm({email, secret});
    return res.status(200).json(result);
}));

// 비밀번호 찾기 시 이메일 인증 요청
router.post('/verify/findpw', asyncHandler(async (req, res) => {
    const {email} = req.body;
    const result = await userService.pwfindVerify({email});
    return res.status(200).json(result);
}))

module.exports = router;