const {User, Post, Like} = require('../models');

class PostService {
    // 전체 글 중 1 페이지 또는 특정 페이지의 글 리스트 가져오기 (완료)
    async getAllposts({nowpage, likesort}){
        const page = Number(nowpage);
        const perPage = 10;
        // 좋아요 순 정렬 되어 있을 때 와 아닐 때 정렬 구분하여 처리
        let posts = [];

        if(likesort === "true"){
            posts = await Post.find().sort(({up: -1})).skip(perPage * (page - 1))
            .limit(perPage).populate('author');
        } else {
            posts = await Post.find().sort(({createAt: -1})).skip(perPage * (page - 1))
            .limit(perPage).populate('author');
        }
        
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
    async getMyposts({email, nowpage, likesort}){ 
        const author = await User.findOne({email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        const page = Number(nowpage);
        const perPage = 10; 

        // skip(n): 처음 n개의 요소를 건너뜀
        // limit(n): n개의 요소만 가져옴
        // 좋아요 순 정렬 되어 있을 때 와 아닐 때 정렬 구분하여 처리
        let posts = [];
        if(likesort === "true"){
            posts = await Post.find({author: author}).sort(({up: -1})).skip(perPage * (page - 1))
            .limit(perPage).populate('author');
        } else {
            posts = await Post.find({author: author}).sort(({createAt: -1})).skip(perPage * (page - 1))
            .limit(perPage).populate('author');
        }

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
    async getSearchPosts({search, searchtarget, nowpage, likesort}) {
        const page = Number(nowpage);
        const perPage = 10; 
        // search(검색어), searchtarget(검색 타겟 셀렉트 박스) 값 추출 작업 
        const dbtarget = searchtarget === "작성자" ? "name" 
        : searchtarget === "제목" ? "title" 
        : "content";

        const posts = await Post.find().populate('author');

        // 일단 전체 글을 가져오고 filter 로 검색어 검색 타겟에 맞는 데이터 추출 작업 진행함
        const fetchPosts = posts.filter(v => {
            // searchtarget 이 작성자.이름(닉네임) 일 때
            if(dbtarget === "name" && v['author'][dbtarget].includes(search)){
                return v;
            }
            // searchtarget 이 제목 또는 내용 일 때 
            if(dbtarget !== "name" && v[dbtarget].includes(search)) {
                return v;
            }
        });

        // 좋아요 순 정렬 되어 있을 때 와 아닐 때 정렬 구분하여 처리
        // 정렬과 페이지 처리를 db 가 아닌 전체 글을 가져온 배열에서 자바스크립트 문법으로 진행함.
        let retPosts = [];
        if(likesort === "true"){
            retPosts = fetchPosts.sort((a, b) => b.up - a.up)
            .slice(perPage * (page - 1), perPage * page);
        } else {
            retPosts = fetchPosts.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))
            .slice(perPage * (page - 1), perPage * page);
        }

        const total = fetchPosts.length;
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

    // 좋아요 기능 요청 동작 (한번 클릭 시 up, 또 같은 계정으로 같은 글 up 시 up을 취소) (완료)
    async upPost({email, nanoid}){
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

        const data = await Like.findOne({email: email, post_nanoid: nanoid});
        if(!data) {
            // up 하지 않은 게시물 로 up 데이터 추가
            await Like.create({email: email, post_nanoid: nanoid});
            // post 의 + up 계산
            const up = post.up;
            await Post.updateOne({nanoid}, {up: up + 1});
            return {code: 200, message: '좋아요를 추가하였습니다!'};
        } else {
            // 이미 up 한 게시물 로 up 데이터 제거
            await Like.deleteOne({email: email, post_nanoid: nanoid});
            // post 의 - up 계산
            const up = post.up;
            await Post.updateOne({nanoid}, {up: up - 1});
            return {code: 200, message: '좋아요를 삭제하였습니다!'};
        }
    }
    
}

const postService = new PostService();
module.exports = postService;