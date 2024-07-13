const {User, Post} = require('../models');

class PostService {
    // 전체 글 보기 리스트 가져오기 (완료)
    async getAllposts({nowpage}){
        const page = Number(nowpage === "-1" ? 1 : Number(nowpage));
        const perPage = 10; 
        const posts = await Post.find().sort(({createAt: -1})).skip(perPage * (page - 1))
        .limit(perPage).populate('author');
        const total = await Post.countDocuments();
        const totalPage = Math.ceil(total/perPage);
    
        const data = {
            page: page,
            perPage: perPage,
            total: total,
            posts: posts,
            totalPage: totalPage
        };

        return data;
    }

    // 내 글만 보기 리스트 가져오기
    async getMyposts({email, nowpage}){
        const user = await User.find({email});
        // pagination
        // nowpage 가 없으면 1 을 사용하고 있으면 있는 값 사용 !!
        const page = Number(nowpage === "-1" ? 1 : Number(nowpage));
        const perPage = 10; 
        // 여기서 sort 는 몽구스 전용 sort !
        const posts = await Post.find({author: user}).sort(({createAt: -1})).skip(perPage * (page - 1))
        .limit(perPage).populate('author');
        // pupulate 를 추가하여 User 의 objectID 와 같은 데이터를 JOIN
        const total = await Post.countDocuments({author: user});
        const totalPage = Math.ceil(total/perPage);
    
        const data = {
            page: page,
            perPage: perPage,
            total: total,
            posts: posts,
            totalPage: totalPage
        };
        return data;
    }
    
    // 글 쓰기 (완료)
    async writePost({email, title, content}){
        const author = await User.findOne({email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        const data = await Post.create({title, content, author});
        return {data: data, code: 200, message: `글 작성 완료`};
    };

    // 글 읽기 (완료)
    async getPost({nanoid}){
        const post = await Post.findOne({nanoid}).populate('author');
        if(!post){
            const error = new Error();
            Object.assign(error, {code: 400, message: "글 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        return {data: post, code: 200, message: '글 읽기 완료'};
    }


    
}

const postService = new PostService();
module.exports = postService;