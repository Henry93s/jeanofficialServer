const mongoose = require('mongoose');
const userSchema = require('./schemas/userSchema');
const verifySchema = require('./schemas/verifySchema');

// userSchema, verifySchema 모델링
exports.User = mongoose.model('User', userSchema);
exports.Verify = mongoose.model('Verify', verifySchema);