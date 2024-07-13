const mongoose = require('mongoose');
const userSchema = require('./schemas/userSchema');
const verifySchema = require('./schemas/verifySchema');
const postSchema = require('./schemas/postSchema');

// userSchema, verifySchema 모델링
exports.User = mongoose.model('User', userSchema);
exports.Verify = mongoose.model('Verify', verifySchema);
exports.Post = mongoose.model('Post', postSchema);