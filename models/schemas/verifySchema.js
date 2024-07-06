const {Schema} = require('mongoose');
const verifySchema = new Schema({
    code: {
        type: String,
        required: true
    },
    data: {
        type: String,
        required: true
    },
    secret: {
        type: String,
        required: true
    },
    is_verified: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
});

module.exports = verifySchema;