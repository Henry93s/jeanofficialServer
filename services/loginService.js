const {Verify, User} = require('../models');
const code = require('../utils/data/code');
const generateRandomValue = require('../utils/generate-random-value');
const crypto = require('crypto');
const sendEmail = require('../utils/nodemailer');

class LoginService {
    // 임시 비밀번호 발급 요청
    async tempPassword({email}){
        const user = await User.findOne({email});
        // 이메일로 조회된 user 가 없을 경우 회원가입을 먼저 유도
        if(!user){
            const error = new Error();
            Object.assign(error,{code: 404, message: "회원가입이 되지 않은 이메일입니다."});
            throw error;
        }

        // 임시 비밀번호 발급
        const secret = generateRandomValue(code.PASSWORD);
        const verify = await Verify.findOne({data: email, code: code.PASSWORD});
        // 임시 비밀번호를 요청하고 다시 요청했을 경우 기존 verify 에서 secret 만 변경
        // 기존에 요청한 임시 비밀번호가 없다면 verify create 하고 
        if(verify){
            await Verify.updateOne(verify, {secret: secret});   
        } else {
            await Verify.create({data: email, code: code.PASSWORD, secret: secret});
        }
        // user 비밀번호를 임시 비밀번호로 변경, is_passwordReset === true 설정
        const hash = crypto.createHash('sha256').update(secret).digest('hex');
            await User.updateOne(user, {
                password: hash,
                is_passwordReset: true
        });

        // nodemailer sendemail
        const subject = `1조 쇼핑몰 임시 비밀번호를 확인해주세요.`;
        const text = `임시 비밀번호 : ${secret} \n 임시 비밀번호로 로그인 시 비밀번호를 변경하여야 합니다.`;
        const result = await sendEmail(email, subject, text);
        if(result === 1){
            return {code: 200, message: "임시 비밀번호가 정상적으로 발급되었습니다. 이메일을 확인해주세요."};
        } else {
            const error = new Error();
            Object.assign(error,{code: 400, message: "임시 비밀번호가 발급되지 않았습니다."});
            throw error;
        }
    }

    // 임시 비밀번호로 첫 로그인 성공 후 비밀번호 변경 요청
    async tempPasswordChange({user, password, password_confirm}){
        // 비밀번호와 비밀번호 확인 값 일치여부 체크
        if(password !== password_confirm){
            const error = new Error();
            Object.assign(error,{code: 400, message: "새 비밀번호가 비밀번호 확인과 일치하지 않습니다."});
            throw error;
        }

        // 정상적으로 새 비밀번호를 입력했을 때 user 의 password_Reset 을 false 로 초기화
        // 및 새 비밀번호 부여
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        await User.updateOne({email: user.email}, {
            password: hash,
            is_passwordReset: false
        });
        // verify data 제거
        await Verify.deleteMany({data:user.email, code: code.PASSWORD});
        return {code: 200, message: "비밀번호가 정상적으로 변경되었습니다."};
    }
}

const loginService = new LoginService();
module.exports = loginService;