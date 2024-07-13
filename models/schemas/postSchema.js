const {Schema} = require('mongoose');
const {nanoid} = require('nanoid');
// 중복 없는 문자열을 생성해주는 nanoid
// 추가 또는 수정될 때마다 날짜 데이터를 만들어주는 newDate()
const newDate = require('../../utils/newDate');

const postSchema = new Schema({
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        require: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        index: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    createAt: {
        type: String,
        default: () => { return newDate() },
        require: true
    },
    updateAt: {
        type: String,
        default: () => { return newDate() },
        require: true
    },
    up: {
        type: Number,
        default: 0
    },
    down: {
        type: Number,
        default: 0
    }
},{
    timestamps: true
});

module.exports = postSchema;