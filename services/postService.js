const {User, Post} = require('../models');

class PostService {
    // 전체 글 중 1 페이지 또는 특정 페이지의 글 리스트 가져오기 (완료)
    async getAllposts({nowpage}){
        const page = Number(nowpage);
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

    // 내 글 중 1 페이지 또는 특정 페이지의 글 리스트 가져오기 (완료)
    async getMyposts({email, nowpage}){ 
        const author = await User.findOne({email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        const page = Number(nowpage);
        const perPage = 10; 
        // 여기서 sort 는 몽구스 전용 sort !
        const posts = await Post.find({author: author}).sort(({createAt: -1})).skip(perPage * (page - 1))
        .limit(perPage).populate('author');
        // pupulate 를 추가하여 User 의 objectID 와 같은 데이터를 JOIN
        const total = await Post.countDocuments({author: author});
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

    // 검색어와 검색 타겟(셀렉트 박스) 에 맞는 글 리스트 가져오기 (완료)
    async getSearchPosts({search, searchtarget, nowpage}) {
        const page = Number(nowpage);
        const perPage = 10; 
        // search(검색어), searchtarget(검색 타겟 셀렉트 박스) 값 추출 작업 
        const dbtarget = searchtarget === "작성자" ? "name" 
        : searchtarget === "제목" ? "title" 
        : "content";

        const posts = await Post.find().sort(({createAt: -1})).skip(perPage * (page - 1))
        .limit(perPage).populate('author');

        // 일단 전체 글을 가져오고 filter 로 검색어 검색 타겟에 맞는 데이터 추출 작업 진행함
        const retPosts = posts.filter(v => {
            // searchtarget 이 작성자.이름(닉네임) 일 때
            if(dbtarget === "name" && v['author'][dbtarget].includes(search)){
                return v;
            }
            // searchtarget 이 제목 또는 내용 일 때 
            if(dbtarget !== "name" && v[dbtarget].includes(search)) {
                return v;
            }
        });
        const total = retPosts.length;
        const totalPage = Math.ceil(total/perPage);
    
        const data = {
            page: page,
            perPage: perPage,
            total: total,
            posts: retPosts,
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

    // 글 수정 (완료)
    async putPost({email, title, content, nanoid}){
        const author = await User.findOne({email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        const post = await Post.findOne({nanoid}).populate('author');
        if(!post) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "글 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        if(post.author.email !== email) { 
            const error = new Error();
            Object.assign(error, {code: 403, message: "글 작성자가 아닙니다. 다시 확인해주세요."});
            throw error;
        }
        const updateAt = new Date().toLocaleString();
        const data = await Post.updateOne({nanoid},{title, content, updateAt});
        console.log(data);
        return {data: data, code: 200, message: `글 수정 완료`};
    }

    // 글 삭제 (완료)
    async delPost({email, nanoid}){
        const author = await User.findOne({email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        const post = await Post.findOne({nanoid}).populate('author');
        if(!post) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "글 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        if(post.author.email !== email) { 
            const error = new Error();
            Object.assign(error, {code: 403, message: "글 작성자가 아닙니다. 다시 확인해주세요."});
            throw error;
        }
        const data = await Post.deleteOne({nanoid});
        console.log(data);
        return {data: data, code: 200, message: `글 삭제 완료`};
    }

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