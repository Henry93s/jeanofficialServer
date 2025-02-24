const {User, Verify, Post} = require('../models');
const code = require('../utils/data/code');
const generateRandomValue = require('../utils/generate-random-value');
const sendEmail = require('../utils/nodemailer');
// sha256 단방향 해시 비밀번호 사용
const crypto = require('crypto');

class UserService {
    /* create (bodyData : required: true -> email, name, password */
    async createUser(bodyData){
        const {email} = bodyData;
        // 이메일 인증이 정상적으로 되었는지(is_verified === true) 검사
        const verify = await Verify.findOne({data: email, code: code.VERIFYCODE});
        if(!verify){
            const error = new Error();
            Object.assign(error, {code: 401, message: "이메일 인증을 먼저 진행해주세요."});
            throw error;
        }
        if(!verify.is_verified){
            const error = new Error();
            Object.assign(error, {code: 401, message: "이메일 인증이 되지 않았습니다. 메일에서 인증 코드를 확인해주세요."});
            throw error;
        }
        // 닉네임 중복 확인(nickname - name(db))
        const {name} = bodyData;
        const nameUser = await User.findOne({name: name});
        if(nameUser){
            const error = new Error();
            Object.assign(error, {code: 400, message: "중복된 닉네임입니다. 닉네임을 변경해주세요."});
            throw error;
        };

        // 이메일 인증이 되었고 회원가입을 진행하므로 더 이상 쓸모가 없으므로 제거
        await Verify.deleteMany(verify);

        // sha256 단방향 해시 비밀번호 사용
        const hash = crypto.createHash('sha256').update(bodyData.password).digest('hex');
        const newUser = await User.create({
            email: bodyData.email,
            name: bodyData.name,
            password: hash,
            is_admin: false,
            is_passwordReset: false
        });
        return {code: 200, message: `${bodyData.email} 계정으로 회원가입이 성공하였습니다.`};
    }

    // 인증 요청 분리 *(비밀번호 찾기 - 이메일이 존재해야 다음 스텝으로 넘어가야 함)
    async pwfindVerify({email}){
        // 이메일 형식 체크
        if(!/^[a-zA-Z0-9+-\_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email)){
            const error = new Error();
            Object.assign(error, {code: 400, message: "이메일 형식을 다시 확인해주세요."})
            throw error;
        }
        // 인증 코드 받는 이메일이 이미 존재하는지 검사
        // 이메일 인증이 정식으로 들어갈 때 createUser 에 있는 이메일 존재 검사는 필요없음.
        const user = await User.findOne({email});
        // 기존 회원가입 인증 요청 부분과의 차이점
        if(!user){
            const error = new Error();
            Object.assign(error, {code: 400, message: "회원가입 되어 있지 않은 이메일입니다."});
            throw error;
        }

        // 기존 verify 데이터가 있을 시 새 secret 으로 변경
        const newSecret = generateRandomValue(code.VERIFYCODE);
        const verify = await Verify.findOne({data: email, code: code.VERIFYCODE});
        if(verify){
            await Verify.updateOne({data: email, code: code.VERIFYCODE, secret: newSecret});
        }
        else{
            // 기존 verify 가 없을 때 새 verify document 생성
            await Verify.create({data: email, code: code.VERIFYCODE, secret: newSecret});
        }

        // 이메일 전송
        const subject = "비밀번호 찾기 이메일 인증 코드를 확인해주세요.";
        const text = `이메일 인증 코드 : ${newSecret}`;
        const result = await sendEmail(email, subject, text);
        if(result === 1){
            return {code:200, message: "인증 코드가 정상 발송되었습니다."};
        }
        else{
            const error = new Error();
            Object.assign(error, {code: 400, message: "메일 인증 코드가 발송되지 않았습니다."})
            throw error;
        }
    }

    // 회원 가입 메일 인증 코드 발급
    async joinVerify({email}){
        // 이메일 형식 체크
        if(!/^[a-zA-Z0-9+-\_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email)){
            const error = new Error();
            Object.assign(error, {code: 400, message: "이메일 형식을 다시 확인해주세요."})
            throw error;
        }
        // 인증 코드 받는 이메일이 이미 존재하는지 검사
        // 이메일 인증이 정식으로 들어갈 때 createUser 에 있는 이메일 존재 검사는 필요없음.
        const user = await User.findOne({email});
        if(user){
            const error = new Error();
            Object.assign(error, {code: 400, message: "이미 회원가입 되어 있는 이메일입니다."});
            throw error;
        }

        // 기존 verify 데이터가 있을 시 새 secret 으로 변경
        const newSecret = generateRandomValue(code.VERIFYCODE);
        const verify = await Verify.findOne({data: email, code: code.VERIFYCODE});
        if(verify){
            await Verify.updateOne({data: email, code: code.VERIFYCODE, secret: newSecret});
        }
        else{
            // 기존 verify 가 없을 때 새 verify document 생성
            await Verify.create({data: email, code: code.VERIFYCODE, secret: newSecret});
        }

        // 이메일 전송
        const subject = "회원가입 이메일 인증 코드를 확인해주세요.";
        const text = `이메일 인증 코드 : ${newSecret}`;
        const result = await sendEmail(email, subject, text);
        if(result === 1){
            return {code:200, message: "인증 코드가 정상 발송되었습니다."};
        }
        else{
            const error = new Error();
            Object.assign(error, {code: 400, message: "메일 인증 코드가 발송되지 않았습니다."})
            throw error;
        }
    }

    // 회원 가입 이메일 인증 코드 확인 요청
    async joinVerifyConfirm({email, secret}){
        // 이메일 형식 체크
        if(!/^[a-zA-Z0-9+-\_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email)){
            const error = new Error();
            Object.assign(error, {code: 400, message: "이메일 형식을 다시 확인해주세요."})
            throw error;
        }

        // verify document find
        const verify = await Verify.findOne({data: email, code: code.VERIFYCODE});
        if(!verify){
            const error = new Error();
            Object.assign(error, {code: 400, message: "이메일 인증을 먼저 진행해주세요."});
            throw error;
        }

        // 인증 코드 비교 진행( 정상 인증 코드로 판단 시 is_verified 를 true 로 변경하여 회원가입 절차가 가능하도록 함)
        if(secret === verify.secret){
            await Verify.updateOne({data: email, code: code.VERIFYCODE},{
                is_verified: true
            });
            return {code: 200, message: "이메일 인증 코드가 정상적으로 확인되었습니다."}
        } else {
            await Verify.updateOne({data: email, code: code.VERIFYCODE},{
                is_verified: false
            });
            const error = new Error();
            Object.assign(error, {code: 400, message: "이메일 인증 코드를 다시 확인해주세요."});
            throw error;
        }
    }

    // find all
    async findAllUser(){
        const users = await User.find();
        return users;
    }

    // findOne by email
    async findByEmail({email}) {
        const user = await User.findOne({email});
        if(!user){
            const error = new Error();
            Object.assign(error, {data: [], code: 404, message: "이메일로 조회된 회원이 없습니다."})
            throw error;
        }
        return {data: user, code: 200, message: "사용자 조회 완료"};
    }

    // update by email (bodyData : name or password)
    async updateByEmail({email}, bodyData){
        // 닉네임 중복 체크 후 업데이트
        if(bodyData.name){
            const {name} = bodyData;
            const nameUser = await User.findOne({name: name});
            if(nameUser){
                const error = new Error();
                Object.assign(error, {code: 400, message: "중복된 닉네임입니다. 닉네임을 변경해주세요."});
                throw error;
            };
        }
        
        const user = await User.findOne({email});
        if(!user){
            const error = new Error();
            Object.assign(error, {code: 404, message: "이메일로 조회된 회원이 없습니다."})
            throw error;
        } else {
            // sha256 단방향 해시 비밀번호 사용
            if(bodyData.password){
                // sha256 단방향 해시 비밀번호 사용
                const hash = crypto.createHash('sha256').update(bodyData.password).digest('hex');
                bodyData.password = hash
            }
            // update 날짜 부여
            bodyData.update_at = new Date().toLocaleString();

            Reflect.deleteProperty(bodyData, "email");
            Reflect.deleteProperty(bodyData, "nanoid");
            await User.updateOne(user, bodyData);
            return {code: 200, message: `${email} 사용자 수정 동작 완료`};
        }
    }

    // delete by email
    // 회원 탈퇴 시 1. 작성한 글 데이터 삭제 !!
    async deleteByEmail({email}) {
        const user = await User.findOne({email});
        if(!user){
            const error = new Error();
            Object.assign(error, {code: 404, message: "이메일로 조회된 회원이 없습니다."})
            throw error;
        } else {
            await Post.deleteMany({author: user});
            await User.deleteOne(user);
            
            return {code: 200, message: `${email} 사용자 삭제 동작 완료`};
        }
    }
}

const userService = new UserService();
module.exports = userService;