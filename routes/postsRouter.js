const {Router} = require('express');
const {Post, User} = require('../models/index');
const path = require('path');
const router = Router();
const asyncHandler = require('../middlewares/async-handler');
const postService = require('../services/postService');

// 모든 글 리스트 읽기 (완료)
router.get('/getallposts/:nowpage', asyncHandler(async (req,res) => { 
    const {nowpage} = req.params;
    const result = await postService.getAllposts({nowpage});
    return res.status(200).json(result);
}));

// 내 글만 보기
router.post('/getmyposts', asyncHandler(async (req,res) => { 
    const {email, nowpage} = req.body;
    const result = await postService.getMyposts({email, nowpage});
    return res.status(200).json(result);
}));


// 글 내용 요청 라우터 (완료)
router.get('/read/:nanoid', asyncHandler(async (req, res) => {
    const {nanoid} = req.params;
    const result = await postService.getPost({nanoid});
    return res.status(200).json(result);
}));


// 글 작성 (완료)
router.post('/write', asyncHandler(async (req, res) => {
    const {email, title, content} = req.body;
    const result = await postService.writePost({email, title, content});
    return res.status(200).json(result);
}));


// 글 수정 페이지 내용 요청
router.post('/getput', asyncHandler(async (req, res) => {
    const query = {
        __id: req.params.__id
    };
    const post = await Post.findOne(query).populate('author');
    if(post.author.email === req.user.email){
        res.statusCode = 200;
        res.json(post);
        return;
    } else { 
        // 로그인은 되어 있으나 사용자가 작성한 글이 아닐 때
        res.statusCode = 400;
        res.json({edit:"notedit"});
    }
}));


// 글 수정
router.post('/put', asyncHandler(async (req, res) => {
    const {title, content}= req.body;
    const __id = req.params.__id;
    const author = await User.findOne({
        __id: req.user.__id
    });
    if(!author) { throw new Error('Session user can\'t find in UserDB'); }
    const updateAt = new Date().toLocaleString();
    // findOneAndUpdate?
    await Post.updateOne({__id},{title, content, updateAt});
    res.redirect('/posts?page=1&myposts=false');
}));


// 글 삭제
router.delete('/delete', asyncHandler(async (req, res) => {
    if(!req.user){
        res.statusCode = 401;
        res.json({deletes: "notlogin"});
        return;
    }

    const query = {
        __id: req.params.__id
    };
    const post = await Post.findOne(query).populate('author');
    if(post.author.email === req.user.email){
        await Post.deleteOne(query);
        res.statusCode = 201;
        res.status(200).json({deletes: "ok"});
        return;
    } else {
        res.statusCode = 400;
        res.status(403).json({deletes: "notok"});
    }
}));

module.exports = router;