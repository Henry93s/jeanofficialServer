module.exports = (req, res, next) => {

    const {email, password} = req.body;
    if(!email || !password){
        const error = new Error();
        Object.assign(error, {code: 400, message: "이메일 혹은 패스워드를 입력하세요."})
        throw error;
    }

    if(!/^[a-zA-Z0-9+-\_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email)){
        const error = new Error();
        Object.assign(error, {code: 400, message: "이메일 형식을 다시 확인해주세요."})
        throw error;
        
    }
    next();
}


