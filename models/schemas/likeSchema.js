const {Schema} = require('mongoose');

const likeSchema = new Schema({
    post_nanoid: {
        type: String,
        require: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true
    }
},{
    timestamps: true
});

module.exports = likeSchema;